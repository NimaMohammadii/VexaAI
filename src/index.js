const BUTTONS = {
  REGISTER: "✅ ثبت درخواست جدید",
  STATUS: "📄 وضعیت درخواست من",
  SUPPORT: "☎️ پشتیبانی",
  END_SUPPORT: "✅ اتمام چت",
  RULES: "📌 شرایط و قوانین",
  CANCEL: "لغو",
};

const CALLBACKS = {
  CONFIRM_COST: "confirm_cost",
  REJECT_COST: "reject_cost",
  ADMIN_APPROVE_PREFIX: "admin_approve:",
  ADMIN_REJECT_PREFIX: "admin_reject:",
  ADMIN_ALLOW_RIAL_PREFIX: "admin_allow_rial:",
  ADMIN_CONFIRM_RECEIPT_PREFIX: "admin_confirm_receipt:",
  ADMIN_REJECT_RECEIPT_PREFIX: "admin_reject_receipt:",
  PAY_CRYPTO_PREFIX: "pay_crypto:",
  PAY_STARS_PREFIX: "pay_stars:",
  PAY_RIAL_PREFIX: "pay_rial:",
  PAYMENT_CANCEL_PREFIX: "payment_cancel:",
  ADMIN_PANEL: "admin_panel",
  ADMIN_USERS: "admin_users",
  ADMIN_REQUESTS: "admin_requests",
  ADMIN_WAITING: "admin_waiting",
  ADMIN_PAID: "admin_paid",
  ADMIN_PRICING: "admin_pricing",
  ADMIN_RULES: "admin_rules",
  ADMIN_BROADCAST: "admin_broadcast",
  ADMIN_USER_PREFIX: "admin_user:",
  ADMIN_MESSAGE_USER_PREFIX: "admin_msg_user:",
  ADMIN_TOGGLE_RIAL_PREFIX: "admin_toggle_rial:",
  ADMIN_TOGGLE_CRYPTO_PREFIX: "admin_toggle_crypto:",
  ADMIN_TOGGLE_STARS_PREFIX: "admin_toggle_stars:",
  ADMIN_SET_USER_PRICE_PREFIX: "admin_set_user_price:",
  ADMIN_USER_REQUESTS_PREFIX: "admin_user_requests:",
  ADMIN_REQUEST_PREFIX: "admin_request:",
  ADMIN_SET_GLOBAL_TOMAN: "admin_set_global_toman",
  ADMIN_SET_GLOBAL_CRYPTO: "admin_set_global_crypto",
  ADMIN_SET_GLOBAL_STARS: "admin_set_global_stars",
  ADMIN_TOGGLE_GLOBAL_RIAL: "admin_toggle_global_rial",
  ADMIN_TOGGLE_GLOBAL_CRYPTO: "admin_toggle_global_crypto",
  ADMIN_TOGGLE_GLOBAL_STARS: "admin_toggle_global_stars",
};

const SERVICE_OPERATOR = "همراه اول";
const ACTIVATION_PRICE = "8,500,000 تومان";
const CRYPTO_NETWORK = "USDT BNB Smart Chain";
const CRYPTO_AMOUNT = "60 USDT";
const CRYPTO_WALLET_ADDRESS = "0x7D53be6a6C16e2C2C93e0bEd57596a3FB4f72c82";
const TELEGRAM_STARS_TEST_AMOUNT = 1;
const TELEGRAM_STARS_REAL_AMOUNT = 4000;
const MAX_USER_REQUESTS = 10;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function mainKeyboard() {
  return {
    keyboard: [[{ text: BUTTONS.REGISTER }], [{ text: BUTTONS.STATUS }, { text: BUTTONS.SUPPORT }], [{ text: BUTTONS.RULES }]],
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
      [{ text: "💳 مجوز پرداخت ریالی", callback_data: `${CALLBACKS.ADMIN_ALLOW_RIAL_PREFIX}${requestId}` }],
    ],
  };
}

function receiptDecisionKeyboard(requestId) {
  return {
    inline_keyboard: [
      [
        { text: "✅ تایید رسید", callback_data: `${CALLBACKS.ADMIN_CONFIRM_RECEIPT_PREFIX}${requestId}` },
        { text: "❌ رد رسید", callback_data: `${CALLBACKS.ADMIN_REJECT_RECEIPT_PREFIX}${requestId}` },
      ],
    ],
  };
}

