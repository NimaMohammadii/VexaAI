const BUTTONS = {
  REGISTER: "✅ ثبت درخواست جدید",
  STATUS: "📄 وضعیت درخواست من",
  SUPPORT: "☎️ پشتیبانی",
  RULES: "📌 شرایط و قوانین",
  CANCEL: "لغو",
};

const CALLBACKS = {
  CONFIRM_COST: "confirm_cost",
  REJECT_COST: "reject_cost",
  ADMIN_APPROVE_PREFIX: "admin_approve:",
  ADMIN_REJECT_PREFIX: "admin_reject:",
  PAYMENT_CANCEL_PREFIX: "payment_cancel:",
};

const SERVICE_OPERATOR = "همراه اول";
const ACTIVATION_PRICE = "8,500,000 تومان";
const MAX_USER_REQUESTS = 10;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function mainKeyboard() {
  return {
    keyboard: [
      [{ text: BUTTONS.REGISTER }],
      [{ text: BUTTONS.STATUS }, { text: BUTTONS.SUPPORT }],
      [{ text: BUTTONS.RULES }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}

function costConfirmKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✅ تایید و ادامه", callback_data: CALLBACKS.CONFIRM_COST },
        { text: "❌ رد", callback_data: CALLBACKS.REJECT_COST },
      ],
    ],
  };
}

function adminDecisionKeyboard(requestId) {
  return {
    inline_keyboard: [
      [
        { text: "✅ تایید", callback_data: `${CALLBACKS.ADMIN_APPROVE_PREFIX}${requestId}` },
        { text: "❌ رد", callback_data: `${CALLBACKS.ADMIN_REJECT_PREFIX}${requestId}` },
      ],
    ],
  };
}

function paymentCancelKeyboard(requestId) {
  return {
    inline_keyboard: [[{ text: "❌ لغو درخواست", callback_data: `${CALLBACKS.PAYMENT_CANCEL_PREFIX}${requestId}` }]],
  };
}

function removeKeyboard() {
  return { remove_keyboard: true };
}

function normalizeCommand(text = "") {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) return null;
  const [rawCommand] = trimmed.split(/\s+/, 1);
  return rawCommand.split("@")[0].toLowerCase();
}

