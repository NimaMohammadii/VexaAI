"""Telegram bot entry point.

This bot shows a main menu with three categories and, upon selection, a list of
20 video placeholders with a back button to return to the main menu.
"""
from __future__ import annotations

import logging
import os
import re
from typing import Final, List

from telegram import ReplyKeyboardMarkup, Update
from telegram.ext import (
    AIORateLimiter,
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)

LOGGER = logging.getLogger(__name__)

MAIN_MENU_OPTIONS: Final[List[str]] = [
    "جدیدترین ها 😈",
    "پر بازدیدترین ها 😋",
    "داغ‌ترینا 🤤",
]

BACK_BUTTON_LABEL: Final[str] = "⬅️ بازگشت"

VIDEO_SELECTION_PATTERN: Final[re.Pattern[str]] = re.compile(r"^Video \\d+$")
BACK_BUTTON_PATTERN: Final[re.Pattern[str]] = re.compile("^" + re.escape(BACK_BUTTON_LABEL) + "$")
MAIN_MENU_PATTERN: Final[re.Pattern[str]] = re.compile(
    "^(" + "|".join(map(re.escape, MAIN_MENU_OPTIONS)) + ")$"
)


def build_main_menu() -> ReplyKeyboardMarkup:
    """Return the reply keyboard markup for the main menu."""

    return ReplyKeyboardMarkup(
        [[option] for option in MAIN_MENU_OPTIONS],
        resize_keyboard=True,
        one_time_keyboard=False,
    )


def build_video_menu() -> ReplyKeyboardMarkup:
    """Return the reply keyboard markup for the video list."""

    video_buttons = [f"Video {index}" for index in range(1, 21)]
    keyboard_rows = [video_buttons[i : i + 2] for i in range(0, len(video_buttons), 2)]
    keyboard_rows.append([BACK_BUTTON_LABEL])
    return ReplyKeyboardMarkup(
        keyboard_rows,
        resize_keyboard=True,
        one_time_keyboard=False,
    )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /start command and show the main menu."""

    if update.effective_chat is None:
        return

    await update.effective_chat.send_message(
        "سلام! یکی از گزینه‌های منوی اصلی رو انتخاب کن.",
        reply_markup=build_main_menu(),
    )


async def handle_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle selections from the main menu."""

    if update.message is None:
        return

    selection = update.message.text
    if selection not in MAIN_MENU_OPTIONS:
        return

    await update.message.reply_text(
        f"شما گزینهٔ {selection} رو انتخاب کردید. یکی از ویدیوها رو انتخاب کن.",
        reply_markup=build_video_menu(),
    )


async def handle_video_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle selections from the video menu and provide navigation."""

    if update.message is None:
        return

    text = update.message.text
    if text == BACK_BUTTON_LABEL:
        await update.message.reply_text(
            "به منوی اصلی برگشتی. یکی از گزینه‌ها رو انتخاب کن.",
            reply_markup=build_main_menu(),
        )
        return

    if text and VIDEO_SELECTION_PATTERN.match(text):
        await update.message.reply_text(
            f"{text} رو انتخاب کردی. به زودی اطلاعات بیشتری اضافه میشه!",
            reply_markup=build_video_menu(),
        )


def build_application(token: str) -> Application:
    """Create the Telegram application instance."""

    return (
        Application.builder()
        .token(token)
        .rate_limiter(AIORateLimiter())
        .build()
    )


def main() -> None:
    """Start the bot."""

    token = os.environ.get("BOT_TOKEN")
    if not token:
        raise RuntimeError("BOT_TOKEN environment variable is not set")

    application = build_application(token)

    application.add_handler(CommandHandler("start", start))
    application.add_handler(
        MessageHandler(filters.TEXT & filters.Regex(VIDEO_SELECTION_PATTERN), handle_video_menu)
    )
    application.add_handler(
        MessageHandler(filters.TEXT & filters.Regex(BACK_BUTTON_PATTERN), handle_video_menu)
    )
    application.add_handler(
        MessageHandler(filters.TEXT & filters.Regex(MAIN_MENU_PATTERN), handle_main_menu)
    )

    LOGGER.info("Bot started. Waiting for messages...")
    application.run_polling()


if __name__ == "__main__":
    main()
