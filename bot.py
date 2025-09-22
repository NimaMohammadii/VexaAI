"""Telegram bot that generates images via the Runway API.

The bot listens for any text message, forwards the prompt to the Runway
text-to-image endpoint and replies with the generated picture. It requires
two environment variables:

```
RUNWAY_API=<your runway api key>
BOT_TOKEN=<your telegram bot token>
```

Run the bot with ``python bot.py``.
"""

from __future__ import annotations

import asyncio
import logging
import os
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional

import aiohttp
from aiohttp import ClientResponse
from telegram import Update
from telegram.constants import ChatAction
from telegram.ext import (Application, ApplicationBuilder, CommandHandler,
                          ContextTypes, MessageHandler, filters)


LOGGER = logging.getLogger(__name__)


class RunwayError(RuntimeError):
    """Raised when the Runway API returns an error state."""


@dataclass(slots=True)
class RunwayGeneration:
    """Represents the result of a Runway generation request."""

    prompt: str
    image_urls: List[str]


class RunwayClient:
    """Simple asynchronous Runway API client."""

    BASE_URL = "https://api.runwayml.com/v1"

    def __init__(
        self,
        api_key: str,
        *,
        session: aiohttp.ClientSession,
        poll_interval: float = 2.0,
        timeout: float = 180.0,
        model: str = "gen2",
    ) -> None:
        if not api_key:
            raise ValueError("Runway API key is required")
        if session is None:
            raise ValueError("aiohttp session is required")

        self._api_key = api_key
        self._session = session
        self._poll_interval = poll_interval
        self._timeout = timeout
        self._model = model

    async def close(self) -> None:
        """Close the underlying session if it's still open."""

        if not self._session.closed:
            await self._session.close()

    async def generate_image(
        self,
        prompt: str,
        *,
        aspect_ratio: str = "1:1",
    ) -> RunwayGeneration:
        """Request an image from the Runway API and wait for completion."""

        prompt = prompt.strip()
        if not prompt:
            raise ValueError("Prompt must not be empty")

        LOGGER.info("Creating Runway generation task")
        task = await self._create_task(prompt, aspect_ratio=aspect_ratio)
        task_id = task["id"]

        LOGGER.info("Polling Runway task %s", task_id)
        deadline = asyncio.get_running_loop().time() + self._timeout
        while True:
            task = await self._get_task(task_id)
            status = task.get("status", "").upper()
            LOGGER.debug("Task %s status %s", task_id, status)

            if status == "SUCCEEDED":
                image_urls = self._extract_image_urls(task)
                if not image_urls:
                    raise RunwayError("Runway task completed without image output")
                return RunwayGeneration(prompt=prompt, image_urls=image_urls)

            if status in {"FAILED", "CANCELED"}:
                message = task.get("error") or task.get("message") or "Runway task failed"
                raise RunwayError(f"Runway task {task_id} failed: {message}")

            if asyncio.get_running_loop().time() > deadline:
                raise RunwayError(f"Runway task {task_id} timed out")

            await asyncio.sleep(self._poll_interval)

    async def _request(
        self,
        method: str,
        endpoint: str,
        *,
        json: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        url = f"{self.BASE_URL}/{endpoint.lstrip('/')}"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        async with self._session.request(method, url, headers=headers, json=json) as response:
            await self._raise_for_status(response)
            return await response.json()

    async def _create_task(self, prompt: str, *, aspect_ratio: str) -> Dict[str, Any]:
        payload = {
            "model": self._model,
            "input": {
                "prompt": prompt,
                "mode": "text-to-image",
                "aspect_ratio": aspect_ratio,
            },
        }
        return await self._request("POST", "tasks", json=payload)

    async def _get_task(self, task_id: str) -> Dict[str, Any]:
        return await self._request("GET", f"tasks/{task_id}")

    @staticmethod
    def _extract_image_urls(task: Dict[str, Any]) -> List[str]:
        output = task.get("output") or {}
        images: Iterable[Any] = output.get("images") or output.get("assets") or []
        urls: List[str] = []
        for image in images:
            if isinstance(image, dict):
                url = image.get("url") or image.get("uri")
                if url:
                    urls.append(url)
            elif isinstance(image, str):
                urls.append(image)
        return urls

    @staticmethod
    async def _raise_for_status(response: ClientResponse) -> None:
        if 200 <= response.status < 300:
            return
        text = await response.text()
        raise RunwayError(
            f"Runway API request failed with status {response.status}: {text.strip()}"
        )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /start command."""

    await update.message.reply_text(
        "سلام! متن مورد نظرت رو بفرست تا با Runway برات تصویر بسازم."
    )


async def handle_prompt(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Generate an image for the incoming prompt."""

    prompt = update.message.text.strip()
    runway: RunwayClient = context.application.bot_data["runway_client"]

    await context.bot.send_chat_action(update.effective_chat.id, ChatAction.UPLOAD_PHOTO)

    try:
        generation = await runway.generate_image(prompt)
    except (RunwayError, ValueError) as exc:
        LOGGER.exception("Runway generation failed")
        await update.message.reply_text(
            "متأسفانه در ساخت تصویر خطایی رخ داد. لطفاً بعداً دوباره تلاش کن."
        )
        await update.message.reply_text(str(exc))
        return

    caption = f"🎨 نتیجه برای:\n{generation.prompt}"
    await update.message.reply_photo(photo=generation.image_urls[0], caption=caption)

    if len(generation.image_urls) > 1:
        for url in generation.image_urls[1:]:
            await update.message.reply_photo(photo=url)


def _configure_application_factory(runway_api_key: str):
    async def _configure_application(application: Application) -> None:
        session = aiohttp.ClientSession()
        application.bot_data["runway_session"] = session
        application.bot_data["runway_client"] = RunwayClient(
            runway_api_key, session=session
        )

    return _configure_application
async def _configure_application(
    application: Application, *, runway_api_key: str
) -> None:
    session = aiohttp.ClientSession()
    application.bot_data["runway_session"] = session
    application.bot_data["runway_client"] = RunwayClient(
        runway_api_key, session=session
    )


async def _shutdown_application(application: Application) -> None:
    client: Optional[RunwayClient] = application.bot_data.pop("runway_client", None)
    session: Optional[aiohttp.ClientSession] = application.bot_data.pop(
        "runway_session", None
    )

    if client is not None:
        await client.close()
    elif session is not None and not session.closed:
        await session.close()


async def _run_bot(bot_token: str, runway_api_key: str) -> None:
    application = (
        ApplicationBuilder()
        .token(bot_token)
        .post_init(_configure_application_factory(runway_api_key))
        .post_shutdown(_shutdown_application)
        .build()
    )

    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_prompt))

    LOGGER.info("Starting Telegram bot")

    await application.initialize()
    await application.start()

    try:
        await application.updater.start_polling()
        await application.updater.wait()
    finally:
        await application.stop()
        await application.shutdown()


def _load_env_var(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Environment variable {name} is not set")
    return value


def main() -> None:
    logging.basicConfig(level=logging.INFO)

    bot_token = _load_env_var("BOT_TOKEN")
    runway_api_key = _load_env_var("RUNWAY_API")

    asyncio.run(_run_bot(bot_token, runway_api_key))
    builder = ApplicationBuilder().token(bot_token)
    builder.post_init(lambda app: _configure_application(app, runway_api_key=runway_api_key))
    builder.post_shutdown(_shutdown_application)

    application = builder.build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_prompt))

    LOGGER.info("Starting Telegram bot")
    application.run_polling(close_loop=False)


if __name__ == "__main__":
    main()
