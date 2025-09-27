# VexaAI Telegram Instagram Downloader Bot

This project provides a Telegram bot that downloads media (photos and videos) from Instagram posts and reels shared by users in a chat. The bot extracts media URLs from supported Instagram links and sends the media back to the user directly inside Telegram.

## Features

- Detects Instagram post, reel, and TV links shared in private or group chats.
- Downloads single photos, videos, or multi-item carousel posts.
- Provides helpful status messages on success or failure.

## Requirements

- Python 3.11+
- A Telegram Bot token created via [BotFather](https://core.telegram.org/bots#botfather).

## Installation

1. Create and activate a Python virtual environment (recommended):

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Export your Telegram bot token:

   ```bash
   export TELEGRAM_BOT_TOKEN="your-telegram-token"
   ```

4. Run the bot:

   ```bash
   python bot.py
   ```

## Usage

Send any Instagram post or reel link to the bot. If the content is public and accessible, the bot will respond with the downloaded media. Carousel posts will result in multiple messages (one per media item).

## Notes

- Instagram frequently changes its public APIs, so downloading might fail if the structure changes or the content is private. In such cases, the bot notifies the user to try again later.
- To deploy the bot permanently, run it on a server and use a process manager such as `systemd`, `supervisord`, or Docker.

