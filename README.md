# ProNetIRBot Telegram Worker

Cloudflare Workers Telegram bot for registering and tracking Internet Pro requests.

## Features

- Persian Telegram menu:
  - `✅ ثبت درخواست جدید`
  - `📄 وضعیت درخواست من`
  - `☎️ پشتیبانی`
  - `📌 شرایط و قوانین`
- Simplified request form (service is currently only for **همراه اول** SIM cards):
  1. Full name
  2. Mobile number (`09xxxxxxxxx`)
  3. National ID (10 digits)
  4. National card image/file (photo or document)
- Stores in-progress forms and submitted requests in Cloudflare KV
- Lets users view their latest request statuses
- Sends new request summaries and uploaded national card document to the admin chat
- Auto-checks and auto-configures the Telegram webhook from the Worker root URL
- Uses KV binding fallback with either `BOT_KV` or `KV`

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

`KV` is also supported as a fallback binding name.

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

The Worker includes auto-webhook setup.

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

## Bot flow

1. User taps `✅ ثبت درخواست جدید`.
2. Bot starts registration and reminds that the service is currently only for **همراه اول** SIM cards.
3. Bot collects:
   - Full name
   - Mobile number (`09xxxxxxxxx`)
   - National ID (10 digits)
4. Bot asks for a clear national card image/file.
5. On receiving photo/document, request is immediately stored with status `در انتظار بررسی`.
6. Bot sends request ID to user and forwards request details + national card to admin chat.

## Notes

- The bot stores Telegram file IDs, not raw files.
- New request national card document is forwarded to the admin chat.
- Requests are created with status `در انتظار بررسی`.
- Use `/cancel` at any time to cancel the current form.
- `/start` shows the main menu.
