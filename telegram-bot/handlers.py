import asyncio
import logging
import subprocess

from aiogram import Bot, F, Router
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types import BufferedInputFile, CallbackQuery, Message

import api_client
import sessions
from keyboards import (
    DOWNLOAD_PREFIX,
    EDUCATION_LEVEL_PREFIX,
    SUBJECT_PREFIX,
    education_level_keyboard,
    my_podcasts_keyboard,
    subject_keyboard,
)
from states import LoginStates, UploadStates

logger = logging.getLogger(__name__)

router = Router()


@router.message(Command("start"))
async def cmd_start(message: Message) -> None:
    session = sessions.get_session(message.from_user.id)
    status = f"You are logged in as {session.login}." if session else "You are not logged in yet."

    await message.answer(
        "Welcome to the EduCast bot!\n\n"
        f"{status}\n\n"
        "Commands:\n"
        "/login - sign in with your EduCast account\n"
        "/upload - upload an educational audio to EduCast\n"
        "/my - list the podcasts you've uploaded\n"
        "/cancel - cancel the current action"
    )


@router.message(Command("cancel"))
async def cmd_cancel(message: Message, state: FSMContext) -> None:
    if await state.get_state() is None:
        await message.answer("Nothing to cancel.")
        return

    await state.clear()
    await message.answer("Cancelled.")


@router.message(Command("login"))
async def cmd_login(message: Message, state: FSMContext) -> None:
    await state.set_state(LoginStates.waiting_email)
    await message.answer("Please send the email of your EduCast account.")


@router.message(Command("upload"))
async def cmd_upload(message: Message, state: FSMContext) -> None:
    if sessions.get_session(message.from_user.id) is None:
        await message.answer("You need to /login first.")
        return

    await state.set_state(UploadStates.waiting_audio)
    await message.answer("Send the audio file you want to upload (as audio, voice message, or document).")


@router.message(Command("my"))
async def cmd_my(message: Message) -> None:
    session = sessions.get_session(message.from_user.id)
    if session is None:
        await message.answer("You need to /login first.")
        return

    try:
        podcasts = await api_client.list_my_podcasts(session.token)
    except api_client.ApiError as error:
        await message.answer(f"Failed to fetch your podcasts: {error}")
        return

    if not podcasts:
        await message.answer("You haven't uploaded any podcasts yet. Send /upload to publish one.")
        return

    lines = [
        f"• {p['title']} — {p['subject']}, {p['durationSeconds']}s"
        for p in podcasts
    ]
    await message.answer(
        "Your podcasts:\n\n" + "\n".join(lines) + "\n\nTap a button below to download the audio:",
        reply_markup=my_podcasts_keyboard(podcasts),
    )


_EXTENSION_BY_CONTENT_TYPE = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/x-m4a": "m4a",
    "audio/mp4": "m4a",
    "audio/aac": "aac",
}


@router.callback_query(F.data.startswith(DOWNLOAD_PREFIX))
async def process_download(callback: CallbackQuery) -> None:
    podcast_id = callback.data.removeprefix(DOWNLOAD_PREFIX)
    await callback.answer()

    try:
        content, content_type = await api_client.get_podcast_audio(int(podcast_id))
    except api_client.ApiError as error:
        await callback.message.answer(f"Failed to fetch audio: {error}")
        return

    extension = _EXTENSION_BY_CONTENT_TYPE.get(content_type, "mp3")
    audio_file = BufferedInputFile(content, filename=f"podcast_{podcast_id}.{extension}")
    await callback.message.answer_audio(audio_file)


@router.message(StateFilter(LoginStates.waiting_email))
async def process_login_email(message: Message, state: FSMContext) -> None:
    email = (message.text or "").strip()
    if not email:
        await message.answer("Email can't be empty. Please send your email.")
        return

    await state.update_data(email=email)
    await state.set_state(LoginStates.waiting_password)
    await message.answer("Now send your password.")


@router.message(StateFilter(LoginStates.waiting_password))
async def process_login_password(message: Message, state: FSMContext, bot: Bot) -> None:
    password = message.text or ""
    data = await state.get_data()
    email = data["email"]

    try:
        await message.delete()
    except Exception:
        logger.debug("Could not delete password message", exc_info=True)

    try:
        result = await api_client.login(email, password)
    except api_client.ApiError as error:
        await message.answer(f"Login failed: {error}\nSend /login to try again.")
        return
    finally:
        await state.clear()

    sessions.set_session(
        message.from_user.id,
        sessions.Session(token=result["token"], email=result["email"], login=result["login"]),
    )
    await message.answer(f"Logged in as {result['login']}. Send /upload to publish a podcast.")


def _resolve_audio(message: Message) -> tuple[str, str, str, bool] | None:
    if message.voice:
        return message.voice.file_id, "voice.ogg", "audio/ogg", True
    if message.audio:
        audio = message.audio
        return audio.file_id, audio.file_name or "audio.mp3", audio.mime_type or "audio/mpeg", False
    if message.document:
        document = message.document
        return document.file_id, document.file_name or "audio.mp3", document.mime_type or "audio/mpeg", False
    return None


