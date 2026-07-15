import os

from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
if not BOT_TOKEN:
    raise RuntimeError("TELEGRAM_BOT_TOKEN is not set")

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8080").rstrip("/")

SESSIONS_DB_PATH = os.getenv("SESSIONS_DB_PATH", "sessions.db")
