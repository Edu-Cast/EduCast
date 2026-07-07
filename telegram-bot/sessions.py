from dataclasses import dataclass


@dataclass
class Session:
    token: str
    email: str
    login: str


_sessions: dict[int, Session] = {}


def set_session(user_id: int, session: Session) -> None:
    _sessions[user_id] = session


def get_session(user_id: int) -> Session | None:
    return _sessions.get(user_id)


def clear_session(user_id: int) -> None:
    _sessions.pop(user_id, None)
