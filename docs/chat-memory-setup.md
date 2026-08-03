# Persistent chats and per-user memory

Vexa stores chat history and structured long-term memory in a Cloudflare D1 database bound to the Worker as `VEXA_DB`.

## One-time Cloudflare setup

1. Create the database:

   ```bash
   npx wrangler d1 create vexa-chat
   ```

2. Add the returned binding to `wrangler.toml`:

   ```toml
   [[d1_databases]]
   binding = "VEXA_DB"
   database_name = "vexa-chat"
   database_id = "<database id returned by Cloudflare>"
   migrations_dir = "migrations"
   ```

3. Apply the schema:

   ```bash
   npx wrangler d1 migrations apply vexa-chat --remote
   ```

4. Deploy the Worker.

The Worker also runs `CREATE TABLE IF NOT EXISTS` at runtime, so deploying after the binding is attached is safe even if the migration was already applied.

## Stored data

- Telegram user identity needed to isolate accounts
- Conversation titles and timestamps
- All text chat messages
- Temporary preview HTML and metadata, so previews can be reopened and edited
- Structured long-term memory facts for each user

There is intentionally no chat deletion endpoint in this version. The memory extractor rejects secrets such as passwords, API keys, authentication tokens, private keys, recovery phrases, card numbers, and CVV values.