def _transcode_voice_to_mp3(ogg_bytes: bytes) -> bytes:
    # Telegram voice messages are Opus-in-Ogg, which the backend's audio
    # metadata reader (jaudiotagger) can't parse, so re-encode to MP3 first.
    result = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", "pipe:0", "-f", "mp3", "pipe:1"],
        input=ogg_bytes,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    return result.stdout


@router.message(StateFilter(UploadStates.waiting_audio))
async def process_upload_audio(message: Message, state: FSMContext, bot: Bot) -> None:
    resolved = _resolve_audio(message)
    if resolved is None:
        await message.answer("That's not an audio file. Please send an audio file, voice message, or document.")
        return

    file_id, filename, content_type, is_voice = resolved
    telegram_file = await bot.get_file(file_id)
    buffer = await bot.download_file(telegram_file.file_path)
    content = buffer.read()

    if is_voice:
        try:
            content = await asyncio.to_thread(_transcode_voice_to_mp3, content)
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.exception("Failed to transcode voice message")
            await message.answer(
                "Couldn't process the voice message. Please try again or send it as a regular audio file."
            )
            return
        filename, content_type = "voice.mp3", "audio/mpeg"

    await state.update_data(filename=filename, content_type=content_type, content=content)
    await state.set_state(UploadStates.waiting_title)
    await message.answer("Got it. Now send the podcast title.")


@router.message(StateFilter(UploadStates.waiting_title))
async def process_upload_title(message: Message, state: FSMContext) -> None:
    title = (message.text or "").strip()
    if not title:
        await message.answer("Title can't be empty. Please send the podcast title.")
        return

    await state.update_data(title=title)
    await state.set_state(UploadStates.waiting_description)
    await message.answer("Now send the podcast description.")


@router.message(StateFilter(UploadStates.waiting_description))
async def process_upload_description(message: Message, state: FSMContext) -> None:
    description = (message.text or "").strip()
    if not description:
        await message.answer("Description can't be empty. Please send the podcast description.")
        return

    await state.update_data(description=description)
    await state.set_state(UploadStates.waiting_subject)
    await message.answer("Pick a subject:", reply_markup=subject_keyboard())


@router.callback_query(StateFilter(UploadStates.waiting_subject), F.data.startswith(SUBJECT_PREFIX))
async def process_upload_subject(callback: CallbackQuery, state: FSMContext) -> None:
    subject = callback.data.removeprefix(SUBJECT_PREFIX)
    await state.update_data(subject=subject)
    await state.set_state(UploadStates.waiting_education_level)
    await callback.message.edit_text(f"Subject: {subject.title().replace('_', ' ')}")
    await callback.message.answer("Pick an education level:", reply_markup=education_level_keyboard())
    await callback.answer()


@router.callback_query(StateFilter(UploadStates.waiting_education_level), F.data.startswith(EDUCATION_LEVEL_PREFIX))
async def process_upload_education_level(callback: CallbackQuery, state: FSMContext) -> None:
    education_level = callback.data.removeprefix(EDUCATION_LEVEL_PREFIX)
    await callback.message.edit_text(f"Education level: {education_level.title()}")
    await callback.answer()

    data = await state.get_data()
    session = sessions.get_session(callback.from_user.id)
    await state.clear()

    if session is None:
        await callback.message.answer("You are not logged in anymore. Send /login and then /upload again.")
        return

    await callback.message.answer("Processing your recording...")
    try:
        podcast = await api_client.upload_podcast(
            token=session.token,
            filename=data["filename"],
            content_type=data["content_type"],
            content=data["content"],
            title=data["title"],
            description=data["description"],
            subject=data["subject"],
            education_level=education_level,
        )
    except api_client.ApiError as error:
        tags = ", ".join(podcast.get("tags") or []) or "none"
        is_educational = podcast.get("isEducational")
        verdict = "yes" if is_educational else "no" if is_educational is False else "unknown"

        reason = podcast.get("validationReason") or "—"

        await callback.message.answer(
            "Uploaded successfully!\n\n"
            f"Title: {podcast['title']}\n"
            f"Subject: {podcast['subject']}\n"
            f"Tags: {tags}\n"
            f"Recognized as educational: {verdict}\n"
            f"Reason: {reason}"
        )
    except Exception:
        logger.exception("Unexpected error while uploading podcast")
        await callback.message.answer("Failed to upload. Please try again.")
        return

    tags = ", ".join(podcast.get("tags") or []) or "none"
    is_educational = podcast.get("isEducational")
    verdict = "yes" if is_educational else "no" if is_educational is False else "unknown"

    reason = podcast.get("validationReason") or "—"

    await callback.message.answer(
        "Uploaded successfully!\n\n"
        f"Title: {podcast['title']}\n"
        f"Subject: {podcast['subject']}\n"
        f"Tags: {tags}\n"
        f"Recognized as educational: {verdict}\n"
        f"Reason: {reason}"
    )
