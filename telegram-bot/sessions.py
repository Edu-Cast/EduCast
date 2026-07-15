import os
import sqlite3
from dataclasses import dataclass

from config import SESSIONS_DB_PATH

os.makedirs(os.path.dirname(SESSIONS_DB_PATH) or ".", exist_ok=True)

_conn = sqlite3.connect(SESSIONS_DB_PATH, check_same_thread=False)
_conn.execute(
    """
    CREATE TABLE IF NOT EXISTS sessions (
        user_id INTEGER PRIMARY KEY,
        token TEXT NOT NULL,
        email TEXT NOT NULL,
        login TEXT NOT NULL
    )
    """
)
_conn.commit()


@dataclass
class Session:
    token: str
    email: str
    login: str


def set_session(user_id: int, session: Session) -> None:
    _conn.execute(
        """
        INSERT INTO sessions (user_id, token, email, login) VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET token=excluded.token, email=excluded.email, login=excluded.login
        """,
        (user_id, session.token, session.email, session.login),
    )
    _conn.commit()


def get_session(user_id: int) -> Session | None:
    row = _conn.execute(
        "SELECT token, email, login FROM sessions WHERE user_id = ?", (user_id,)
    ).fetchone()
    if row is None:
        return None
    return Session(token=row[0], email=row[1], login=row[2])


def clear_session(user_id: int) -> None:
    _conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
    _conn.commit()
