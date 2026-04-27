# ProNetIRBot Telegram Worker

Cloudflare Workers Telegram bot for registering and tracking Internet Pro requests.

## Features

- Persian Telegram menu:
  - `✅ ثبت درخواست جدید`
  - `📄 وضعیت درخواست من`
  - `☎️ پشتیبانی`
  - `📌 شرایط و قوانین`
- Multi-step request form:
  1. Full name
  2. Mobile number
  3. National ID
  4. Request category
  5. Job/organization relationship description
  6. Organization/company name
  7. City
  8. Operator
  9. Documents/photos
  10. Final confirmation
- Stores in-progress forms and submitted requests in Cloudflare KV
- Lets users view their latest request statuses
- Sends new request summaries and uploaded documents to the admin chat
- Auto-checks and auto-configures the Telegram webhook from the Worker root URL
- Includes legal/safety copy stating activation is not guaranteed and depends on operator approval

## Environment variables / secrets

Required:

- `BOT_TOKEN` — Telegram bot token

Recommended:

- `BOT_OWNER` — numeric Telegram user ID of the bot owner; also used as fallback admin chat
- `ADMIN_CHAT_ID` — numeric Telegram chat/user ID that receives new requests
- `SUPPORT_TEXT` — optional custom text shown in the support menu

Set secrets with Wrangler:

```bash
wrangler secret put BOT_TOKEN
wrangler secret put BOT_OWNER
wrangler secret put ADMIN_CHAT_ID
```

Or set them from the Cloudflare dashboard.

## KV storage

The Worker code expects a KV binding named exactly:

```text
BOT_KV
```

### Mobile / dashboard setup

1. Open Cloudflare Dashboard.
2. Go to **Workers & Pages**.
3. Open the `net` Worker.
4. Go to **Bindings**.
5. Click **Add binding**.
6. Choose **KV namespace**.
7. Set the variable/binding name to:

```text
BOT_KV
```

8. Select or create the KV namespace named `BOT_KV`.
9. Save/deploy the Worker.

### Wrangler setup

```bash
wrangler kv namespace create BOT_KV
```

Then add the returned namespace ID to `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "BOT_KV"
id = "YOUR_KV_NAMESPACE_ID"
```

Deploy after setting the binding:

```bash
wrangler deploy
```

## Webhook

The Worker now includes auto-webhook setup.

After deploying, open the Worker root URL once:

```text
https://net.vexaagent.workers.dev/
```

The response should include:

```json
"hasBotToken": true,
"hasBotKv": true
```

It should also include `webhookAutoSetup`. If the Telegram webhook was empty or wrong, the Worker sets it automatically to:

```text
https://net.vexaagent.workers.dev/
```

Manual debug endpoints are also available:

```text
https://net.vexaagent.workers.dev/debug/webhook
https://net.vexaagent.workers.dev/debug/set-webhook
```

## Bot description

Suggested Telegram bot description:

```text
ProNetIRBot | ثبت درخواست اینترنت پرو

ثبت، بررسی و پیگیری درخواست اینترنت پرو برای افراد و مجموعه‌های دارای شرایط قابل احراز.

✅ ثبت درخواست
✅ بررسی مدارک
✅ پیگیری وضعیت
✅ پشتیبانی تا اعلام نتیجه

فعال‌سازی نهایی منوط به تأیید اپراتور و مراجع مربوطه است.
```

## Notes

- The bot stores Telegram file IDs, not raw document files.
- New request documents are forwarded to the admin chat.
- Requests are created with status `در انتظار بررسی`.
- Use `/cancel` at any time to cancel the current form.
- `/start` does not require KV, but request registration and status tracking require the `BOT_KV` binding.