function supportKeyboard() {
  return {
    keyboard: [[{ text: BUTTONS.END_SUPPORT }]],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}

function paymentMethodKeyboard(requestId) {
  return {
    inline_keyboard: [
      [{ text: "⭐ پرداخت با استارز تلگرام", callback_data: `${CALLBACKS.PAY_STARS_PREFIX}${requestId}` }],
      [{ text: "₿ پرداخت با کریپتو", callback_data: `${CALLBACKS.PAY_CRYPTO_PREFIX}${requestId}` }],
      [{ text: "💳 پرداخت ریالی", callback_data: `${CALLBACKS.PAY_RIAL_PREFIX}${requestId}` }],
      [{ text: "❌ لغو درخواست", callback_data: `${CALLBACKS.PAYMENT_CANCEL_PREFIX}${requestId}` }],
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

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
const supportReplyMapKey = (adminMessageId) => `support_reply_map:${adminMessageId}`;
const userProfileKey = (userId) => `user_profile:${userId}`;
const USERS_INDEX_KEY = "admin:users";
const REQUESTS_INDEX_KEY = "admin:requests";
const PAID_REQUESTS_INDEX_KEY = "admin:paid_requests";
const WAITING_PAYMENT_INDEX_KEY = "admin:waiting_payment";
const ADMIN_SETTINGS_KEY = "admin:settings";

function isBotOwner(env, userId) {
  return String(userId) === String(env.BOT_OWNER);
}

function isPaidStatus(status = "") {
  return status.includes("پرداخت") && (status.includes("انجام") || status.includes("ارسال شد") || status.includes("تایید"));
}

function isWaitingPaymentStatus(status = "") {
  return status === "در انتظار بررسی" || status === "در انتظار انتخاب روش پرداخت" || status.includes("در انتظار");
}

function getDefaultRulesText() {
  return (
    "📱 ثبت درخواست فعلاً فقط برای سیم‌کارت همراه اول امکان‌پذیر است.\n" +
    "🪪 شماره موبایل باید به نام خود متقاضی باشد.\n" +
    `💳 هزینه انجام و پیگیری فعال‌سازی از طرف شرکت ما: ${ACTIVATION_PRICE}\n` +
    "🧾 تصویر کارت ملی باید واضح و خوانا باشد.\n" +
    "⏳ پس از بررسی، نحوه پرداخت برای شما ارسال می‌شود.\n" +
    "✅ پس از تکمیل پرداخت و تأیید نهایی، پیامک فعال‌سازی معمولاً تا ۲۴ ساعت برای شما ارسال می‌شود."
  );
}

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

async function getJsonArray(env, key) {
  const kv = getKv(env);
  if (!kv) return [];
  const raw = await kv.get(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function addUniqueToJsonArray(env, key, value, max = 1000) {
  const kv = requireKv(env);
  const items = await getJsonArray(env, key);
  const normalized = String(value);
  const filtered = items.filter((item) => String(item) !== normalized);
  filtered.unshift(value);
  await kv.put(key, JSON.stringify(filtered.slice(0, max)));
}

async function getUserProfile(env, userId) {
  const kv = getKv(env);
  if (!kv) return null;
  const raw = await kv.get(userProfileKey(userId));
  return raw ? JSON.parse(raw) : null;
}

async function updateUserProfile(env, profile) {
  await requireKv(env).put(userProfileKey(profile.userId), JSON.stringify(profile));
}

async function upsertUserProfileFromRequest(env, request) {
  const current = (await getUserProfile(env, request.telegramUserId)) || {};
  const profile = {
    userId: request.telegramUserId,
    chatId: request.chatId,
    username: request.username || current.username || "",
    firstName: request.firstName || current.firstName || "",
    lastName: request.lastName || current.lastName || "",
    phone: request.phone || current.phone || "",
    nationalId: request.nationalId || current.nationalId || "",
    lastRequestId: request.id,
    createdAt: current.createdAt || request.createdAt || nowIso(),
    updatedAt: nowIso(),
    rialPaymentAllowed: typeof current.rialPaymentAllowed === "boolean" ? current.rialPaymentAllowed : false,
    cryptoPaymentEnabled: typeof current.cryptoPaymentEnabled === "boolean" ? current.cryptoPaymentEnabled : true,
    starsPaymentEnabled: typeof current.starsPaymentEnabled === "boolean" ? current.starsPaymentEnabled : true,
    customActivationPrice: current.customActivationPrice || null,
    customCryptoAmount: current.customCryptoAmount || null,
    customStarsAmount: current.customStarsAmount || null,
  };
  if (typeof request.rialPaymentAllowed === "boolean") profile.rialPaymentAllowed = request.rialPaymentAllowed;
  await updateUserProfile(env, profile);
  return profile;
}

async function upsertUserProfileFromTelegramUser(env, messageOrCallbackUser, chatId) {
  const user = messageOrCallbackUser || {};
  const userId = user.id || chatId;
  if (!userId || !chatId) return null;

  const current = (await getUserProfile(env, userId)) || {};

  const profile = {
    userId,
    chatId,
    username: user.username || current.username || "",
    firstName: user.first_name || current.firstName || "",
    lastName: user.last_name || current.lastName || "",
    phone: current.phone || "",
    nationalId: current.nationalId || "",
    lastRequestId: current.lastRequestId || null,
    createdAt: current.createdAt || nowIso(),
    updatedAt: nowIso(),
    rialPaymentAllowed: typeof current.rialPaymentAllowed === "boolean" ? current.rialPaymentAllowed : false,
    cryptoPaymentEnabled: typeof current.cryptoPaymentEnabled === "boolean" ? current.cryptoPaymentEnabled : true,
    starsPaymentEnabled: typeof current.starsPaymentEnabled === "boolean" ? current.starsPaymentEnabled : true,
    customActivationPrice: current.customActivationPrice || null,
    customCryptoAmount: current.customCryptoAmount || null,
    customStarsAmount: current.customStarsAmount || null,
  };

  await updateUserProfile(env, profile);
  await addUniqueToJsonArray(env, USERS_INDEX_KEY, userId);
  return profile;
}

async function getAllUserProfiles(env, limit = 50) {
  const userIds = await getJsonArray(env, USERS_INDEX_KEY);
  const profiles = [];
  for (const userId of userIds.slice(0, limit)) {
    const profile = await getUserProfile(env, userId);
    if (profile) {
      profiles.push(profile);
    } else {
      profiles.push({
        userId,
        chatId: userId,
        username: "",
        firstName: "",
        lastName: "",
        phone: "",
        nationalId: "",
        lastRequestId: null,
        createdAt: "",
        updatedAt: "",
        rialPaymentAllowed: false,
        cryptoPaymentEnabled: true,
        starsPaymentEnabled: true,
      });
    }
  }
  return profiles;
}

async function getAllRequests(env, limit = 50) {
  const kv = getKv(env);
  if (!kv) return [];
  const ids = await getJsonArray(env, REQUESTS_INDEX_KEY);
  const requests = [];
  for (const id of ids.slice(0, limit)) {
    const raw = await kv.get(requestKey(id));
    if (raw) requests.push(JSON.parse(raw));
  }
  return requests;
}

async function getPaidRequests(env, limit = 50) {
  const kv = getKv(env);
  if (!kv) return [];
  const ids = await getJsonArray(env, PAID_REQUESTS_INDEX_KEY);
  const requests = [];
  for (const id of ids.slice(0, limit)) {
    const raw = await kv.get(requestKey(id));
    if (raw) requests.push(JSON.parse(raw));
  }
  return requests;
}

async function getWaitingPaymentRequests(env, limit = 50) {
  const kv = getKv(env);
  if (!kv) return [];
  const ids = await getJsonArray(env, WAITING_PAYMENT_INDEX_KEY);
  const requests = [];
  for (const id of ids.slice(0, limit)) {
    const raw = await kv.get(requestKey(id));
    if (raw) requests.push(JSON.parse(raw));
  }
  return requests;
}

async function getAdminSettings(env) {
  const kv = getKv(env);
  const defaults = {
    activationPrice: ACTIVATION_PRICE,
    cryptoAmount: CRYPTO_AMOUNT,
    starsAmount: TELEGRAM_STARS_REAL_AMOUNT,
    testStarsAmount: TELEGRAM_STARS_TEST_AMOUNT,
    rulesText: getDefaultRulesText(),
    rialPaymentGlobalEnabled: true,
    cryptoPaymentGlobalEnabled: true,
    starsPaymentGlobalEnabled: true,
  };
  if (!kv) return defaults;
  const raw = await kv.get(ADMIN_SETTINGS_KEY);
  if (!raw) return defaults;
  return { ...defaults, ...JSON.parse(raw) };
}

async function updateAdminSettings(env, patch) {
  const current = await getAdminSettings(env);
  const next = { ...current, ...patch };
  await requireKv(env).put(ADMIN_SETTINGS_KEY, JSON.stringify(next));
  return next;
}

async function getEffectivePricing(env, userId) {
  const settings = await getAdminSettings(env);
  const profile = await getUserProfile(env, userId);
  return {
    activationPrice: profile?.customActivationPrice || settings.activationPrice,
    cryptoAmount: profile?.customCryptoAmount || settings.cryptoAmount,
    starsAmount: profile?.customStarsAmount || settings.starsAmount,
    testStarsAmount: profile?.customStarsAmount || settings.testStarsAmount,
  };
}

async function saveRequest(env, request) {
  const kv = requireKv(env);
  await kv.put(requestKey(request.id), JSON.stringify(request));

  const listKey = userRequestsKey(request.telegramUserId);
  const existing = await kv.get(listKey);
  const requestIds = existing ? JSON.parse(existing) : [];
  requestIds.unshift(request.id);
  await kv.put(listKey, JSON.stringify(requestIds.slice(0, MAX_USER_REQUESTS)));

  await upsertUserProfileFromRequest(env, request);
  await addUniqueToJsonArray(env, USERS_INDEX_KEY, request.telegramUserId);
  await addUniqueToJsonArray(env, REQUESTS_INDEX_KEY, request.id);
  if (isWaitingPaymentStatus(request.status)) {
    await addUniqueToJsonArray(env, WAITING_PAYMENT_INDEX_KEY, request.id);
  }
  if (isPaidStatus(request.status)) {
    await addUniqueToJsonArray(env, PAID_REQUESTS_INDEX_KEY, request.id);
  }
}

async function updateRequest(env, request) {
  await requireKv(env).put(requestKey(request.id), JSON.stringify(request));
  await upsertUserProfileFromRequest(env, request);
  await addUniqueToJsonArray(env, USERS_INDEX_KEY, request.telegramUserId);
  await addUniqueToJsonArray(env, REQUESTS_INDEX_KEY, request.id);
  if (isWaitingPaymentStatus(request.status)) {
    await addUniqueToJsonArray(env, WAITING_PAYMENT_INDEX_KEY, request.id);
  }
  if (isPaidStatus(request.status)) {
    await addUniqueToJsonArray(env, PAID_REQUESTS_INDEX_KEY, request.id);
  }
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

async function saveSupportReplyMap(env, adminMessageId, data) {
  await requireKv(env).put(supportReplyMapKey(adminMessageId), JSON.stringify(data), { expirationTtl: 60 * 60 * 24 * 7 });
}

async function getSupportReplyMap(env, adminMessageId) {
  const kv = getKv(env);
  if (!kv) return null;
  const raw = await kv.get(supportReplyMapKey(adminMessageId));
  return raw ? JSON.parse(raw) : null;
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
    allowed_updates: ["message", "callback_query", "pre_checkout_query"],
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
  const hasPreCheckoutUpdates = allowedUpdates.length === 0 || allowedUpdates.includes("pre_checkout_query");

  if (before.url === webhookUrl && hasCallbackUpdates && hasPreCheckoutUpdates) {
    return { changed: false, webhookUrl, before, after: before };
  }

  const setResult = await setWebhook(env, webhookUrl);
  return { changed: true, webhookUrl, before, after: setResult.webhookInfo, description: setResult.description };
}

async function sendMessage(env, chatId, text, replyMarkup = undefined, options = {}) {
  return telegramApi(env, "sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: replyMarkup,
    ...options,
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

async function editMessageText(env, chatId, messageId, text, replyMarkup = undefined, options = {}) {
  return telegramApi(env, "editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    reply_markup: replyMarkup,
    ...options,
  });
}

async function editMessageHtml(env, chatId, messageId, text, replyMarkup = undefined) {
  return editMessageText(env, chatId, messageId, text, replyMarkup, { parse_mode: "HTML" });
}

async function answerPreCheckoutQuery(env, preCheckoutQueryId, ok, errorMessage = undefined) {
  return telegramApi(env, "answerPreCheckoutQuery", {
    pre_checkout_query_id: preCheckoutQueryId,
    ok,
    error_message: errorMessage,
  });
}

async function sendStarsInvoice(env, chatId, request, starsAmount) {
  return telegramApi(env, "sendInvoice", {
    chat_id: chatId,
    title: "پرداخت تستی Telegram Stars",
    description: `پرداخت تستی برای پرونده ${request.id}`,
    payload: `stars:${request.id}`,
    provider_token: "",
    currency: "XTR",
    prices: [{ label: `Stars test ${request.id}`, amount: Number(starsAmount) || TELEGRAM_STARS_TEST_AMOUNT }],
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
  const settings = await getAdminSettings(env);
  return sendMessage(
    env,
    chatId,
    `📌 شرایط و قوانین\n\n${settings.rulesText || getDefaultRulesText()}`,
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
    `روش پرداخت: ${request.paymentMethod || "انتخاب نشده"}\n` +
    `یوزرنیم تلگرام: ${username}\n` +
    `آیدی کاربر: ${request.telegramUserId}\n` +
    `زمان لغو: ${request.paymentCancelledAt || nowIso()}`
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
    `روش پرداخت: ${request.paymentMethod || "نامشخص"}\n` +
    `مبلغ: ${request.paymentAmount || ACTIVATION_PRICE}\n` +
    `وضعیت: ${request.status}\n` +
    `تاریخ ارسال رسید: ${request.paymentReceiptSentAt || nowIso()}`;

  const payload = { chat_id: adminChatId, caption, reply_markup: receiptDecisionKeyboard(request.id) };
  if (receiptDocument.type === "photo") {
    await telegramApi(env, "sendPhoto", { ...payload, photo: receiptDocument.fileId });
  } else {
    await telegramApi(env, "sendDocument", { ...payload, document: receiptDocument.fileId });
  }
}

async function notifyAdminSupportMessage(env, message) {
  const adminChatId = env.ADMIN_CHAT_ID || env.BOT_OWNER;
  if (!adminChatId) return false;

  const chatId = message.chat.id;
  const userId = message.from?.id || chatId;
  const username = message.from?.username ? `@${message.from.username}` : "ندارد";
  const firstName = message.from?.first_name || "";
  const lastName = message.from?.last_name || "";
  const requests = await getUserRequests(env, userId);
  const lastRequest = requests[0];
  const incomingDocument = getIncomingDocument(message);
  const userText = (message.text || "").trim();
  const messageType = userText || (incomingDocument?.type === "photo" ? "📷 عکس" : incomingDocument ? "📎 فایل" : "پیام بدون متن");

  const caption =
    "☎️ پیام جدید پشتیبانی\n\n" +
    `آیدی عددی کاربر: ${userId}\n` +
    `یوزرنیم: ${username}\n` +
    `نام تلگرام: ${(firstName + " " + lastName).trim() || "ندارد"}\n` +
    `موبایل: ${lastRequest?.phone || "نامشخص"}\n` +
    `کد ملی: ${lastRequest?.nationalId || "نامشخص"}\n` +
    `آخرین پرونده: ${lastRequest?.id || "ندارد"}\n\n` +
    `پیام کاربر:\n${messageType}`;

  let adminResult;
  if (incomingDocument?.type === "photo") {
    adminResult = await telegramApi(env, "sendPhoto", { chat_id: adminChatId, photo: incomingDocument.fileId, caption });
  } else if (incomingDocument?.type === "document") {
    adminResult = await telegramApi(env, "sendDocument", { chat_id: adminChatId, document: incomingDocument.fileId, caption });
  } else {
    adminResult = await sendMessage(env, adminChatId, caption);
  }

  const adminMessageId = adminResult?.result?.message_id;
  if (adminMessageId) {
    await saveSupportReplyMap(env, adminMessageId, {
      userChatId: chatId,
      userId,
      username,
      createdAt: nowIso(),
    });
  }
  return true;
}

async function beginRegistration(env, chatId, userId) {
  requireKv(env);
  const pricing = await getEffectivePricing(env, userId || chatId);
  await setState(env, chatId, { step: "costConfirm", data: {}, startedAt: nowIso() });
  const sent = await sendMessage(
    env,
    chatId,
    "💎 ثبت درخواست اینترنت پرو\n\n" +
      `💳 هزینه انجام و پیگیری فعال‌سازی از طرف شرکت ما برای شما ${pricing.activationPrice} است.\n\n` +
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
    rialPaymentAllowed: false,
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

  const methodTitle = request.paymentMethod || state.method || "نامشخص";
  request.status = `رسید پرداخت ${methodTitle} ارسال شد`;
  request.paymentReceipt = receiptDocument;
  request.paymentReceiptSentAt = nowIso();
  await updateRequest(env, request);
  await clearState(env, chatId);

  await sendMessage(
    env,
    chatId,
    "✅ رسید پرداخت شما دریافت شد.\n\n⚡ درخواست شما برای دریافت اینترنت پرو وارد مرحله تأیید پرداخت و فعال‌سازی می‌شود.\n\n📩 پس از تأیید نهایی، معمولاً تا ۲۴ ساعت پیامک فعال‌سازی اینترنت پرو را دریافت می‌کنید.",
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
      const profile = (await getUserProfile(env, message.from?.id || chatId)) || {
        userId: message.from?.id || chatId,
        chatId,
        createdAt: nowIso(),
      };
      profile.phone = phone;
      profile.username = message.from?.username || profile.username || "";
      profile.firstName = message.from?.first_name || profile.firstName || "";
      profile.lastName = message.from?.last_name || profile.lastName || "";
      profile.updatedAt = nowIso();
      await updateUserProfile(env, profile);
      await addUniqueToJsonArray(env, USERS_INDEX_KEY, profile.userId);
      return sendMessage(env, chatId, "🪪 کد ملی ۱۰ رقمی متقاضی را وارد کنید:");
    }

    case "nationalId": {
      const nationalId = cleanNationalId(text);
      if (!isValidNationalId(nationalId)) return sendMessage(env, chatId, "کد ملی باید ۱۰ رقم باشد. لطفاً دوباره وارد کنید:");
      state.data.nationalId = nationalId;
      state.step = "nationalCard";
      await setState(env, chatId, state);
      const profile = (await getUserProfile(env, message.from?.id || chatId)) || {
        userId: message.from?.id || chatId,
        chatId,
        createdAt: nowIso(),
      };
      profile.nationalId = nationalId;
      profile.username = message.from?.username || profile.username || "";
      profile.firstName = message.from?.first_name || profile.firstName || "";
      profile.lastName = message.from?.last_name || profile.lastName || "";
      profile.updatedAt = nowIso();
      await updateUserProfile(env, profile);
      await addUniqueToJsonArray(env, USERS_INDEX_KEY, profile.userId);
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

    case "supportChat":
      if (text === BUTTONS.END_SUPPORT) {
        await clearState(env, chatId);
        return sendMessage(env, chatId, "✅ چت پشتیبانی بسته شد.", mainKeyboard());
      }

      try {
        await notifyAdminSupportMessage(env, message, state);
        return sendMessage(env, chatId, "✅ پیام شما برای پشتیبانی ارسال شد.");
      } catch {
        return sendMessage(env, chatId, "پیام شما ثبت شد، اما ارسال به پشتیبانی با خطا روبه‌رو شد. لطفاً دوباره تلاش کنید.");
      }

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

  request.status = "در انتظار انتخاب روش پرداخت";
  request.approvedAt = nowIso();
  await updateRequest(env, request);

  if (adminChatId && adminMessageId) await editMessageReplyMarkup(env, adminChatId, adminMessageId);

  const paymentMessage =
    "✅ <b>درخواست شما تایید شد.</b>\n\n" +
    "حالا بفرمایید پرداخت را با چه روشی انجام می‌دهید؟\n\n" +
    "⭐ Telegram Stars\n" +
    "₿ Crypto\n" +
    "💳 پرداخت ریالی";

  await clearState(env, request.chatId);
  await sendMessage(env, request.chatId, paymentMessage, paymentMethodKeyboard(request.id), { parse_mode: "HTML" });

  await answerCallbackQuery(env, callbackQuery.id, "انتخاب روش پرداخت برای کاربر ارسال شد");
  await sendMessage(env, adminChatId, `✅ انتخاب روش پرداخت برای پرونده ${request.id} ارسال شد.`);
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

async function allowRialPaymentByAdmin(env, callbackQuery, requestId) {
  const adminChatId = callbackQuery.message?.chat?.id;
  const request = await getRequest(env, requestId);

  if (!request) {
    await answerCallbackQuery(env, callbackQuery.id, "پرونده پیدا نشد");
    return { action: "admin_allow_rial_missing_request" };
  }

  request.rialPaymentAllowed = true;
  request.rialPaymentAllowedAt = nowIso();
  await updateRequest(env, request);
  const profile = (await getUserProfile(env, request.telegramUserId)) || { userId: request.telegramUserId, chatId: request.chatId };
  profile.rialPaymentAllowed = true;
  profile.updatedAt = nowIso();
  await updateUserProfile(env, profile);

  await answerCallbackQuery(env, callbackQuery.id, "مجوز پرداخت ریالی فعال شد");
  if (adminChatId) {
    await sendMessage(env, adminChatId, `💳 مجوز پرداخت ریالی برای پرونده ${request.id} فعال شد.`);
  }
  return { action: "admin_allowed_rial_payment" };
}

async function confirmReceiptByAdmin(env, callbackQuery, requestId) {
  const adminChatId = callbackQuery.message?.chat?.id;
  const adminMessageId = callbackQuery.message?.message_id;
  const request = await getRequest(env, requestId);

  if (!request) {
    await answerCallbackQuery(env, callbackQuery.id, "پرونده پیدا نشد");
    return { action: "admin_confirm_receipt_missing_request" };
  }

  request.status = "ثبت شده و درحال دریافت پیامک اینترنت پرو";
  request.paymentConfirmedAt = nowIso();
  request.paymentConfirmedByAdmin = callbackQuery.from?.id || "";
  await updateRequest(env, request);

  if (adminChatId && adminMessageId) await editMessageReplyMarkup(env, adminChatId, adminMessageId);
  await answerCallbackQuery(env, callbackQuery.id, "رسید تایید شد");
  if (adminChatId) await sendMessage(env, adminChatId, `✅ رسید پرونده ${request.id} تایید شد و وضعیت کاربر بروزرسانی شد.`);
  await sendMessage(
    env,
    request.chatId,
    "✅ <b>پرداخت شما تایید شد.</b>\n\n" +
      "پرونده شما با موفقیت ثبت شد و وارد مرحله دریافت پیامک فعال‌سازی اینترنت پرو شد.\n\n" +
      "📩 معمولاً تا ۲۴ ساعت آینده پیامک فعال‌سازی اینترنت پرو را دریافت می‌کنید.\n\n" +
      `شماره پرونده: <b>${escapeHtml(request.id)}</b>`,
    mainKeyboard(),
    { parse_mode: "HTML" },
  );
  return { action: "admin_confirmed_receipt" };
}

async function rejectReceiptByAdmin(env, callbackQuery, requestId) {
  const adminChatId = callbackQuery.message?.chat?.id;
  const adminMessageId = callbackQuery.message?.message_id;
  const request = await getRequest(env, requestId);

  if (!request) {
    await answerCallbackQuery(env, callbackQuery.id, "پرونده پیدا نشد");
    return { action: "admin_reject_receipt_missing_request" };
  }

  request.status = "رسید پرداخت رد شد";
  request.paymentRejectedAt = nowIso();
  await updateRequest(env, request);

  if (adminChatId && adminMessageId) await editMessageReplyMarkup(env, adminChatId, adminMessageId);
  await answerCallbackQuery(env, callbackQuery.id, "رسید رد شد");

  await setState(env, request.chatId, {
    step: "paymentReceipt",
    requestId: request.id,
    method: request.paymentMethod || "unknown",
    startedAt: nowIso(),
  });
  await sendMessage(
    env,
    request.chatId,
    "❌ رسید پرداخت شما تایید نشد. لطفاً رسید صحیح را دوباره ارسال کنید یا با پشتیبانی تماس بگیرید.",
    mainKeyboard(),
  );
  return { action: "admin_rejected_receipt" };
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

async function handleCryptoPaymentSelection(env, callbackQuery, requestId) {
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;
  const request = await getRequest(env, requestId);

  if (!chatId || !messageId || !request) {
    await answerCallbackQuery(env, callbackQuery.id, "پرونده پیدا نشد");
    return { action: "pay_crypto_missing_request" };
  }
  const settings = await getAdminSettings(env);
  const profile = await getUserProfile(env, request.telegramUserId);
  if (!settings.cryptoPaymentGlobalEnabled || profile?.cryptoPaymentEnabled === false) {
    await answerCallbackQuery(env, callbackQuery.id, "پرداخت کریپتو غیرفعال است");
    await sendMessage(env, chatId, "₿ پرداخت کریپتو برای حساب شما فعلاً غیرفعال است. لطفاً روش دیگری انتخاب کنید یا با پشتیبانی تماس بگیرید.");
    return { action: "pay_crypto_disabled" };
  }
  const pricing = await getEffectivePricing(env, request.telegramUserId);

  const paymentText =
    "₿ <b>پرداخت با کریپتو</b>\n\n" +
    `<b>شبکه:</b> ${escapeHtml(CRYPTO_NETWORK)}\n` +
    `<b>مبلغ:</b> ${escapeHtml(pricing.cryptoAmount)}\n\n` +
    "<b>آدرس ولت:</b>\n" +
    `<code>${escapeHtml(CRYPTO_WALLET_ADDRESS)}</code>\n\n` +
    "🧾 <b>بعد از پرداخت، فقط تصویر رسید را همین‌جا ارسال کنید.</b>\n\n" +
    "📩 پس از تأیید پرداخت، معمولاً تا ۲۴ ساعت پیامک فعال‌سازی اینترنت پرو را دریافت می‌کنید.";

  await editMessageText(env, chatId, messageId, paymentText, paymentCancelKeyboard(request.id), { parse_mode: "HTML" });

  await setState(env, chatId, {
    step: "paymentReceipt",
    requestId: request.id,
    method: "crypto",
    paymentMessageId: messageId,
    startedAt: nowIso(),
  });

  request.status = "در انتظار رسید کریپتو";
  request.paymentMethod = "Crypto USDT BNB Smart Chain";
  request.paymentAmount = pricing.cryptoAmount;
  await updateRequest(env, request);

  await answerCallbackQuery(env, callbackQuery.id, "اطلاعات پرداخت کریپتو نمایش داده شد");
  return { action: "pay_crypto_selected" };
}

async function handleRialPaymentSelection(env, callbackQuery, requestId) {
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;
  const request = await getRequest(env, requestId);

  if (!chatId || !messageId || !request) {
    await answerCallbackQuery(env, callbackQuery.id, "پرونده پیدا نشد");
    return { action: "pay_rial_missing_request" };
  }
  const settings = await getAdminSettings(env);
  const profile = await getUserProfile(env, request.telegramUserId);
  const rialAllowed = profile?.rialPaymentAllowed === true || request.rialPaymentAllowed === true;

  if (!settings.rialPaymentGlobalEnabled || !rialAllowed) {
    await answerCallbackQuery(env, callbackQuery.id, "مجوز پرداخت ریالی ندارید");
    await editMessageHtml(
      env,
      chatId,
      messageId,
      "💳 <b>پرداخت ریالی</b>\n\n" +
        "شما فعلاً اجازه پرداخت کارت‌به‌کارت ندارید.\n\n" +
        "برای دریافت مجوز پرداخت ریالی، لطفاً از بخش <b>پشتیبانی</b> پیام بدهید.\n\n" +
        "فعلاً می‌توانید از روش‌های دیگر پرداخت استفاده کنید.",
      paymentMethodKeyboard(request.id),
    );
    return { action: "pay_rial_not_allowed" };
  }
  const pricing = await getEffectivePricing(env, request.telegramUserId);

  const paymentText =
    "💳 <b>پرداخت ریالی</b>\n\n" +
    `<b>مبلغ قابل پرداخت:</b> ${escapeHtml(pricing.activationPrice)}\n` +
    "<b>شماره کارت:</b>\n" +
    `${escapeHtml(getPaymentCardNumber(env))}\n\n` +
    "🧾 <b>بعد از پرداخت، فقط تصویر رسید را همین‌جا ارسال کنید.</b>\n\n" +
    "⚡ بعد از ارسال رسید و تأیید پرداخت، درخواست شما برای دریافت اینترنت پرو وارد مرحله فعال‌سازی می‌شود.\n" +
    "📩 پس از تکمیل پرداخت و تأیید نهایی، معمولاً تا ۲۴ ساعت پیامک فعال‌سازی اینترنت پرو را دریافت می‌کنید.";

  await editMessageText(env, chatId, messageId, paymentText, paymentCancelKeyboard(request.id), { parse_mode: "HTML" });

  await setState(env, chatId, {
    step: "paymentReceipt",
    requestId: request.id,
    method: "rial",
    paymentMessageId: messageId,
    startedAt: nowIso(),
  });

  request.status = "در انتظار رسید ریالی";
  request.paymentMethod = "پرداخت ریالی";
  request.paymentAmount = pricing.activationPrice;
  await updateRequest(env, request);

  await answerCallbackQuery(env, callbackQuery.id, "اطلاعات پرداخت ریالی نمایش داده شد");
  return { action: "pay_rial_selected" };
}

async function handleStarsPaymentSelection(env, callbackQuery, requestId) {
  const chatId = callbackQuery.message?.chat?.id;
  const request = await getRequest(env, requestId);

  if (!chatId || !request) {
    await answerCallbackQuery(env, callbackQuery.id, "پرونده پیدا نشد");
    return { action: "pay_stars_missing_request" };
  }
  const settings = await getAdminSettings(env);
  const profile = await getUserProfile(env, request.telegramUserId);
  if (!settings.starsPaymentGlobalEnabled || profile?.starsPaymentEnabled === false) {
    await answerCallbackQuery(env, callbackQuery.id, "پرداخت استارز غیرفعال است");
    await sendMessage(env, chatId, "⭐ پرداخت با استارز برای حساب شما فعلاً غیرفعال است. لطفاً روش دیگری انتخاب کنید یا با پشتیبانی تماس بگیرید.");
    return { action: "pay_stars_disabled" };
  }
  const pricing = await getEffectivePricing(env, request.telegramUserId);

  request.status = "در انتظار پرداخت استارز";
  request.paymentMethod = "Telegram Stars";
  request.paymentAmount = `${pricing.testStarsAmount} Stars تستی`;
  request.starsInvoiceSentAt = nowIso();
  await updateRequest(env, request);

  await sendStarsInvoice(env, chatId, request, pricing.testStarsAmount);
  await answerCallbackQuery(env, callbackQuery.id, "فاکتور تستی استارز ارسال شد");
  return { action: "pay_stars_invoice_sent" };
}

async function handlePreCheckoutQuery(env, preCheckoutQuery) {
  await answerPreCheckoutQuery(env, preCheckoutQuery.id, true);
  return { action: "pre_checkout_answered" };
}

async function handleSuccessfulPayment(env, message) {
  const chatId = message.chat?.id;
  const payment = message.successful_payment;

  if (!chatId || !payment?.invoice_payload?.startsWith("stars:")) {
    return { action: "successful_payment_ignored" };
  }

  const requestId = payment.invoice_payload.slice("stars:".length);
  const request = await getRequest(env, requestId);
  if (!request) return { action: "successful_payment_missing_request" };

  request.status = "پرداخت استارز انجام شد";
  request.paymentMethod = "Telegram Stars";
  const pricing = await getEffectivePricing(env, request.telegramUserId);
  request.paymentAmount = `${pricing.testStarsAmount} Stars تستی`;
  request.starsPaidAt = nowIso();
  request.telegramPaymentChargeId = payment.telegram_payment_charge_id || "";
  request.providerPaymentChargeId = payment.provider_payment_charge_id || "";
  await updateRequest(env, request);
  await clearState(env, chatId);

  await sendMessage(
    env,
    chatId,
    "✅ پرداخت استارز با موفقیت انجام شد.\n\n⚡ درخواست شما برای دریافت اینترنت پرو وارد مرحله تأیید نهایی و فعال‌سازی شد.\n\n📩 پس از تأیید نهایی، معمولاً تا ۲۴ ساعت پیامک فعال‌سازی اینترنت پرو را دریافت می‌کنید.",
    mainKeyboard(),
  );

  const adminChatId = env.ADMIN_CHAT_ID || env.BOT_OWNER;
  if (adminChatId) {
    await sendMessage(
      env,
      adminChatId,
      "⭐ پرداخت استارز انجام شد\n\n" +
        `شماره پرونده: ${request.id}\n` +
        `نام: ${request.fullName}\n` +
        `موبایل: ${request.phone}\n` +
        `کد ملی: ${request.nationalId}\n` +
        `روش پرداخت: ${request.paymentMethod}\n` +
        `مبلغ: ${request.paymentAmount}\n` +
        `وضعیت: ${request.status}\n` +
        `Telegram charge id: ${request.telegramPaymentChargeId}\n` +
        `Provider charge id: ${request.providerPaymentChargeId}\n` +
        `زمان پرداخت: ${request.starsPaidAt}`,
    );
  }

  return { action: "successful_payment_processed" };
}

function adminPanelKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "👥 کاربران", callback_data: CALLBACKS.ADMIN_USERS }],
      [{ text: "📄 همه درخواست‌ها", callback_data: CALLBACKS.ADMIN_REQUESTS }],
      [{ text: "⏳ منتظر پرداخت", callback_data: CALLBACKS.ADMIN_WAITING }],
      [{ text: "✅ پرداخت‌شده‌ها", callback_data: CALLBACKS.ADMIN_PAID }],
      [{ text: "⚙️ تنظیمات قیمت", callback_data: CALLBACKS.ADMIN_PRICING }],
      [{ text: "📌 شرایط و قوانین", callback_data: CALLBACKS.ADMIN_RULES }],
      [{ text: "📣 پیام همگانی", callback_data: CALLBACKS.ADMIN_BROADCAST }],
    ],
  };
}

async function renderAdminPanelText(env) {
  const usersCount = (await getJsonArray(env, USERS_INDEX_KEY)).length;
  const requestsCount = (await getJsonArray(env, REQUESTS_INDEX_KEY)).length;
  const waitingCount = (await getJsonArray(env, WAITING_PAYMENT_INDEX_KEY)).length;
  const paidCount = (await getJsonArray(env, PAID_REQUESTS_INDEX_KEY)).length;
  return (
    "🛠 <b>پنل مدیریت ProNetIRBot</b>\n\n" +
    `👥 تعداد کاربران: ${usersCount}\n` +
    `📄 تعداد کل درخواست‌ها: ${requestsCount}\n` +
    `⏳ منتظر پرداخت/بررسی: ${waitingCount}\n` +
    `✅ پرداخت‌شده‌ها: ${paidCount}\n\n` +
    "یکی از بخش‌ها را انتخاب کنید:"
  );
}

async function showAdminPanel(env, chatId, messageId = null) {
  const text = await renderAdminPanelText(env);
  if (messageId) return editMessageHtml(env, chatId, messageId, text, adminPanelKeyboard());
  return sendMessage(env, chatId, text, adminPanelKeyboard(), { parse_mode: "HTML" });
}

async function showAdminUsers(env, chatId, messageId) {
  const profiles = await getAllUserProfiles(env, 10);
  const buttons = profiles.map((profile) => {
    const title = `${profile.firstName || profile.username || profile.userId} - ${profile.phone || profile.userId}`;
    return [{ text: title, callback_data: `${CALLBACKS.ADMIN_USER_PREFIX}${profile.userId}` }];
  });
  buttons.push([{ text: "🔙 برگشت", callback_data: CALLBACKS.ADMIN_PANEL }]);
  return editMessageHtml(env, chatId, messageId, "👥 <b>آخرین کاربران</b>", { inline_keyboard: buttons });
}

async function formatUserProfileText(env, userId) {
  const profile = await getUserProfile(env, userId);
  if (!profile) return "کاربر یافت نشد.";
  const req = profile.lastRequestId ? await getRequest(env, profile.lastRequestId) : null;
  return (
    "👤 <b>پروفایل کاربر</b>\n\n" +
    `آیدی عددی: ${escapeHtml(profile.userId)}\n` +
    `یوزرنیم: ${escapeHtml(profile.username ? `@${profile.username}` : "ندارد")}\n` +
    `نام تلگرام: ${escapeHtml(`${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "ندارد")}\n` +
    `موبایل: ${escapeHtml(profile.phone || "ندارد")}\n` +
    `کد ملی: ${escapeHtml(profile.nationalId || "ندارد")}\n` +
    `آخرین پرونده: ${escapeHtml(profile.lastRequestId || "ندارد")}\n` +
    `وضعیت آخرین پرونده: ${escapeHtml(req?.status || "نامشخص")}\n` +
    `مجوز پرداخت ریالی: ${profile.rialPaymentAllowed ? "فعال" : "غیرفعال"}\n` +
    `پرداخت کریپتو: ${profile.cryptoPaymentEnabled !== false ? "فعال" : "غیرفعال"}\n` +
    `پرداخت استارز: ${profile.starsPaymentEnabled !== false ? "فعال" : "غیرفعال"}\n` +
    `قیمت اختصاصی تومانی: ${escapeHtml(profile.customActivationPrice || "-")}\n` +
    `مبلغ اختصاصی کریپتو: ${escapeHtml(profile.customCryptoAmount || "-")}\n` +
    `استارز اختصاصی: ${escapeHtml(profile.customStarsAmount || "-")}`
  );
}

function userProfileKeyboard(userId) {
  return {
    inline_keyboard: [
      [{ text: "✉️ پیام به کاربر", callback_data: `${CALLBACKS.ADMIN_MESSAGE_USER_PREFIX}${userId}` }],
      [{ text: "💳 فعال/غیرفعال ریالی", callback_data: `${CALLBACKS.ADMIN_TOGGLE_RIAL_PREFIX}${userId}` }],
      [{ text: "₿ فعال/غیرفعال کریپتو", callback_data: `${CALLBACKS.ADMIN_TOGGLE_CRYPTO_PREFIX}${userId}` }],
      [{ text: "⭐ فعال/غیرفعال استارز", callback_data: `${CALLBACKS.ADMIN_TOGGLE_STARS_PREFIX}${userId}` }],
      [{ text: "💰 تغییر قیمت اختصاصی", callback_data: `${CALLBACKS.ADMIN_SET_USER_PRICE_PREFIX}${userId}` }],
      [{ text: "📄 درخواست‌های کاربر", callback_data: `${CALLBACKS.ADMIN_USER_REQUESTS_PREFIX}${userId}` }],
      [{ text: "🔙 برگشت", callback_data: CALLBACKS.ADMIN_USERS }],
    ],
  };
}

async function showAdminUserProfile(env, chatId, messageId, userId) {
  return editMessageHtml(env, chatId, messageId, await formatUserProfileText(env, userId), userProfileKeyboard(userId));
}

async function showAdminRequests(env, chatId, messageId, mode = "all") {
  const requests =
    mode === "paid" ? await getPaidRequests(env, 10) : mode === "waiting" ? await getWaitingPaymentRequests(env, 10) : await getAllRequests(env, 10);
  const buttons = requests.map((request) => [
    {
      text: `${request.status} - ${request.phone || request.fullName || request.id}`,
      callback_data: `${CALLBACKS.ADMIN_REQUEST_PREFIX}${request.id}`,
    },
  ]);
  buttons.push([{ text: "🔙 برگشت", callback_data: CALLBACKS.ADMIN_PANEL }]);
  const title = mode === "paid" ? "✅ پرداخت‌شده‌ها" : mode === "waiting" ? "⏳ منتظر پرداخت/بررسی" : "📄 همه درخواست‌ها";
  return editMessageHtml(env, chatId, messageId, `<b>${title}</b>`, { inline_keyboard: buttons });
}

async function showAdminRequestDetails(env, chatId, messageId, requestId) {
  const request = await getRequest(env, requestId);
  if (!request) return editMessageHtml(env, chatId, messageId, "درخواست پیدا نشد.", { inline_keyboard: [[{ text: "🔙 برگشت", callback_data: CALLBACKS.ADMIN_REQUESTS }]] });
  const text =
    "📄 <b>جزئیات درخواست</b>\n\n" +
    `شماره پرونده: ${escapeHtml(request.id)}\n` +
    `نام: ${escapeHtml(request.fullName || "-")}\n` +
    `موبایل: ${escapeHtml(request.phone || "-")}\n` +
    `کد ملی: ${escapeHtml(request.nationalId || "-")}\n` +
    `اپراتور: ${escapeHtml(request.operator || "-")}\n` +
    `وضعیت: ${escapeHtml(request.status || "-")}\n` +
    `روش پرداخت: ${escapeHtml(request.paymentMethod || "-")}\n` +
    `مبلغ: ${escapeHtml(request.paymentAmount || "-")}\n` +
    `تاریخ ثبت: ${escapeHtml(request.createdAt || "-")}\n` +
    `تاریخ رسید: ${escapeHtml(request.paymentReceiptSentAt || "-")}\n` +
    `تاریخ تایید پرداخت: ${escapeHtml(request.paymentConfirmedAt || "-")}\n` +
    `chatId/userId: ${escapeHtml(request.chatId || "-")} / ${escapeHtml(request.telegramUserId || "-")}`;
  const buttons = [];
  if (request.paymentReceipt && !request.paymentConfirmedAt) {
    buttons.push([{ text: "✅ تایید رسید", callback_data: `${CALLBACKS.ADMIN_CONFIRM_RECEIPT_PREFIX}${request.id}` }]);
    buttons.push([{ text: "❌ رد رسید", callback_data: `${CALLBACKS.ADMIN_REJECT_RECEIPT_PREFIX}${request.id}` }]);
  }
  buttons.push([{ text: "💳 مجوز پرداخت ریالی", callback_data: `${CALLBACKS.ADMIN_ALLOW_RIAL_PREFIX}${request.id}` }]);
  buttons.push([{ text: "✉️ پیام به کاربر", callback_data: `${CALLBACKS.ADMIN_MESSAGE_USER_PREFIX}${request.telegramUserId}` }]);
  buttons.push([{ text: "🔙 برگشت", callback_data: CALLBACKS.ADMIN_REQUESTS }]);
  return editMessageHtml(env, chatId, messageId, text, { inline_keyboard: buttons });
}

async function showAdminPricing(env, chatId, messageId) {
  const settings = await getAdminSettings(env);
  const text =
    "⚙️ <b>تنظیمات قیمت</b>\n\n" +
    `قیمت ریالی همگانی: ${escapeHtml(settings.activationPrice)}\n` +
    `مبلغ کریپتو: ${escapeHtml(settings.cryptoAmount)}\n` +
    `استارز واقعی: ${escapeHtml(settings.starsAmount)}\n` +
    `استارز تستی: ${escapeHtml(settings.testStarsAmount)}\n` +
    `وضعیت ریالی: ${settings.rialPaymentGlobalEnabled ? "فعال" : "غیرفعال"}\n` +
    `وضعیت کریپتو: ${settings.cryptoPaymentGlobalEnabled ? "فعال" : "غیرفعال"}\n` +
    `وضعیت استارز: ${settings.starsPaymentGlobalEnabled ? "فعال" : "غیرفعال"}`;
  return editMessageHtml(env, chatId, messageId, text, {
    inline_keyboard: [
      [{ text: "تغییر قیمت ریالی", callback_data: CALLBACKS.ADMIN_SET_GLOBAL_TOMAN }],
      [{ text: "تغییر مبلغ کریپتو", callback_data: CALLBACKS.ADMIN_SET_GLOBAL_CRYPTO }],
      [{ text: "تغییر استارز", callback_data: CALLBACKS.ADMIN_SET_GLOBAL_STARS }],
      [{ text: "فعال/غیرفعال ریالی همگانی", callback_data: CALLBACKS.ADMIN_TOGGLE_GLOBAL_RIAL }],
      [{ text: "فعال/غیرفعال کریپتو همگانی", callback_data: CALLBACKS.ADMIN_TOGGLE_GLOBAL_CRYPTO }],
      [{ text: "فعال/غیرفعال استارز همگانی", callback_data: CALLBACKS.ADMIN_TOGGLE_GLOBAL_STARS }],
      [{ text: "🔙 برگشت", callback_data: CALLBACKS.ADMIN_PANEL }],
    ],
  });
}

async function handleCallbackQuery(env, callbackQuery) {
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;
  const data = callbackQuery.data || "";

  if (!chatId) return { action: "callback_ignored" };
  try {
    await upsertUserProfileFromTelegramUser(env, callbackQuery.from, chatId);
  } catch (error) {
    console.log("Failed to upsert callback user profile", error?.message || error);
  }

  const state = await getState(env, chatId);
  const callbackUserId = callbackQuery.from?.id || chatId;
  const isAdminCallback =
    data.startsWith("admin_") ||
    data === CALLBACKS.ADMIN_PANEL ||
    data === CALLBACKS.ADMIN_USERS ||
    data === CALLBACKS.ADMIN_REQUESTS ||
    data === CALLBACKS.ADMIN_WAITING ||
    data === CALLBACKS.ADMIN_PAID ||
    data === CALLBACKS.ADMIN_PRICING ||
    data === CALLBACKS.ADMIN_RULES ||
    data === CALLBACKS.ADMIN_BROADCAST;

  if (isAdminCallback && !isBotOwner(env, callbackUserId)) {
    await answerCallbackQuery(env, callbackQuery.id, "دسترسی ندارید");
    return { action: "admin_callback_denied" };
  }

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

  if (data.startsWith(CALLBACKS.ADMIN_ALLOW_RIAL_PREFIX)) {
    return allowRialPaymentByAdmin(env, callbackQuery, data.slice(CALLBACKS.ADMIN_ALLOW_RIAL_PREFIX.length));
  }

  if (data.startsWith(CALLBACKS.ADMIN_CONFIRM_RECEIPT_PREFIX)) {
    return confirmReceiptByAdmin(env, callbackQuery, data.slice(CALLBACKS.ADMIN_CONFIRM_RECEIPT_PREFIX.length));
  }

  if (data.startsWith(CALLBACKS.ADMIN_REJECT_RECEIPT_PREFIX)) {
    return rejectReceiptByAdmin(env, callbackQuery, data.slice(CALLBACKS.ADMIN_REJECT_RECEIPT_PREFIX.length));
  }

  if (data === CALLBACKS.ADMIN_PANEL) {
    await showAdminPanel(env, chatId, messageId);
    await answerCallbackQuery(env, callbackQuery.id);
    return { action: "admin_panel" };
  }
  if (data === CALLBACKS.ADMIN_USERS) {
    await showAdminUsers(env, chatId, messageId);
    await answerCallbackQuery(env, callbackQuery.id);
    return { action: "admin_users" };
  }
  if (data.startsWith(CALLBACKS.ADMIN_USER_PREFIX)) {
    await showAdminUserProfile(env, chatId, messageId, data.slice(CALLBACKS.ADMIN_USER_PREFIX.length));
    await answerCallbackQuery(env, callbackQuery.id);
    return { action: "admin_user_profile" };
  }
  if (data.startsWith(CALLBACKS.ADMIN_MESSAGE_USER_PREFIX)) {
    const targetUserId = data.slice(CALLBACKS.ADMIN_MESSAGE_USER_PREFIX.length);
    await setState(env, chatId, { step: "adminMessageUser", targetUserId, startedAt: nowIso() });
    await answerCallbackQuery(env, callbackQuery.id, "پیام خود را ارسال کنید");
    await sendMessage(env, chatId, "پیام خود را برای این کاربر بنویسید.");
    return { action: "admin_message_user_waiting" };
  }
  if (data.startsWith(CALLBACKS.ADMIN_TOGGLE_RIAL_PREFIX) || data.startsWith(CALLBACKS.ADMIN_TOGGLE_CRYPTO_PREFIX) || data.startsWith(CALLBACKS.ADMIN_TOGGLE_STARS_PREFIX)) {
    const prefix = data.startsWith(CALLBACKS.ADMIN_TOGGLE_RIAL_PREFIX)
      ? CALLBACKS.ADMIN_TOGGLE_RIAL_PREFIX
      : data.startsWith(CALLBACKS.ADMIN_TOGGLE_CRYPTO_PREFIX)
        ? CALLBACKS.ADMIN_TOGGLE_CRYPTO_PREFIX
        : CALLBACKS.ADMIN_TOGGLE_STARS_PREFIX;
    const userId = data.slice(prefix.length);
    const profile = (await getUserProfile(env, userId)) || { userId, chatId: userId };
    if (prefix === CALLBACKS.ADMIN_TOGGLE_RIAL_PREFIX) profile.rialPaymentAllowed = !(profile.rialPaymentAllowed === true);
    if (prefix === CALLBACKS.ADMIN_TOGGLE_CRYPTO_PREFIX) profile.cryptoPaymentEnabled = !(profile.cryptoPaymentEnabled !== false);
    if (prefix === CALLBACKS.ADMIN_TOGGLE_STARS_PREFIX) profile.starsPaymentEnabled = !(profile.starsPaymentEnabled !== false);
    profile.updatedAt = nowIso();
    await updateUserProfile(env, profile);
    await showAdminUserProfile(env, chatId, messageId, userId);
    await answerCallbackQuery(env, callbackQuery.id, "بروزرسانی شد");
    return { action: "admin_user_toggle_payment" };
  }
  if (data.startsWith(CALLBACKS.ADMIN_SET_USER_PRICE_PREFIX)) {
    const targetUserId = data.slice(CALLBACKS.ADMIN_SET_USER_PRICE_PREFIX.length);
    await setState(env, chatId, { step: "adminSetUserPrice", targetUserId, startedAt: nowIso() });
    await answerCallbackQuery(env, callbackQuery.id);
    await sendMessage(
      env,
      chatId,
      "قیمت اختصاصی را با فرمت زیر بفرست:\n\ntoman=8500000\ncrypto=60\nstars=4000\n\nمی‌توانی فقط یکی یا چندتا را بفرستی.",
    );
    return { action: "admin_set_user_price_waiting" };
  }
  if (data.startsWith(CALLBACKS.ADMIN_USER_REQUESTS_PREFIX)) {
    const userId = data.slice(CALLBACKS.ADMIN_USER_REQUESTS_PREFIX.length);
    const requests = await getUserRequests(env, userId);
    const buttons = requests.map((request) => [{ text: `${request.status} - ${request.phone || request.fullName || request.id}`, callback_data: `${CALLBACKS.ADMIN_REQUEST_PREFIX}${request.id}` }]);
    buttons.push([{ text: "🔙 برگشت", callback_data: `${CALLBACKS.ADMIN_USER_PREFIX}${userId}` }]);
    await editMessageHtml(env, chatId, messageId, "📄 <b>درخواست‌های کاربر</b>", { inline_keyboard: buttons });
    await answerCallbackQuery(env, callbackQuery.id);
    return { action: "admin_user_requests" };
  }
  if (data === CALLBACKS.ADMIN_REQUESTS) {
    await showAdminRequests(env, chatId, messageId, "all");
    await answerCallbackQuery(env, callbackQuery.id);
    return { action: "admin_requests" };
  }
  if (data === CALLBACKS.ADMIN_WAITING) {
    await showAdminRequests(env, chatId, messageId, "waiting");
    await answerCallbackQuery(env, callbackQuery.id);
    return { action: "admin_waiting" };
  }
  if (data === CALLBACKS.ADMIN_PAID) {
    await showAdminRequests(env, chatId, messageId, "paid");
    await answerCallbackQuery(env, callbackQuery.id);
    return { action: "admin_paid" };
  }
  if (data.startsWith(CALLBACKS.ADMIN_REQUEST_PREFIX)) {
    await showAdminRequestDetails(env, chatId, messageId, data.slice(CALLBACKS.ADMIN_REQUEST_PREFIX.length));
    await answerCallbackQuery(env, callbackQuery.id);
    return { action: "admin_request_details" };
  }
  if (data === CALLBACKS.ADMIN_PRICING) {
    await showAdminPricing(env, chatId, messageId);
    await answerCallbackQuery(env, callbackQuery.id);
    return { action: "admin_pricing" };
  }
  if (data === CALLBACKS.ADMIN_SET_GLOBAL_TOMAN || data === CALLBACKS.ADMIN_SET_GLOBAL_CRYPTO || data === CALLBACKS.ADMIN_SET_GLOBAL_STARS) {
    const step =
      data === CALLBACKS.ADMIN_SET_GLOBAL_TOMAN ? "adminSetGlobalToman" : data === CALLBACKS.ADMIN_SET_GLOBAL_CRYPTO ? "adminSetGlobalCrypto" : "adminSetGlobalStars";
    await setState(env, chatId, { step, startedAt: nowIso() });
    await answerCallbackQuery(env, callbackQuery.id);
    await sendMessage(env, chatId, "مقدار جدید را ارسال کنید.");
    return { action: "admin_set_global_waiting" };
  }
  if (data === CALLBACKS.ADMIN_TOGGLE_GLOBAL_RIAL || data === CALLBACKS.ADMIN_TOGGLE_GLOBAL_CRYPTO || data === CALLBACKS.ADMIN_TOGGLE_GLOBAL_STARS) {
    const settings = await getAdminSettings(env);
    if (data === CALLBACKS.ADMIN_TOGGLE_GLOBAL_RIAL) settings.rialPaymentGlobalEnabled = !settings.rialPaymentGlobalEnabled;
    if (data === CALLBACKS.ADMIN_TOGGLE_GLOBAL_CRYPTO) settings.cryptoPaymentGlobalEnabled = !settings.cryptoPaymentGlobalEnabled;
    if (data === CALLBACKS.ADMIN_TOGGLE_GLOBAL_STARS) settings.starsPaymentGlobalEnabled = !settings.starsPaymentGlobalEnabled;
    await updateAdminSettings(env, settings);
    await showAdminPricing(env, chatId, messageId);
    await answerCallbackQuery(env, callbackQuery.id, "تنظیم شد");
    return { action: "admin_toggle_global_payment" };
  }
  if (data === CALLBACKS.ADMIN_RULES) {
    const settings = await getAdminSettings(env);
    await editMessageHtml(env, chatId, messageId, `📌 <b>متن فعلی قوانین</b>\n\n${escapeHtml(settings.rulesText)}`, {
      inline_keyboard: [
        [{ text: "✏️ تغییر متن قوانین", callback_data: "admin_set_rules" }],
        [{ text: "🔙 برگشت", callback_data: CALLBACKS.ADMIN_PANEL }],
      ],
    });
    await answerCallbackQuery(env, callbackQuery.id);
    return { action: "admin_rules" };
  }
  if (data === "admin_set_rules") {
    await setState(env, chatId, { step: "adminSetRules", startedAt: nowIso() });
    await answerCallbackQuery(env, callbackQuery.id);
    await sendMessage(env, chatId, "متن جدید قوانین را ارسال کنید.");
    return { action: "admin_set_rules_waiting" };
  }
  if (data === CALLBACKS.ADMIN_BROADCAST) {
    await setState(env, chatId, { step: "adminBroadcast", startedAt: nowIso() });
    await answerCallbackQuery(env, callbackQuery.id);
    await sendMessage(env, chatId, "پیام همگانی را ارسال کنید. این پیام برای همه کاربران ثبت‌شده ارسال می‌شود.");
    return { action: "admin_broadcast_waiting" };
  }

  if (data.startsWith(CALLBACKS.PAY_CRYPTO_PREFIX)) {
    return handleCryptoPaymentSelection(env, callbackQuery, data.slice(CALLBACKS.PAY_CRYPTO_PREFIX.length));
  }

  if (data.startsWith(CALLBACKS.PAY_STARS_PREFIX)) {
    return handleStarsPaymentSelection(env, callbackQuery, data.slice(CALLBACKS.PAY_STARS_PREFIX.length));
  }

  if (data.startsWith(CALLBACKS.PAY_RIAL_PREFIX)) {
    return handleRialPaymentSelection(env, callbackQuery, data.slice(CALLBACKS.PAY_RIAL_PREFIX.length));
  }

  if (data.startsWith(CALLBACKS.PAYMENT_CANCEL_PREFIX)) {
    return cancelPaymentByUser(env, callbackQuery, data.slice(CALLBACKS.PAYMENT_CANCEL_PREFIX.length));
  }

  await answerCallbackQuery(env, callbackQuery.id);
  return { action: "callback_unknown" };
}

async function handleMessage(env, message) {
  const chatId = message.chat.id;
  try {
    await upsertUserProfileFromTelegramUser(env, message.from, chatId);
  } catch (error) {
    console.log("Failed to upsert user profile", error?.message || error);
  }
  const text = (message.text || "").trim();
  const command = normalizeCommand(text);
  const adminChatId = String(env.ADMIN_CHAT_ID || env.BOT_OWNER || "");

  if (adminChatId && String(chatId) === adminChatId && message.reply_to_message?.message_id) {
    const repliedId = message.reply_to_message.message_id;
    const map = await getSupportReplyMap(env, repliedId);
    if (map?.userChatId) {
      const outgoingDoc = getIncomingDocument(message);
      if (text) {
        await sendMessage(env, map.userChatId, `☎️ پاسخ پشتیبانی:\n\n${text}`);
      } else if (outgoingDoc?.type === "photo") {
        await telegramApi(env, "sendPhoto", {
          chat_id: map.userChatId,
          photo: outgoingDoc.fileId,
          caption: "☎️ پاسخ پشتیبانی",
        });
      } else if (outgoingDoc?.type === "document") {
        await telegramApi(env, "sendDocument", {
          chat_id: map.userChatId,
          document: outgoingDoc.fileId,
          caption: "☎️ پاسخ پشتیبانی",
        });
      } else {
        await sendMessage(env, chatId, "⚠️ نوع پیام برای ارسال پاسخ پشتیبانی پشتیبانی نمی‌شود.");
        return { action: "support_admin_reply_unsupported" };
      }

      await sendMessage(env, chatId, "✅ پاسخ برای کاربر ارسال شد.");
      return { action: "support_admin_reply_sent" };
    }
  }

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

  if (command === "/admin") {
    if (!isBotOwner(env, message.from?.id || chatId)) {
      await sendMessage(env, chatId, "⛔ شما دسترسی ادمین ندارید.");
      return { action: "admin_denied" };
    }
    await showAdminPanel(env, chatId);
    return { action: "admin_panel_opened" };
  }

  const state = await getState(env, chatId);
  if (state && isBotOwner(env, message.from?.id || chatId)) {
    if (state.step === "adminMessageUser") {
      const profile = await getUserProfile(env, state.targetUserId);
      if (!profile?.chatId) {
        await clearState(env, chatId);
        await sendMessage(env, chatId, "کاربر پیدا نشد.");
        return { action: "admin_message_user_missing" };
      }
      const outgoingDoc = getIncomingDocument(message);
      if (text) await sendMessage(env, profile.chatId, `✉️ پیام مدیریت:\n\n${text}`);
      else if (outgoingDoc?.type === "photo") await telegramApi(env, "sendPhoto", { chat_id: profile.chatId, photo: outgoingDoc.fileId, caption: "✉️ پیام مدیریت" });
      else if (outgoingDoc?.type === "document") await telegramApi(env, "sendDocument", { chat_id: profile.chatId, document: outgoingDoc.fileId, caption: "✉️ پیام مدیریت" });
      await clearState(env, chatId);
      await sendMessage(env, chatId, "✅ پیام ارسال شد.");
      return { action: "admin_message_user_sent" };
    }
    if (state.step === "adminSetUserPrice") {
      const lines = text.split("\n").map((line) => line.trim());
      const profile = (await getUserProfile(env, state.targetUserId)) || { userId: state.targetUserId, chatId: state.targetUserId };
      for (const line of lines) {
        const [key, value] = line.split("=").map((s) => s?.trim());
        if (!value) continue;
        if (key === "toman") profile.customActivationPrice = value;
        if (key === "crypto") profile.customCryptoAmount = value;
        if (key === "stars") profile.customStarsAmount = value;
      }
      profile.updatedAt = nowIso();
      await updateUserProfile(env, profile);
      await clearState(env, chatId);
      await sendMessage(env, chatId, await formatUserProfileText(env, state.targetUserId), userProfileKeyboard(state.targetUserId), { parse_mode: "HTML" });
      return { action: "admin_user_price_updated" };
    }
    if (state.step === "adminSetGlobalToman" || state.step === "adminSetGlobalCrypto" || state.step === "adminSetGlobalStars") {
      if (state.step === "adminSetGlobalToman") await updateAdminSettings(env, { activationPrice: text });
      if (state.step === "adminSetGlobalCrypto") await updateAdminSettings(env, { cryptoAmount: text });
      if (state.step === "adminSetGlobalStars") await updateAdminSettings(env, { starsAmount: Number(toEnglishDigits(text).replace(/\D/g, "")) || text });
      await clearState(env, chatId);
      await sendMessage(env, chatId, "✅ تنظیمات بروزرسانی شد.");
      return { action: "admin_global_price_updated" };
    }
    if (state.step === "adminSetRules") {
      await updateAdminSettings(env, { rulesText: text || getDefaultRulesText() });
      await clearState(env, chatId);
      await sendMessage(env, chatId, "✅ متن شرایط و قوانین بروزرسانی شد.");
      return { action: "admin_rules_updated" };
    }
    if (state.step === "adminBroadcast") {
      const profiles = await getAllUserProfiles(env, 1000);
      let ok = 0;
      let fail = 0;
      for (const profile of profiles) {
        try {
          if (!text) {
            fail += 1;
            continue;
          }
          await sendMessage(env, profile.chatId, text);
          ok += 1;
        } catch {
          fail += 1;
        }
      }
      await clearState(env, chatId);
      await sendMessage(env, chatId, `نتیجه ارسال همگانی:\nموفق: ${ok}\nناموفق: ${fail}`);
      return { action: "admin_broadcast_sent" };
    }
  }

  if (state) {
    await handleRegistrationStep(env, message, state);
    return { action: `registration_${state.step}` };
  }

  if (text === BUTTONS.REGISTER) {
    try {
      await beginRegistration(env, chatId, message.from?.id || chatId);
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
    await setState(env, chatId, { step: "supportChat", startedAt: nowIso() });
    await sendMessage(
      env,
      chatId,
      "☎️ <b>پشتیبانی فعال شد.</b>\n\nپیام خود را همینجا بنویسید. تا وقتی دکمه «✅ اتمام چت» را نزنید، پیام‌های شما برای پشتیبانی ارسال می‌شود.",
      supportKeyboard(),
      { parse_mode: "HTML" },
    );
    return { action: "support_chat_started" };
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
      if (update?.pre_checkout_query) {
        const result = await handlePreCheckoutQuery(env, update.pre_checkout_query);
        return json({ ok: true, ...result });
      }

      if (update?.callback_query) {
        const result = await handleCallbackQuery(env, update.callback_query);
        return json({ ok: true, ...result });
      }

      const message = update?.message;
      if (!message?.chat?.id) return json({ ok: true, ignored: true, reason: "No message chat id in update" });

      if (message.successful_payment) {
        const result = await handleSuccessfulPayment(env, message);
        return json({ ok: true, ...result });
      }

      const result = await handleMessage(env, message);
      return json({ ok: true, ...result });
    } catch (error) {
      return json({ ok: false, error: "Failed to handle Telegram update", detail: error?.message || "Unknown error" }, 500);
    }
  },
};
