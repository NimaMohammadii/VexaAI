# ProNetIRBot Telegram Worker

A Cloudflare Workers Telegram bot for registering and tracking Internet Pro requests.

## Features

- Persian main menu with these buttons:
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
- Request status lookup for the user
- Admin notification with request summary and uploaded documents
- Legal/safety copy that states activation is not guaranteed and depends on operator approval

## Environment variables

Set these with Wrangler secrets or Cloudflare dashboard variables:

- `BOT_TOKEN` — required Telegram bot token
- `ADMIN_CHAT_ID` — recommended, numeric Telegram chat/user ID that receives new requests
- `BOT_OWNER` — optional fallback admin chat ID if `ADMIN_CHAT_ID` is not set
- `SUPPORT_TEXT` — optional custom support text shown in the support menu

## KV storage

The bot uses Cloudflare KV to keep in-progress forms and saved requests.

Create a KV namespace:

```bash
wrangler kv namespace create BOT_KV
```

Then copy the returned namespace ID into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "BOT_KV"
id = "YOUR_KV_NAMESPACE_ID"
```

For preview/dev you can also add `preview_id` if Wrangler returns one.

## Deploy

```bash
npm install
wrangler secret put BOT_TOKEN
wrangler secret put ADMIN_CHAT_ID
wrangler deploy
```

## Set webhook

After deployment, run:

```bash
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -H "content-type: application/json" \
  -d '{"url":"https://<your-worker-url>"}'
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
