from aiogram.fsm.state import State, StatesGroup


class LoginStates(StatesGroup):
    waiting_email = State()
    waiting_password = State()


class UploadStates(StatesGroup):
    waiting_audio = State()
    waiting_title = State()
    waiting_description = State()
    waiting_subject = State()
    waiting_education_level = State()
