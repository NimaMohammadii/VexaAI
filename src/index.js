const REGISTER_BUTTON = "ثبت‌نام انترنت پرو";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function telegramApi(env, method, payload) {
  const token = env.BOT_TOKEN;
  if (!token) throw new Error("BOT_TOKEN is missing");

  const url = `https://api.telegram.org/bot${token}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telegram API error (${res.status}): ${text}`);
  }

  return res.json();
}

async function sendMainMenu(env, chatId) {
  return telegramApi(env, "sendMessage", {
    chat_id: chatId,
    text: "سلام 👋\nبرای شروع روی دکمه زیر بزن:",
    reply_markup: {
      keyboard: [[{ text: REGISTER_BUTTON }]],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  });
}

function getIncomingMessage(update) {
  if (update?.message?.chat?.id) {
    return { chatId: update.message.chat.id, text: (update.message.text || "").trim() };
  }

  if (update?.callback_query?.message?.chat?.id) {
    return {
      chatId: update.callback_query.message.chat.id,
      text: (update.callback_query.data || "").trim(),
      callbackQueryId: update.callback_query.id,
    };
  }

  return null;
}

function isStartCommand(text) {
  if (!text) return false;
  // Supports both "/start" and "/start@YourBotName" (common in groups)
  return /^\/start(?:@\w+)?$/i.test(text);
}

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return json({
        ok: true,
        service: "Telegram bot webhook is running",
        config: {
          hasBotToken: Boolean(env.BOT_TOKEN),
          hasBotOwner: Boolean(env.BOT_OWNER),
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let update;
    try {
      update = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON" }, 400);
    }

    const incoming = getIncomingMessage(update);
    if (!incoming?.chatId) {
      return json({ ok: true, ignored: true });
    }

    const { chatId, text, callbackQueryId } = incoming;

    try {
      if (callbackQueryId) {
        await telegramApi(env, "answerCallbackQuery", {
          callback_query_id: callbackQueryId,
        });
      }

      if (isStartCommand(text)) {
        await sendMainMenu(env, chatId);
        return json({ ok: true, action: "start_menu_sent" });
      }

      if (text === REGISTER_BUTTON) {
        await telegramApi(env, "sendMessage", {
          chat_id: chatId,
          text: "✅ درخواست ثبت‌نام انترنت پرو دریافت شد.\nبه‌زودی مرحله‌های بعدی اضافه می‌شود.",
        });
        return json({ ok: true, action: "register_clicked" });
      }

      await sendMainMenu(env, chatId);
      return json({ ok: true, action: "fallback_menu_sent" });
    } catch (error) {
      return json(
        {
          ok: false,
          error: "Failed to handle Telegram update",
          detail: error?.message || "Unknown error",
        },
        500,
      );
    }
  },
};
