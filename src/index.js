const BUTTONS = {
  REGISTER: "✅ ثبت درخواست جدید",
  STATUS: "📄 وضعیت درخواست من",
  SUPPORT: "☎️ پشتیبانی",
  RULES: "📌 شرایط و قوانین",
  CANCEL: "لغو",
  FINISH_DOCS: "اتمام مدارک",
  CONFIRM: "تأیید و ثبت",
};

const CATEGORIES = [
  ["کارمند شرکت", "پیمانکار / فریلنسر"],
  ["پزشک / نظام پزشکی", "استاد / دانشگاه"],
  ["شرکت / کسب‌وکار", "سایر"],
];

const OPERATORS = [["همراه اول", "ایرانسل", "رایتل"]];
const MAX_DOCUMENTS = 8;
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

function keyboard(rows, oneTime = true) {
  return {
    keyboard: rows.map((row) => row.map((text) => ({ text }))),
    resize_keyboard: true,
    one_time_keyboard: oneTime,
  };
}

function removeKeyboard() {
  return { remove_keyboard: true };
}

function normalizeCommand(text) {
  const trimmed = (text || "").trim();
  if (!trimmed.startsWith("/")) return null;

  const [rawCommand] = trimmed.split(/\s+/, 1);
  const commandWithoutMention = rawCommand.split("@")[0];
  return commandWithoutMention.toLowerCase();
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

function getKv(env) {
  return env.BOT_KV || null;
}

function requireKv(env) {
  const kv = getKv(env);
  if (!kv) {
    throw new Error("BOT_KV binding is not configured");
  }
  return kv;
}

function stateKey(chatId) {
  return `state:${chatId}`;
}

function requestKey(requestId) {
  return `request:${requestId}`;
}

function userRequestsKey(userId) {
  return `user_requests:${userId}`;
}

async function getState(env, chatId) {
  const kv = getKv(env);
  if (!kv) return null;
  const raw = await kv.get(stateKey(chatId));
  return raw ? JSON.parse(raw) : null;
}

async function setState(env, chatId, state) {
  const kv = requireKv(env);
  await kv.put(stateKey(chatId), JSON.stringify(state), { expirationTtl: 60 * 60 * 24 });
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

async function sendMessage(env, chatId, text, replyMarkup = undefined) {
  return telegramApi(env, "sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: replyMarkup,
  });
}

async function sendMainMenu(env, chatId) {
  return sendMessage(
    env,
    chatId,
    "سلام 👋\nبه ProNetIRBot خوش آمدید.\n\nاز این ربات می‌توانید درخواست اینترنت پرو را ثبت و وضعیت پرونده را پیگیری کنید.\n\nبرای شروع یکی از گزینه‌های زیر را انتخاب کنید:",
    mainKeyboard(),
  );
}

async function sendRules(env, chatId) {
  return sendMessage(
    env,
    chatId,
    "📌 شرایط و قوانین\n\n" +
      "• اطلاعات واردشده باید واقعی و قابل احراز باشد.\n" +
      "• ثبت درخواست به معنی تضمین فعال‌سازی نیست.\n" +
      "• فعال‌سازی نهایی منوط به تأیید اپراتور و مراجع مربوطه است.\n" +
      "• هزینه احتمالی بابت ثبت، بررسی و پیگیری دریافت می‌شود، نه تضمین نتیجه.\n" +
      "• در صورت نقص یا مغایرت مدارک، درخواست رد می‌شود.",
  );
}

async function sendSupport(env, chatId) {
  const supportLine = env.SUPPORT_TEXT || "برای پیگیری، پیام خود را برای پشتیبانی ارسال کنید یا شماره پرونده را نگه دارید.";
  return sendMessage(env, chatId, `☎️ پشتیبانی\n\n${supportLine}`);
}

function requestSummary(data, documentsCount = 0) {
  return (
    "لطفاً اطلاعات زیر را بررسی کنید:\n\n" +
    `نام: ${data.fullName}\n` +
    `موبایل: ${data.phone}\n` +
    `کد ملی: ${data.nationalId}\n` +
    `نوع درخواست: ${data.category}\n` +
    `رابطه شغلی/سازمانی: ${data.relationDesc}\n` +
    `مجموعه: ${data.orgName}\n` +
    `شهر: ${data.city}\n` +
    `اپراتور: ${data.operator}\n` +
    `تعداد مدارک: ${documentsCount}\n\n` +
    "آیا تأیید می‌کنید؟"
  );
}

function adminSummary(request) {
  const username = request.username ? `@${request.username}` : "ندارد";
  return (
    "📥 درخواست جدید اینترنت پرو\n\n" +
    `شماره پرونده: ${request.id}\n` +
    `نام: ${request.fullName}\n` +
    `موبایل: ${request.phone}\n` +
    `کد ملی: ${request.nationalId}\n` +
    `نوع درخواست: ${request.category}\n` +
    `رابطه شغلی/سازمانی: ${request.relationDesc}\n` +
    `مجموعه: ${request.orgName}\n` +
    `شهر: ${request.city}\n` +
    `اپراتور: ${request.operator}\n` +
    `وضعیت: ${request.status}\n` +
    `یوزرنیم تلگرام: ${username}\n` +
    `آیدی کاربر: ${request.telegramUserId}\n` +
    `تعداد مدارک: ${request.documents.length}\n` +
    `تاریخ ثبت: ${request.createdAt}`
  );
}

async function notifyAdmin(env, request) {
  const adminChatId = env.ADMIN_CHAT_ID || env.BOT_OWNER;
  if (!adminChatId) return;

  await sendMessage(env, adminChatId, adminSummary(request));

  for (const doc of request.documents) {
    const caption = `مدرک پرونده ${request.id}`;
    if (doc.type === "photo") {
      await telegramApi(env, "sendPhoto", {
        chat_id: adminChatId,
        photo: doc.fileId,
        caption,
      });
    } else {
      await telegramApi(env, "sendDocument", {
        chat_id: adminChatId,
        document: doc.fileId,
        caption,
      });
    }
  }
}

async function beginRegistration(env, chatId) {
  requireKv(env);

  await setState(env, chatId, {
    step: "fullName",
    data: {},
    documents: [],
    startedAt: nowIso(),
  });

  return sendMessage(env, chatId, "لطفاً نام و نام خانوادگی متقاضی را وارد کنید:", removeKeyboard());
}

async function sendStatus(env, message) {
  const chatId = message.chat.id;
  const userId = message.from?.id || chatId;
  const requests = await getUserRequests(env, userId);

  if (!getKv(env)) {
    return sendMessage(env, chatId, "برای نمایش وضعیت درخواست‌ها، اتصال ذخیره‌سازی BOT_KV باید در Cloudflare فعال شود.");
  }

  if (!requests.length) {
    return sendMessage(env, chatId, "برای شما هنوز درخواستی ثبت نشده است.");
  }

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
    return {
      type: "photo",
      fileId: photo.file_id,
      fileUniqueId: photo.file_unique_id,
    };
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

async function handleRegistrationStep(env, message, state) {
  const chatId = message.chat.id;
  const text = (message.text || "").trim();

  if (text === BUTTONS.CANCEL || text === "/cancel") {
    await clearState(env, chatId);
    await sendMessage(env, chatId, "فرآیند ثبت درخواست لغو شد.", mainKeyboard());
    return;
  }

  switch (state.step) {
    case "fullName": {
      if (text.length < 3) {
        await sendMessage(env, chatId, "نام واردشده کوتاه است. لطفاً نام و نام خانوادگی را کامل وارد کنید:");
        return;
      }

      state.data.fullName = text;
      state.step = "phone";
      await setState(env, chatId, state);
      await sendMessage(env, chatId, "شماره موبایل متقاضی را وارد کنید. شماره باید به نام خود متقاضی باشد:");
      return;
    }

    case "phone": {
      const phone = cleanPhone(text);
      if (!isValidPhone(phone)) {
        await sendMessage(env, chatId, "شماره موبایل معتبر نیست. نمونه صحیح: 09123456789");
        return;
      }

      state.data.phone = phone;
      state.step = "nationalId";
      await setState(env, chatId, state);
      await sendMessage(env, chatId, "کد ملی ۱۰ رقمی متقاضی را وارد کنید:");
      return;
    }

    case "nationalId": {
      const nationalId = cleanNationalId(text);
      if (!isValidNationalId(nationalId)) {
        await sendMessage(env, chatId, "کد ملی باید ۱۰ رقم باشد. لطفاً دوباره وارد کنید:");
        return;
      }

      state.data.nationalId = nationalId;
      state.step = "category";
      await setState(env, chatId, state);
      await sendMessage(env, chatId, "نوع درخواست را انتخاب کنید:", keyboard(CATEGORIES));
      return;
    }

    case "category": {
      const flatCategories = CATEGORIES.flat();
      if (!flatCategories.includes(text)) {
        await sendMessage(env, chatId, "لطفاً نوع درخواست را از گزینه‌های زیر انتخاب کنید:", keyboard(CATEGORIES));
        return;
      }

      state.data.category = text;
      state.step = "relationDesc";
      await setState(env, chatId, state);
      await sendMessage(
        env,
        chatId,
        "رابطه شغلی یا سازمانی متقاضی را توضیح دهید.\nمثلاً: کارمند بخش فروش، پیمانکار تولید محتوا، پزشک عضو نظام پزشکی، استاد دانشگاه و ...",
        removeKeyboard(),
      );
      return;
    }

    case "relationDesc": {
      if (text.length < 5) {
        await sendMessage(env, chatId, "توضیح رابطه شغلی خیلی کوتاه است. لطفاً کمی کامل‌تر توضیح دهید:");
        return;
      }

      state.data.relationDesc = text;
      state.step = "orgName";
      await setState(env, chatId, state);
      await sendMessage(env, chatId, "نام شرکت، سازمان، دانشگاه، کلینیک یا مجموعه را وارد کنید:");
      return;
    }

    case "orgName": {
      if (text.length < 2) {
        await sendMessage(env, chatId, "نام مجموعه معتبر نیست. لطفاً دوباره وارد کنید:");
        return;
      }

      state.data.orgName = text;
      state.step = "city";
      await setState(env, chatId, state);
      await sendMessage(env, chatId, "شهر محل فعالیت را وارد کنید:");
      return;
    }

    case "city": {
      if (text.length < 2) {
        await sendMessage(env, chatId, "نام شهر معتبر نیست. لطفاً دوباره وارد کنید:");
        return;
      }

      state.data.city = text;
      state.step = "operator";
      await setState(env, chatId, state);
      await sendMessage(env, chatId, "اپراتور موردنظر را انتخاب کنید:", keyboard(OPERATORS));
      return;
    }

    case "operator": {
      const flatOperators = OPERATORS.flat();
      if (!flatOperators.includes(text)) {
        await sendMessage(env, chatId, "لطفاً اپراتور را از گزینه‌های زیر انتخاب کنید:", keyboard(OPERATORS));
        return;
      }

      state.data.operator = text;
      state.step = "documents";
      await setState(env, chatId, state);
      await sendMessage(
        env,
        chatId,
        "لطفاً مدارک را ارسال کنید.\n\n" +
          "مدارک پیشنهادی:\n" +
          "۱. تصویر کارت ملی\n" +
          "۲. مدرک شغلی / معرفی‌نامه / قرارداد / کارت نظام پزشکی / مدرک دانشگاهی\n\n" +
          `بعد از ارسال همه مدارک، روی «${BUTTONS.FINISH_DOCS}» بزنید یا کلمه «تمام» را بفرستید.`,
        keyboard([[BUTTONS.FINISH_DOCS], [BUTTONS.CANCEL]], false),
      );
      return;
    }

    case "documents": {
      if (text === BUTTONS.FINISH_DOCS || text === "تمام") {
        if (!state.documents.length) {
          await sendMessage(env, chatId, "حداقل یک مدرک باید ارسال شود.");
          return;
        }

        state.step = "confirm";
        await setState(env, chatId, state);
        await sendMessage(
          env,
          chatId,
          requestSummary(state.data, state.documents.length),
          keyboard([[BUTTONS.CONFIRM], [BUTTONS.CANCEL]]),
        );
        return;
      }

      const incomingDocument = getIncomingDocument(message);
      if (!incomingDocument) {
        await sendMessage(env, chatId, "لطفاً عکس یا فایل مدرک ارسال کنید، یا پس از اتمام روی «اتمام مدارک» بزنید.");
        return;
      }

      if (state.documents.length >= MAX_DOCUMENTS) {
        await sendMessage(env, chatId, `حداکثر ${MAX_DOCUMENTS} مدرک قابل ثبت است. برای ادامه روی «اتمام مدارک» بزنید.`);
        return;
      }

      state.documents.push(incomingDocument);
      await setState(env, chatId, state);
      await sendMessage(env, chatId, `مدرک دریافت شد. تعداد مدارک ثبت‌شده: ${state.documents.length}`);
      return;
    }

    case "confirm": {
      if (text !== BUTTONS.CONFIRM) {
        await sendMessage(env, chatId, "برای ثبت نهایی روی «تأیید و ثبت» بزنید یا «لغو» را انتخاب کنید.");
        return;
      }

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
        category: state.data.category,
        relationDesc: state.data.relationDesc,
        orgName: state.data.orgName,
        city: state.data.city,
        operator: state.data.operator,
        documents: state.documents,
        status: "در انتظار بررسی",
        createdAt: nowIso(),
      };

      await saveRequest(env, request);
      await clearState(env, chatId);
      await sendMessage(
        env,
        chatId,
        `✅ درخواست شما ثبت شد.\n\nشماره پرونده: ${request.id}\nوضعیت فعلی: در انتظار بررسی\n\nنتیجه پس از بررسی مدارک اطلاع‌رسانی می‌شود.`,
        mainKeyboard(),
      );
      await notifyAdmin(env, request);
      return;
    }

    default: {
      await clearState(env, chatId);
      await sendMainMenu(env, chatId);
    }
  }
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
    } catch (error) {
      await sendMessage(
        env,
        chatId,
        "برای فعال شدن فرم ثبت درخواست، ذخیره‌سازی BOT_KV باید در Cloudflare به Worker وصل شود.\n\nبعد از اتصال KV، همین گزینه را دوباره بزنید.",
      );
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

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return json({
        ok: true,
        service: "ProNetIRBot Telegram webhook is running",
        config: {
          hasBotToken: Boolean(env.BOT_TOKEN),
          hasBotOwner: Boolean(env.BOT_OWNER),
          hasAdminChatId: Boolean(env.ADMIN_CHAT_ID),
          hasBotKv: Boolean(env.BOT_KV),
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

    const message = update?.message;
    if (!message?.chat?.id) {
      return json({ ok: true, ignored: true });
    }

    try {
      const result = await handleMessage(env, message);
      return json({ ok: true, ...result });
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
