"""
EduCast ML service
==================
Эндпоинты:
  POST /process-audio — аудио -> транскрипция + теги + валидация
  POST /validate-text — debug: проверить ТОЛЬКО валидацию на готовом тексте
                               (удобно, чтобы тестить фильтр без записи аудио)

Настройки и словарь вынесены в config.json.
"""

import os
import json
import tempfile
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from faster_whisper import WhisperModel
import yake

try:
    from openai import OpenAI
except Exception:
    OpenAI = None


# ----------------------------- КОНФИГ -----------------------------

CONFIG = json.loads((Path(__file__).parent / "config.json").read_text(encoding="utf-8"))

W = CONFIG["whisper"]
DOMAIN_TERMS = CONFIG["domain_terms"]
EDU_MARKERS = [m.lower() for m in CONFIG["educational_markers"]]
LLM_CFG = CONFIG["llm"]

DOMAIN_PROMPT = (
    "Лекция по программированию и информатике. Термины: "
    + ", ".join(DOMAIN_TERMS) + "."
)


# ----------------------------- МОДЕЛИ -----------------------------

model = WhisperModel(W["model"], device=W["device"], compute_type=W["compute_type"])

# LLM-клиент (Ollama или DeepSeek — зависит от config.json)
_llm = None
if LLM_CFG.get("enabled") and OpenAI is not None:
    api_key = os.getenv(LLM_CFG["api_key_env"], "") or "ollama"
    _llm = OpenAI(base_url=LLM_CFG["base_url"], api_key=api_key)


app = FastAPI(title="EduCast ML service")
ALLOWED = {".mp3", ".wav", ".m4a", ".ogg", ".mp4", ".webm", ".flac"}


# ---------------------------- ЭНДПОИНТЫ ----------------------------

@app.post("/process-audio")
async def process_audio(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED:
        raise HTTPException(400, detail=f"Unsupported format: {ext}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(
            tmp_path,
            language=W["language"] or None,
            vad_filter=True,
            beam_size=5,
            initial_prompt=DOMAIN_PROMPT,
        )
        text = " ".join(s.text.strip() for s in segments).strip()
        duration, lang = info.duration, info.language
    finally:
        os.unlink(tmp_path)

    is_edu, reason, subject = is_educational(text, duration)
    tags = extract_tags(text, lang)
    if subject and subject not in tags:
        tags.insert(0, subject)

    return {
        "language": lang,
        "duration_sec": round(duration, 1),
        "transcription": text,
        "is_educational": is_edu,
        "validation_reason": reason,
        "tags": tags,
    }


@app.post("/validate-text")
async def validate_text(text: str = Body(..., embed=True)):
    """Быстрый тест валидации без аудио. Пример тела запроса:
    {"text": "сегодня разберём сортировку пузырьком и её сложность"}"""
    is_edu, reason, subject = is_educational(text, duration_sec=999)
    return {"is_educational": is_edu, "validation_reason": reason, "subject": subject}


# ============================== ТЕГИ ==============================

def extract_tags(text: str, lang: str = "en", max_tags: int = 8):
    if not text.strip():
        return []
    lang = "ru" if lang == "ru" else "en"
    kw = yake.KeywordExtractor(lan=lang, top=max_tags, n=2)
    return [k for k, _score in kw.extract_keywords(text)]


# =========================== ВАЛИДАЦИЯ ===========================

SYSTEM_PROMPT = (
    "You classify whether a transcript is genuine EDUCATIONAL/ACADEMIC content "
    "(a lecture, explanation, tutorial, problem-solving, study notes). "
    "NOT educational: casual chat, vlog talk, entertainment, ads, music, "
    "personal messages, random noise or gibberish. Be strict. "
    "Reply ONLY as JSON: "
    '{"educational": true|false, "confidence": 0.0-1.0, '
    '"subject": "short topic or empty", "reason": "one short sentence"}.'
)


def looks_like_garbage(text: str) -> bool:
    words = text.lower().split()
    if len(words) < 8:
        return True
    most = max(set(words), key=words.count)
    if words.count(most) / len(words) > 0.3:   
        return True
    return False


def validate_with_llm(text: str) -> dict:
    resp = _llm.chat.completions.create(
        model=LLM_CFG["model"],
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text[:6000]},
        ],
        temperature=0,
    )
    raw = resp.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(raw)


def keyword_fallback(text: str):
    low = text.lower()
    hits = sum(1 for w in EDU_MARKERS if w in low)
    if hits >= 1:
        return True, f"Keyword fallback: matched {hits} marker(s)", ""
    return False, "Keyword fallback: no educational markers", ""


def is_educational(text: str, duration_sec: float):
    if not text or duration_sec < 8 or looks_like_garbage(text):
        return False, "No meaningful educational speech detected", ""

    if _llm is not None:
        try:
            v = validate_with_llm(text)
            return bool(v.get("educational")), v.get("reason", ""), v.get("subject", "")
        except Exception:
            pass  

    return keyword_fallback(text)