function toEnglishDigits(value = "") {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function cleanPhone(value = "") {
  return toEnglishDigits(value).replace(/[\s\-()+]/g, "").trim();
}

function cleanNationalId(value = "") {
  return toEnglishDigits(value).replace(/\D/g, "").trim();
}

function isValidPhone(phone) {
  return /^09\d{9}$/.test(phone);
}

function isValidNationalId(nationalId) {
  return /^\d{10}$/.test(nationalId);
}

function nowIso() {
  return new Date().toISOString();
}

function publicRequestId() {
  return `PN-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function getPaymentCardNumber(env) {
  return env.PAYMENT_CARD_NUMBER || "شماره کارت هنوز تنظیم نشده است";
}

function getKv(env) {
  return env.BOT_KV || env.KV || null;
}

function getKvBindingName(env) {
  if (env.BOT_KV) return "BOT_KV";
  if (env.KV) return "KV";
  return null;
}

function requireKv(env) {
  const kv = getKv(env);
  if (!kv) throw new Error("KV binding is not configured. Add a KV namespace binding named BOT_KV.");
  return kv;
}

const stateKey = (chatId) => `state:${chatId}`;
const requestKey = (requestId) => `request:${requestId}`;
const userRequestsKey = (userId) => `user_requests:${userId}`;

async function getState(env, chatId) {
  const kv = getKv(env);
  if (!kv) return null;
  const raw = await kv.get(stateKey(chatId));
  return raw ? JSON.parse(raw) : null;
}

async function setState(env, chatId, state) {
  await requireKv(env).put(stateKey(chatId), JSON.stringify(state), { expirationTtl: 60 * 60 * 24 });
}

async function clearState(env, chatId) {
  const kv = getKv(env);
  if (kv) await kv.delete(stateKey(chatId));
}

async function saveRequest(env, request) {
  const kv = requireKv(env);
  await kv.put(requestKey(request.id), JSON.stringify(request));

  const listKey = userRequestsKey(request.telegramUserId);
  const existing = await kv.get(listKey);
  const requestIds = existing ? JSON.parse(existing) : [];
  requestIds.unshift(request.id);
  await kv.put(listKey, JSON.stringify(requestIds.slice(0, MAX_USER_REQUESTS)));
}

async function updateRequest(env, request) {
  await requireKv(env).put(requestKey(request.id), JSON.stringify(request));
}

async function getRequest(env, requestId) {
  const kv = getKv(env);
  if (!kv) return null;
  const raw = await kv.get(requestKey(requestId));
  return raw ? JSON.parse(raw) : null;
}

async function getUserRequests(env, userId) {
  const kv = getKv(env);
  if (!kv) return [];

  const rawIds = await kv.get(userRequestsKey(userId));
  const ids = rawIds ? JSON.parse(rawIds) : [];
  const requests = [];
  for (const id of ids.slice(0, 3)) {
    const rawRequest = await kv.get(requestKey(id));
    if (rawRequest) requests.push(JSON.parse(rawRequest));
  }
  return requests;
}

async function telegramApi(env, method, payload = {}) {
  const token = env.BOT_TOKEN;
  if (!token) throw new Error("BOT_TOKEN is missing");

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload || {}),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok || data.ok === false) {
    throw new Error(`Telegram API error (${res.status}): ${text}`);
  }
  return data;
}

function sanitizeWebhookInfo(info) {
  const result = info?.result || {};
  return {
    ok: Boolean(info?.ok),
    url: result.url || "",
    pending_update_count: result.pending_update_count || 0,
    last_error_date: result.last_error_date || null,
    last_error_message: result.last_error_message || null,
    max_connections: result.max_connections || null,
    allowed_updates: result.allowed_updates || null,
  };
}

async function getWebhookInfo(env) {
  return sanitizeWebhookInfo(await telegramApi(env, "getWebhookInfo", {}));
}

async function setWebhook(env, webhookUrl) {
  const response = await telegramApi(env, "setWebhook", {
    url: webhookUrl,
    drop_pending_updates: true,
    allowed_updates: ["message", "callback_query"],
  });
  return {
    ok: Boolean(response?.ok),
    description: response?.description || "",
    webhookUrl,
    webhookInfo: await getWebhookInfo(env),
  };
}

async function ensureWebhook(env, request) {
  const currentUrl = new URL(request.url);
  const webhookUrl = `${currentUrl.origin}/`;
  const before = await getWebhookInfo(env);
  const allowedUpdates = before.allowed_updates || [];
  const hasCallbackUpdates = allowedUpdates.length === 0 || allowedUpdates.includes("callback_query");

  if (before.url === webhookUrl && hasCallbackUpdates) {
    return { changed: false, webhookUrl, before, after: before };
  }

  const setResult = await setWebhook(env, webhookUrl);
  return { changed: true, webhookUrl, before, after: setResult.webhookInfo, description: setResult.description };
}

async function sendMessage(env, chatId, text, replyMarkup = undefined) {
  return telegramApi(env, "sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: replyMarkup,
  });
}

async function deleteMessage(env, chatId, messageId) {
  return telegramApi(env, "deleteMessage", {
    chat_id: chatId,
    message_id: messageId,
  });
}

async function answerCallbackQuery(env, callbackQueryId, text = undefined) {
  return telegramApi(env, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

async function editMessageReplyMarkup(env, chatId, messageId, replyMarkup = undefined) {
  return telegramApi(env, "editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: replyMarkup || { inline_keyboard: [] },
  });
}

async function sendMainMenu(env, chatId) {
  return sendMessage(
    env,
    chatId,
    "سلام 👋\nبه ProNetIRBot خوش آمدید.\n\n🚀 از این ربات می‌توانید درخواست اینترنت پرو را ثبت و وضعیت پرونده را پیگیری کنید.\n\n📱 توجه: ثبت درخواست اینترنت پرو فعلاً فقط برای سیم‌کارت همراه اول امکان‌پذیر است.\n\nبرای شروع یکی از گزینه‌های زیر را انتخاب کنید:",
    mainKeyboard(),
  );
}

async function sendRules(env, chatId) {
  return sendMessage(
    env,
    chatId,
    "📌 شرایط و قوانین\n\n" +
      "📱 ثبت درخواست فعلاً فقط برای سیم‌کارت همراه اول امکان‌پذیر است.\n" +
      "🪪 شماره موبایل باید به نام خود متقاضی باشد.\n" +
      `💳 هزینه انجام و پیگیری فعال‌سازی از طرف شرکت ما: ${ACTIVATION_PRICE}\n` +
      "🧾 تصویر کارت ملی باید واضح و خوانا باشد.\n" +
      "⏳ پس از بررسی، نحوه پرداخت برای شما ارسال می‌شود.\n" +
      "✅ پس از تکمیل پرداخت و تأیید نهایی، پیامک فعال‌سازی معمولاً تا ۲۴ ساعت برای شما ارسال می‌شود.",
  );
}

async function sendSupport(env, chatId) {
  const supportLine = env.SUPPORT_TEXT || "برای پیگیری، پیام خود را برای پشتیبانی ارسال کنید یا شماره پرونده را نگه دارید.";
  return sendMessage(env, chatId, `☎️ پشتیبانی\n\n${supportLine}`);
}

function adminSummary(request) {
  const username = request.username ? `@${request.username}` : "ندارد";
  return (
    "📥 درخواست جدید اینترنت پرو\n\n" +
    `شماره پرونده: ${request.id}\n` +
    `نام: ${request.fullName}\n` +
    `موبایل: ${request.phone}\n` +
    `کد ملی: ${request.nationalId}\n` +
    `اپراتور: ${request.operator}\n` +
    `وضعیت: ${request.status}\n` +
    `یوزرنیم تلگرام: ${username}\n` +
    `آیدی کاربر: ${request.telegramUserId}\n` +
    `تاریخ ثبت: ${request.createdAt}`
  );
}

function cancelledByUserAdminText(request) {
  const username = request.username ? `@${request.username}` : "ندارد";
  return (
    "❌ کاربر پرداخت را لغو کرد و واریز نکرد\n\n" +
    `شماره پرونده: ${request.id}\n` +
    `نام: ${request.fullName}\n` +
    `موبایل: ${request.phone}\n` +
    `کد ملی: ${request.nationalId}\n` +
    `اپراتور: ${request.operator}\n` +
    `یوزرنیم تلگرام: ${username}\n` +
    `آیدی کاربر: ${request.telegramUserId}\n` +
    `زمان لغو: ${nowIso()}`
  );
}

async function notifyAdmin(env, request) {
  const adminChatId = env.ADMIN_CHAT_ID || env.BOT_OWNER;
  if (!adminChatId) return;

  const nationalCardDocument = request.documents?.[0];
  const caption = adminSummary(request);
  const replyMarkup = adminDecisionKeyboard(request.id);

  if (!nationalCardDocument) {
    await sendMessage(env, adminChatId, caption, replyMarkup);
    return;
  }

  const payload = { chat_id: adminChatId, caption, reply_markup: replyMarkup };
  if (nationalCardDocument.type === "photo") {
    await telegramApi(env, "sendPhoto", { ...payload, photo: nationalCardDocument.fileId });
  } else {
    await telegramApi(env, "sendDocument", { ...payload, document: nationalCardDocument.fileId });
  }
}

async function notifyAdminPaymentReceipt(env, request, receiptDocument) {
  const adminChatId = env.ADMIN_CHAT_ID || env.BOT_OWNER;
  if (!adminChatId) return;

  const caption =
    "🧾 رسید پرداخت کاربر دریافت شد\n\n" +
    `شماره پرونده: ${request.id}\n` +
    `نام: ${request.fullName}\n` +
    `موبایل: ${request.phone}\n` +
    `کد ملی: ${request.nationalId}\n` +
    `مبلغ: ${ACTIVATION_PRICE}\n` +
    `وضعیت: ${request.status}\n` +
    `تاریخ ارسال رسید: ${nowIso()}`;

  const payload = { chat_id: adminChatId, caption };
  if (receiptDocument.type === "photo") {
    await telegramApi(env, "sendPhoto", { ...payload, photo: receiptDocument.fileId });
  } else {
    await telegramApi(env, "sendDocument", { ...payload, document: receiptDocument.fileId });
  }
}

async function beginRegistration(env, chatId) {
  requireKv(env);
  await setState(env, chatId, { step: "costConfirm", data: {}, startedAt: nowIso() });
  const sent = await sendMessage(
    env,
    chatId,
    "💎 ثبت درخواست اینترنت پرو\n\n" +
      `💳 هزینه انجام و پیگیری فعال‌سازی از طرف شرکت ما برای شما ${ACTIVATION_PRICE} است.\n\n` +
      "📱 این سرویس فعلاً فقط برای سیم‌کارت همراه اول قابل انجام است.\n" +
      "🪪 سیم‌کارت باید حتماً به نام خودتان باشد.\n\n" +
      "اگر هزینه و شرایط را تأیید می‌کنید، برای ادامه روی دکمه تأیید بزنید.",
    costConfirmKeyboard(),
  );

  await setState(env, chatId, {
    step: "costConfirm",
    data: {},
    costMessageId: sent.result?.message_id,
    startedAt: nowIso(),
  });
}

async function sendStatus(env, message) {
  const chatId = message.chat.id;
  const userId = message.from?.id || chatId;

  if (!getKv(env)) {
    return sendMessage(env, chatId, "برای نمایش وضعیت درخواست‌ها، اتصال ذخیره‌سازی BOT_KV باید در Cloudflare فعال شود. اگر binding را تازه اضافه کرده‌اید، از Cloudflare روی Save and deploy یا Redeploy بزنید.");
  }

  const requests = await getUserRequests(env, userId);
  if (!requests.length) return sendMessage(env, chatId, "برای شما هنوز درخواستی ثبت نشده است.");

  const text = requests
    .map(
      (request) =>
        `شماره پرونده: ${request.id}\n` +
        `نام: ${request.fullName}\n` +
        `موبایل: ${request.phone}\n` +
        `اپراتور: ${request.operator}\n` +
        `وضعیت: ${request.status}\n` +
        `تاریخ ثبت: ${request.createdAt}`,
    )
    .join("\n\n");

  return sendMessage(env, chatId, `📄 آخرین درخواست‌های شما:\n\n${text}`);
}

function getIncomingDocument(message) {
  if (message.photo?.length) {
    const photo = message.photo[message.photo.length - 1];
    return { type: "photo", fileId: photo.file_id, fileUniqueId: photo.file_unique_id };
  }
  if (message.document) {
    return {
      type: "document",
      fileId: message.document.file_id,
      fileUniqueId: message.document.file_unique_id,
      fileName: message.document.file_name || "document",
      mimeType: message.document.mime_type || "",
    };
  }
  return null;
}

async function finalizeRequest(env, message, state, nationalCardDocument) {
  const chatId = message.chat.id;
  const request = {
    id: publicRequestId(),
    telegramUserId: message.from?.id || chatId,
    chatId,
    username: message.from?.username || "",
    firstName: message.from?.first_name || "",
    lastName: message.from?.last_name || "",
    fullName: state.data.fullName,
    phone: state.data.phone,
    nationalId: state.data.nationalId,
    operator: SERVICE_OPERATOR,
    documents: [nationalCardDocument],
    status: "در انتظار بررسی",
    createdAt: nowIso(),
  };

  await saveRequest(env, request);
  await clearState(env, chatId);
  await sendMessage(
    env,
    chatId,
    `✅ درخواست شما ثبت شد.\n\nشماره پرونده: ${request.id}\n\n⏳ پرونده شما طی چند ساعت آینده بررسی می‌شود و پس از بررسی، نحوه پرداخت برای شما ارسال خواهد شد.\n\n📩 پس از تکمیل پرداخت و تأیید نهایی، پیامک فعال‌سازی معمولاً تا ۲۴ ساعت برای شما ارسال می‌شود.`,
    mainKeyboard(),
  );
  await notifyAdmin(env, request);
}

async function handlePaymentReceipt(env, message, state) {
  const chatId = message.chat.id;
  const receiptDocument = getIncomingDocument(message);

  if (!receiptDocument) {
    return sendMessage(env, chatId, "🧾 لطفاً فقط تصویر یا فایل رسید پرداخت را ارسال کنید.");
  }

  const request = await getRequest(env, state.requestId);
  if (!request) {
    await clearState(env, chatId);
    return sendMessage(env, chatId, "پرونده پیدا نشد. لطفاً با پشتیبانی تماس بگیرید.", mainKeyboard());
  }

  request.status = "رسید پرداخت ارسال شد";
  request.paymentReceipt = receiptDocument;
  request.paymentReceiptSentAt = nowIso();
  await updateRequest(env, request);
  await clearState(env, chatId);

  await sendMessage(
    env,
    chatId,
    "✅ رسید پرداخت شما دریافت شد.\n\nدرخواست شما برای دریافت اینترنت پرو وارد مرحله تأیید پرداخت و فعال‌سازی می‌شود.\n\n📩 پس از تأیید نهایی، معمولاً تا ۲۴ ساعت پیامک فعال‌سازی اینترنت پرو را دریافت می‌کنید.",
    mainKeyboard(),
  );
  await notifyAdminPaymentReceipt(env, request, receiptDocument);
}

async function handleRegistrationStep(env, message, state) {
  const chatId = message.chat.id;
  const text = (message.text || "").trim();

  if (text === BUTTONS.CANCEL || text === "/cancel") {
    await clearState(env, chatId);
    return sendMessage(env, chatId, "فرآیند ثبت درخواست لغو شد.", mainKeyboard());
  }

  switch (state.step) {
    case "costConfirm":
      return sendMessage(env, chatId, "برای ادامه، لطفاً از دکمه‌های تایید یا رد زیر پیام هزینه استفاده کنید.");

    case "fullName":
      if (text.length < 3) return sendMessage(env, chatId, "نام واردشده کوتاه است. لطفاً نام و نام خانوادگی را کامل وارد کنید:");
      state.data.fullName = text;
      state.step = "phone";
      await setState(env, chatId, state);
      return sendMessage(env, chatId, "📱 شماره موبایل همراه اول متقاضی را وارد کنید.\n\n🪪 تاکید: سیم‌کارت باید حتماً به نام خودتان باشد.");

    case "phone": {
      const phone = cleanPhone(text);
      if (!isValidPhone(phone)) return sendMessage(env, chatId, "شماره موبایل معتبر نیست. نمونه صحیح: 09123456789");
      state.data.phone = phone;
      state.step = "nationalId";
      await setState(env, chatId, state);
      return sendMessage(env, chatId, "🪪 کد ملی ۱۰ رقمی متقاضی را وارد کنید:");
    }

    case "nationalId": {
      const nationalId = cleanNationalId(text);
      if (!isValidNationalId(nationalId)) return sendMessage(env, chatId, "کد ملی باید ۱۰ رقم باشد. لطفاً دوباره وارد کنید:");
      state.data.nationalId = nationalId;
      state.step = "nationalCard";
      await setState(env, chatId, state);
      return sendMessage(
        env,
        chatId,
        "📸 لطفاً عکس واضح کارت ملی متقاضی را ارسال کنید.\n\nبعد از ارسال عکس کارت ملی، درخواست شما ثبت می‌شود.",
      );
    }

    case "nationalCard": {
      const nationalCardDocument = getIncomingDocument(message);
      if (!nationalCardDocument) {
        return sendMessage(env, chatId, "لطفاً فقط عکس یا فایل کارت ملی را ارسال کنید.");
      }
      return finalizeRequest(env, message, state, nationalCardDocument);
    }

    case "paymentReceipt":
      return handlePaymentReceipt(env, message, state);

    default:
      await clearState(env, chatId);
      return sendMainMenu(env, chatId);
  }
}

async function approveRequest(env, callbackQuery, requestId) {
  const adminChatId = callbackQuery.message?.chat?.id;
  const adminMessageId = callbackQuery.message?.message_id;
  const request = await getRequest(env, requestId);

  if (!request) {
    await answerCallbackQuery(env, callbackQuery.id, "پرونده پیدا نشد");
    return { action: "admin_approve_missing_request" };
  }

  request.status = "در انتظار پرداخت";
  request.approvedAt = nowIso();
  await updateRequest(env, request);

  if (adminChatId && adminMessageId) await editMessageReplyMarkup(env, adminChatId, adminMessageId);

  const paymentMessage =
    "✅ درخواست شما بررسی و تأیید اولیه شد.\n\n" +
    `💳 مبلغ قابل پرداخت: ${ACTIVATION_PRICE}\n` +
    `💳 شماره کارت: ${getPaymentCardNumber(env)}\n\n` +
    "🧾 لطفاً پس از پرداخت، فقط تصویر رسید پرداخت را همین‌جا ارسال کنید.\n\n" +
    "⚡ بعد از ارسال رسید و تأیید پرداخت، درخواست شما برای دریافت اینترنت پرو وارد مرحله فعال‌سازی می‌شود.\n" +
    "📩 پس از تکمیل پرداخت و تأیید نهایی، معمولاً تا ۲۴ ساعت پیامک فعال‌سازی اینترنت پرو را دریافت می‌کنید.";

  const sent = await sendMessage(env, request.chatId, paymentMessage, paymentCancelKeyboard(request.id));
  await setState(env, request.chatId, {
    step: "paymentReceipt",
    requestId: request.id,
    paymentMessageId: sent.result?.message_id,
    startedAt: nowIso(),
  });

  await answerCallbackQuery(env, callbackQuery.id, "اطلاعات پرداخت برای کاربر ارسال شد");
  await sendMessage(env, adminChatId, `✅ اطلاعات پرداخت برای پرونده ${request.id} ارسال شد.`);
  return { action: "admin_approved_request" };
}

async function rejectRequestByAdmin(env, callbackQuery, requestId) {
  const adminChatId = callbackQuery.message?.chat?.id;
  const adminMessageId = callbackQuery.message?.message_id;
  const request = await getRequest(env, requestId);

  if (!request) {
    await answerCallbackQuery(env, callbackQuery.id, "پرونده پیدا نشد");
    return { action: "admin_reject_missing_request" };
  }

  request.status = "رد شده توسط ادمین";
  request.rejectedAt = nowIso();
  await updateRequest(env, request);

  if (adminChatId && adminMessageId) await editMessageReplyMarkup(env, adminChatId, adminMessageId);
  await sendMessage(env, request.chatId, `❌ درخواست شما رد شد.\n\nشماره پرونده: ${request.id}\n\nبرای اطلاعات بیشتر با پشتیبانی تماس بگیرید.`, mainKeyboard());
  await answerCallbackQuery(env, callbackQuery.id, "درخواست رد شد");
  await sendMessage(env, adminChatId, `❌ پرونده ${request.id} رد شد و به کاربر اطلاع داده شد.`);
  return { action: "admin_rejected_request" };
}

async function cancelPaymentByUser(env, callbackQuery, requestId) {
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;
  const request = await getRequest(env, requestId);

  if (!chatId || !request) {
    await answerCallbackQuery(env, callbackQuery.id, "پرونده پیدا نشد");
    return { action: "payment_cancel_missing_request" };
  }

  request.status = "لغو پرداخت توسط کاربر";
  request.paymentCancelledAt = nowIso();
  await updateRequest(env, request);
  await clearState(env, chatId);

  if (messageId) await deleteMessage(env, chatId, messageId);
  await answerCallbackQuery(env, callbackQuery.id, "درخواست لغو شد");

  const adminChatId = env.ADMIN_CHAT_ID || env.BOT_OWNER;
  if (adminChatId) await sendMessage(env, adminChatId, cancelledByUserAdminText(request));

  return { action: "payment_cancelled_by_user" };
}

async function handleCallbackQuery(env, callbackQuery) {
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;
  const data = callbackQuery.data || "";

  if (!chatId) return { action: "callback_ignored" };

  const state = await getState(env, chatId);

  if (data === CALLBACKS.REJECT_COST) {
    if (messageId) await deleteMessage(env, chatId, messageId);
    await clearState(env, chatId);
    await answerCallbackQuery(env, callbackQuery.id, "درخواست لغو شد");
    return { action: "cost_rejected" };
  }

  if (data === CALLBACKS.CONFIRM_COST) {
    if (!state || state.step !== "costConfirm") {
      await answerCallbackQuery(env, callbackQuery.id, "این درخواست منقضی شده است. دوباره ثبت درخواست جدید را بزنید.");
      return { action: "cost_confirm_expired" };
    }

    if (messageId) await deleteMessage(env, chatId, messageId);
    state.step = "fullName";
    await setState(env, chatId, state);
    await answerCallbackQuery(env, callbackQuery.id, "تأیید شد");
    await sendMessage(env, chatId, "✅ تایید شد.\n\nلطفاً نام و نام خانوادگی متقاضی را وارد کنید:", removeKeyboard());
    return { action: "cost_confirmed" };
  }

  if (data.startsWith(CALLBACKS.ADMIN_APPROVE_PREFIX)) {
    return approveRequest(env, callbackQuery, data.slice(CALLBACKS.ADMIN_APPROVE_PREFIX.length));
  }

  if (data.startsWith(CALLBACKS.ADMIN_REJECT_PREFIX)) {
    return rejectRequestByAdmin(env, callbackQuery, data.slice(CALLBACKS.ADMIN_REJECT_PREFIX.length));
  }

  if (data.startsWith(CALLBACKS.PAYMENT_CANCEL_PREFIX)) {
    return cancelPaymentByUser(env, callbackQuery, data.slice(CALLBACKS.PAYMENT_CANCEL_PREFIX.length));
  }

  await answerCallbackQuery(env, callbackQuery.id);
  return { action: "callback_unknown" };
}

async function handleMessage(env, message) {
  const chatId = message.chat.id;
  const text = (message.text || "").trim();
  const command = normalizeCommand(text);

  if (command === "/start") {
    await clearState(env, chatId);
    await sendMainMenu(env, chatId);
    return { action: "start_menu_sent" };
  }

  if (command === "/cancel") {
    await clearState(env, chatId);
    await sendMessage(env, chatId, "فرآیند فعلی لغو شد.", mainKeyboard());
    return { action: "cancelled" };
  }

  const state = await getState(env, chatId);
  if (state) {
    await handleRegistrationStep(env, message, state);
    return { action: `registration_${state.step}` };
  }

  if (text === BUTTONS.REGISTER) {
    try {
      await beginRegistration(env, chatId);
    } catch {
      await sendMessage(env, chatId, "برای فعال شدن فرم ثبت درخواست، ذخیره‌سازی BOT_KV باید در Cloudflare به Worker وصل شود. اگر binding را تازه اضافه کرده‌اید، از Cloudflare روی Save and deploy یا Redeploy بزنید.");
    }
    return { action: "registration_started" };
  }
  if (text === BUTTONS.STATUS) {
    await sendStatus(env, message);
    return { action: "status_sent" };
  }
  if (text === BUTTONS.SUPPORT) {
    await sendSupport(env, chatId);
    return { action: "support_sent" };
  }
  if (text === BUTTONS.RULES) {
    await sendRules(env, chatId);
    return { action: "rules_sent" };
  }

  await sendMainMenu(env, chatId);
  return { action: "fallback_menu_sent" };
}

async function handleGet(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/debug/webhook") {
    try {
      return json({ ok: true, webhookInfo: await getWebhookInfo(env) });
    } catch (error) {
      return json({ ok: false, error: error?.message || "Unknown error" }, 500);
    }
  }

  if (url.pathname === "/debug/set-webhook") {
    try {
      return json(await setWebhook(env, `${url.origin}/`));
    } catch (error) {
      return json({ ok: false, error: error?.message || "Unknown error" }, 500);
    }
  }

  let webhookAutoSetup = null;
  if (env.BOT_TOKEN && url.searchParams.get("no_auto_webhook") !== "1") {
    try {
      webhookAutoSetup = await ensureWebhook(env, request);
    } catch (error) {
      webhookAutoSetup = { ok: false, error: error?.message || "Unknown error" };
    }
  }

  return json({
    ok: true,
    service: "ProNetIRBot Telegram webhook is running",
    workerUrl: `${url.origin}/`,
    webhookAutoSetup,
    diagnostics: {
      webhookInfo: `${url.origin}/debug/webhook`,
      setWebhook: `${url.origin}/debug/set-webhook`,
    },
    config: {
      hasBotToken: Boolean(env.BOT_TOKEN),
      hasBotOwner: Boolean(env.BOT_OWNER),
      hasAdminChatId: Boolean(env.ADMIN_CHAT_ID),
      hasBotKv: Boolean(getKv(env)),
      kvBindingName: getKvBindingName(env),
      hasBotKvBinding: Boolean(env.BOT_KV),
      hasKvBinding: Boolean(env.KV),
      hasPaymentCardNumber: Boolean(env.PAYMENT_CARD_NUMBER),
    },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "GET") return handleGet(request, env);
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    let update;
    try {
      update = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON" }, 400);
    }

    try {
      if (update?.callback_query) {
        const result = await handleCallbackQuery(env, update.callback_query);
        return json({ ok: true, ...result });
      }

      const message = update?.message;
      if (!message?.chat?.id) return json({ ok: true, ignored: true, reason: "No message chat id in update" });

      const result = await handleMessage(env, message);
      return json({ ok: true, ...result });
    } catch (error) {
      return json({ ok: false, error: "Failed to handle Telegram update", detail: error?.message || "Unknown error" }, 500);
    }
  },
};
