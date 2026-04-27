# Telegram Bot on Cloudflare Workers

A minimal Telegram bot designed for Cloudflare Workers.

## Environment variables

- `BOT_TOKEN`: Telegram bot token (as a secret)
- `BOT_OWNER`: Optional, Numeric Telegram user ID of bot owner (kept for later features)

## Deploy

```bash
npm install -D wrangler
wrangler secret put BOT_TOKEN
wrangler deploy
```

## Set webhook

After deployment, run:

```bash
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -H "content-type: application/json" \
  -d '{"url":"https://<your-worker-url>"}'
```

## Current behavior

- `/start` shows one keyboard button:
  - `ثبت‌نام انترنت پرو`
- Clicking the button returns a temporary confirmation message.
