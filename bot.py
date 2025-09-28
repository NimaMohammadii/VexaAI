"""Telegram bot entry point for downloading Instagram media."""
from __future__ import annotations

import asyncio
import logging
import os
from typing import List

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from instagram import (
    InstagramDownloadError,
    MediaItem,
    extract_instagram_urls,
    fetch_instagram_media,
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
LOGGER = logging.getLogger(__name__)

load_dotenv()

TOKEN_ENV_VAR = "TELEGRAM_BOT_TOKEN"


def _get_bot_token() -> str:
    token = os.getenv(TOKEN_ENV_VAR)
    if not token:
        raise RuntimeError(
            "Telegram bot token is missing. Export TELEGRAM_BOT_TOKEN as an environment variable."
        )
    return token


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /start command."""

    await update.message.reply_text(
        "سلام! 👋\nلینک پست یا ریل اینستاگرام رو برام بفرست تا برات دانلودش کنم."
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /help command."""

    await update.message.reply_text(
        "کافیه لینک پست یا ریل اینستاگرام رو ارسال کنی تا فایل برات برگردونده بشه."
    )


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle incoming text messages and respond with media if possible."""

    if not update.message or not update.message.text:
        return

    urls = extract_instagram_urls(update.message.text)
    if not urls:
        LOGGER.debug("No Instagram URLs detected in message: %s", update.message.text)
        return

    for url in urls:
        await _send_media_for_url(update, context, url)


async def _send_media_for_url(update: Update, context: ContextTypes.DEFAULT_TYPE, url: str) -> None:
    chat = update.effective_chat
    if not chat:
        return

    LOGGER.info("Processing Instagram URL from chat %s: %s", chat.id, url)

    try:
        media_items = await asyncio.get_running_loop().run_in_executor(
            None, fetch_instagram_media, url
        )
    except InstagramDownloadError as exc:
        await update.message.reply_text(
            f"⚠️ متاسفانه نتونستم مدیای اینستاگرام رو دانلود کنم: {exc}"
        )
        return
    except Exception as exc:  # noqa: BLE001
        LOGGER.exception("Unexpected error while fetching Instagram media: %s", exc)
        await update.message.reply_text(
            "❌ یه خطای غیرمنتظره رخ داد. لطفا بعداً دوباره امتحان کن."
        )
        return

    await _send_media_items(update, media_items)


async def _send_media_items(update: Update, media_items: List[MediaItem]) -> None:
    caption_sent = False
    for media in media_items:
        caption = media.caption if not caption_sent and media.caption else None
        try:
            if media.is_video:
                await update.message.reply_video(media.url, caption=caption)
            else:
                await update.message.reply_photo(media.url, caption=caption)
        except Exception as exc:  # noqa: BLE001
            LOGGER.exception("Failed to send media to Telegram: %s", exc)
            await update.message.reply_text(
                "ارسال فایل به تلگرام با خطا مواجه شد. لطفا دوباره تلاش کن."
            )
            return
        caption_sent = caption_sent or bool(caption)


async def _run_bot() -> None:
    """Create the Telegram application and keep polling for updates."""

    token = _get_bot_token()
    application = Application.builder().token(token).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    LOGGER.info("Starting Telegram bot...")

    await application.initialize()

    try:
        await application.updater.start_polling()
        await application.start()

        try:
            await asyncio.Future()
        except asyncio.CancelledError:
            LOGGER.info("Cancellation requested. Stopping bot gracefully...")
    finally:
        try:
            if application.updater and application.updater.running:
                await application.updater.stop()
        finally:
            if application.running:
                await application.stop()
            await application.shutdown()
    # Using ``async with`` ensures that initialize/start/shutdown hooks of the
    # application are executed correctly even on platforms (like Railway)
    # where the default event loop handling of ``run_polling`` can fail.
    async with application:
        await application.updater.start_polling()

        # Keep the bot running forever until the process receives a stop
        # signal (e.g. SIGTERM from the hosting platform).
        try:
            await asyncio.Future()
        except asyncio.CancelledError:
            # Hosting platforms typically cancel the main task on shutdown.
            # Swallow the cancellation so the context manager can handle
            # graceful teardown (stop/shutdown).
            pass


def main() -> None:
    asyncio.run(_run_bot())


if __name__ == "__main__":
    main()

