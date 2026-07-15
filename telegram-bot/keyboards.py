from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

# Keep in sync with backend/src/main/java/com/educast/capstone/Entity/Subject.java
SUBJECTS = [
    "BIOLOGY",
    "CHEMISTRY",
    "PHYSICS",
    "MATHEMATICS",
    "GEOGRAPHY",
    "HISTORY",
    "LITERATURE",
    "COMPUTER_SCIENCE",
    "ECONOMICS",
    "MATHEMATICAL_ANALYSIS",
    "PHILOSOPHY",
    "PSYCHOLOGY",
    "LAW",
    "BUSINESS",
    "LANGUAGES",
    "ART",
    "MUSIC",
    "PHYSICAL_EDUCATION",
    "SOCIOLOGY",
    "OTHER",
]

# Keep in sync with backend/src/main/java/com/educast/capstone/Entity/EducationLevel.java
EDUCATION_LEVELS = ["SCHOOL", "UNIVERSITY"]

SUBJECT_PREFIX = "subject:"
EDUCATION_LEVEL_PREFIX = "edulevel:"
DOWNLOAD_PREFIX = "download:"


def subject_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for subject in SUBJECTS:
        builder.add(InlineKeyboardButton(text=subject.title().replace("_", " "), callback_data=f"{SUBJECT_PREFIX}{subject}"))
    builder.adjust(2)
    return builder.as_markup()


def education_level_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for level in EDUCATION_LEVELS:
        builder.add(InlineKeyboardButton(text=level.title(), callback_data=f"{EDUCATION_LEVEL_PREFIX}{level}"))
    builder.adjust(2)
    return builder.as_markup()


def my_podcasts_keyboard(podcasts: list[dict]) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for podcast in podcasts:
        builder.row(
            InlineKeyboardButton(
                text=f"⬇️ {podcast['title']}",
                callback_data=f"{DOWNLOAD_PREFIX}{podcast['id']}",
            )
        )
    return builder.as_markup()
