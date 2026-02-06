import crypto from "crypto";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_SESSION_COOKIE = "admin_session";
const ADMIN_SESSION_TTL_MS = 30 * 60 * 1000;
const adminSessions = new Map();
const users = new Map();
const SETTINGS_FILE = path.join(__dirname, "data", "site-settings.json");
const defaultSiteSettings = {
  layout: {
    pageMaxWidth: 1120,
    ttsMaxWidth: 1200,
    homeGridMaxWidth: 1100,
    gn: 90,
  },
  colors: {
    bg: "#0b0c0f",
    bgAlt: "#111216",
    surface: "#14151a",
    panel: "#101115",
    primary: "#8f92ff",
    headerBg: "rgba(9, 10, 12, 0.92)",
  },
  buttons: {
    baseFontSize: 0.95,
    basePaddingY: 12,
    basePaddingX: 18,
    ctaFontSize: 1,
    ctaPaddingY: 14,
    ctaPaddingX: 24,
  },
  stickers: {
    homeTextToSpeech: "",
    homeVoices: "",
    homeAbout: "",
    ttsHeader: "",
    aboutHero: "",
  },
  layoutEditor: {
    pages: {},
  },
};

const USER_STARTING_CREDITS = 500;
const USER_INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

app.use(express.json({ limit: "6mb" }));

const clampNumber = (value, min, max, fallback) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
};

const sanitizeString = (value, fallback) =>
  typeof value === "string" && value.trim().length ? value.trim() : fallback;

const sanitizeSticker = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (!trimmed.startsWith("data:image/")) {
    return fallback;
  }
  if (trimmed.length > 200000) {
    return fallback;
  }
  return trimmed;
};

const sanitizeSettings = (raw) => {
  const layout = raw?.layout ?? {};
  const colors = raw?.colors ?? {};
  const buttons = raw?.buttons ?? {};
  const stickers = raw?.stickers ?? {};
  const layoutEditor = raw?.layoutEditor ?? {};

  const sanitizeElement = (element = {}) => {
    const x = clampNumber(element.x, -320, 320, 0);
    const y = clampNumber(element.y, -320, 320, 0);
    const width =
      Number.isFinite(element.width) && element.width > 0
        ? clampNumber(element.width, 24, 1400, null)
        : null;
    const height =
      Number.isFinite(element.height) && element.height > 0
        ? clampNumber(element.height, 24, 1400, null)
        : null;
    return { x, y, width, height };
  };

  const sanitizeLayoutEditor = (rawEditor = {}) => {
    const pages = rawEditor?.pages ?? {};
    const cleanedPages = {};
    Object.entries(pages).forEach(([pageKey, pageData]) => {
      if (typeof pageKey !== "string") {
        return;
      }
      const canvas = pageData?.canvas ?? {};
      const elements = pageData?.elements ?? {};
      const frame = pageData?.frame ?? {};
      const cleanedElements = {};
      Object.entries(elements).forEach(([elementId, elementValue]) => {
        if (typeof elementId !== "string") {
          return;
        }
        cleanedElements[elementId] = sanitizeElement(elementValue);
      });
      cleanedPages[pageKey] = {
        canvas: {
          scale: clampNumber(canvas.scale, 0.6, 1.4, 1),
          offsetX: clampNumber(canvas.offsetX, -200, 200, 0),
          offsetY: clampNumber(canvas.offsetY, -200, 200, 0),
        },
        elements: cleanedElements,
        frame: {
          width: clampNumber(frame.width, 320, 1600, 390),
          height: clampNumber(frame.height, 420, 1200, 844),
        },
      };
    });
    return { pages: cleanedPages };
  };

  return {
    layout: {
      pageMaxWidth: clampNumber(layout.pageMaxWidth, 720, 1600, defaultSiteSettings.layout.pageMaxWidth),
      ttsMaxWidth: clampNumber(layout.ttsMaxWidth, 720, 1600, defaultSiteSettings.layout.ttsMaxWidth),
      homeGridMaxWidth: clampNumber(
        layout.homeGridMaxWidth,
        720,
        1600,
        defaultSiteSettings.layout.homeGridMaxWidth
      ),
      gn: defaultSiteSettings.layout.gn,
    },
    colors: {
      bg: sanitizeString(colors.bg, defaultSiteSettings.colors.bg),
      bgAlt: sanitizeString(colors.bgAlt, defaultSiteSettings.colors.bgAlt),
      surface: sanitizeString(colors.surface, defaultSiteSettings.colors.surface),
      panel: sanitizeString(colors.panel, defaultSiteSettings.colors.panel),
      primary: sanitizeString(colors.primary, defaultSiteSettings.colors.primary),
      headerBg: sanitizeString(colors.headerBg, defaultSiteSettings.colors.headerBg),
    },
    buttons: {
      baseFontSize: clampNumber(
        buttons.baseFontSize,
        0.7,
        1.4,
        defaultSiteSettings.buttons.baseFontSize
      ),
      basePaddingY: clampNumber(buttons.basePaddingY, 6, 24, defaultSiteSettings.buttons.basePaddingY),
      basePaddingX: clampNumber(buttons.basePaddingX, 10, 36, defaultSiteSettings.buttons.basePaddingX),
      ctaFontSize: clampNumber(buttons.ctaFontSize, 0.7, 1.5, defaultSiteSettings.buttons.ctaFontSize),
      ctaPaddingY: clampNumber(buttons.ctaPaddingY, 8, 32, defaultSiteSettings.buttons.ctaPaddingY),
      ctaPaddingX: clampNumber(buttons.ctaPaddingX, 12, 48, defaultSiteSettings.buttons.ctaPaddingX),
    },
    stickers: {
      homeTextToSpeech: sanitizeSticker(stickers.homeTextToSpeech, defaultSiteSettings.stickers.homeTextToSpeech),
      homeVoices: sanitizeSticker(stickers.homeVoices, defaultSiteSettings.stickers.homeVoices),
      homeAbout: sanitizeSticker(stickers.homeAbout, defaultSiteSettings.stickers.homeAbout),
      ttsHeader: sanitizeSticker(stickers.ttsHeader, defaultSiteSettings.stickers.ttsHeader),
      aboutHero: sanitizeSticker(stickers.aboutHero, defaultSiteSettings.stickers.aboutHero),
    },
    layoutEditor: sanitizeLayoutEditor(layoutEditor),
  };
};

const loadSiteSettings = () => {
  try {
    const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
    return sanitizeSettings(JSON.parse(data));
  } catch (error) {
    return { ...defaultSiteSettings };
  }
};

const saveSiteSettings = (settings) => {
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
};

let siteSettings = loadSiteSettings();

const parseCookies = (cookieHeader = "") =>
  cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((accumulator, cookie) => {
      const [name, ...rest] = cookie.split("=");
      accumulator[name] = decodeURIComponent(rest.join("="));
      return accumulator;
    }, {});

const getAdminSession = (req) => {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies[ADMIN_SESSION_COOKIE];
  if (!sessionId) {
    return null;
  }
  const session = adminSessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    adminSessions.delete(sessionId);
    return null;
  }
  session.expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  adminSessions.set(sessionId, session);
  return session;
};

const adminAuth = (req, res, next) => {
  const session = getAdminSession(req);
  if (!session) {
    if (req.originalUrl.startsWith("/api/")) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    return res.redirect("/adminmain");
  }
  return next();
};

const voiceMap = {
  Rachel: "21m00Tcm4TlvDq8ikWAM",
  Maya: "AZnzlk1XvdvUeBnXmlld",
  Arman: "ErXwobaYiN019PkySvjV",
  Noah: "MF3mGyEYCl7XYWbV9V6O",
};
const LIVE_TRANSLATE_VOICE_ID = "TX3LPaxmHKxFdv7VOQHJ";

const getOrCreateUser = (userId) => {
  if (!userId) {
    return null;
  }
  // In-memory storage for simplicity; replace with a database for production.
  let user = users.get(userId);
  if (!user) {
    user = {
      id: userId,
      credits: USER_STARTING_CREDITS,
      startingCredits: USER_STARTING_CREDITS,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      online: true,
    };
    users.set(userId, user);
  }
  return user;
};

const touchUser = (user) => {
  if (!user) {
    return;
  }
  user.lastActivityAt = Date.now();
  user.online = true;
  users.set(user.id, user);
};

app.post("/tts", async (req, res) => {
  try {
    const { text, voice, userId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required." });
    }

    const user = getOrCreateUser(userId);
    if (!user) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const creditCost = text.trim().length;
    if (user.credits < creditCost) {
      return res.status(402).json({ error: "Not enough credits remaining." });
    }

    const voiceId = voiceMap[voice] || voiceMap.Rachel;
    const apiKey = process.env.ELEVEN_API;

    if (!apiKey) {
      return res.status(500).json({ error: "Server API key is missing." });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_v3",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: errorText || "TTS failed." });
    }

    res.setHeader("Content-Type", "audio/mpeg");

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    user.credits -= creditCost;
    touchUser(user);
    res.setHeader("X-User-Credits", user.credits);
    res.setHeader("X-User-Starting-Credits", user.startingCredits);
    return res.send(audioBuffer);
  } catch (error) {
    return res.status(500).json({ error: "Unexpected server error." });
  }
});

app.post("/api/users/init", (req, res) => {
  const { userId } = req.body;
  const user = getOrCreateUser(userId);
  if (!user) {
    return res.status(400).json({ error: "User ID is required." });
  }
  touchUser(user);
  return res.json({
    id: user.id,
    credits: user.credits,
    startingCredits: user.startingCredits,
    lastActivityAt: user.lastActivityAt,
  });
});

app.post("/api/users/heartbeat", (req, res) => {
  const { userId } = req.body;
  const user = getOrCreateUser(userId);
  if (!user) {
    return res.status(400).json({ error: "User ID is required." });
  }
  touchUser(user);
  return res.json({ success: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GPT_API;
    if (!apiKey) {
      return res.status(500).json({ error: "Server API key is missing." });
    }

    const { message, history = [] } = req.body || {};
    const userMessage = typeof message === "string" ? message.trim() : "";
    if (!userMessage) {
      return res.status(400).json({ error: "Message is required." });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .slice(-10)
          .map((item) => ({
            role: item?.role === "user" ? "user" : "assistant",
            content: typeof item?.content === "string" ? item.content.slice(0, 800) : "",
          }))
          .filter((item) => item.content)
      : [];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Vexa, a stylish assistant for audio creators. Be concise, creative, and helpful. Reply in the same language as the user.",
          },
          ...safeHistory,
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: errorText || "Chat request failed." });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    return res.json({ message: reply || "No response received." });
  } catch (error) {
    return res.status(500).json({ error: "Unexpected server error." });
  }
});

app.post("/api/live-translate", async (req, res) => {
  try {
    const apiKey = process.env.GPT_API;
    if (!apiKey) {
      return res.status(500).json({ error: "Server API key is missing." });
    }

    const { audioBase64, sourceLabel, targetLabel } = req.body || {};
    if (typeof audioBase64 !== "string" || !audioBase64.startsWith("data:audio/")) {
      return res.status(400).json({ error: "Audio payload is required." });
    }

    const base64Data = audioBase64.split(",")[1];
    if (!base64Data) {
      return res.status(400).json({ error: "Audio payload is required." });
    }

    const audioBuffer = Buffer.from(base64Data, "base64");
    const transcriptResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: (() => {
        const form = new FormData();
        const safeFilename = `capture-${Date.now()}.wav`;
        form.append("file", new Blob([audioBuffer], { type: "audio/wav" }), safeFilename);
        form.append("model", "gpt-4o-mini-transcribe");
        return form;
      })(),
    });

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      return res.status(500).json({ error: errorText || "Transcription failed." });
    }

    const transcriptData = await transcriptResponse.json();
    const transcript = transcriptData?.text?.trim();
    if (!transcript) {
      return res.status(200).json({ transcript: "", translation: "" });
    }

    const targetHint = typeof targetLabel === "string" && targetLabel.trim().length ? targetLabel.trim() : "the target language";
    const sourceHint = typeof sourceLabel === "string" && sourceLabel.trim().length ? sourceLabel.trim() : "the source language";

    const translateResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You translate live speech from ${sourceHint} to ${targetHint}. Reply only with the translated text and nothing else.`,
          },
          {
            role: "user",
            content: transcript,
          },
        ],
        temperature: 0.2,
        max_tokens: 400,
      }),
    });

    if (!translateResponse.ok) {
      const errorText = await translateResponse.text();
      return res.status(500).json({ error: errorText || "Translation failed." });
    }

    const translateData = await translateResponse.json();
    const translation = translateData?.choices?.[0]?.message?.content?.trim() || "";
    if (!translation) {
      return res.json({ transcript, translation, audioBase64: "" });
    }

    const elevenApiKey = process.env.ELEVEN_API;
    if (!elevenApiKey) {
      return res.status(500).json({ error: "Server API key is missing." });
    }

    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${LIVE_TRANSLATE_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": elevenApiKey,
        },
        body: JSON.stringify({
          text: translation,
          model_id: "eleven_v3",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.7,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      return res.status(500).json({ error: errorText || "TTS failed." });
    }

    const ttsBuffer = Buffer.from(await ttsResponse.arrayBuffer());
    const ttsAudioBase64 = `data:audio/mpeg;base64,${ttsBuffer.toString("base64")}`;
    return res.json({ transcript, translation, audioBase64: ttsAudioBase64 });
  } catch (error) {
    return res.status(500).json({ error: "Unexpected server error." });
  }
});

app.post("/api/admin/login", (req, res) => {
  const { key } = req.body;
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    return res.status(500).json({ error: "Admin access is not configured." });
  }

  if (!key || key !== adminKey) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const sessionId = crypto.randomUUID();
  adminSessions.set(sessionId, { createdAt: Date.now(), expiresAt: Date.now() + ADMIN_SESSION_TTL_MS });

  const cookieParts = [
    `${ADMIN_SESSION_COOKIE}=${sessionId}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
  ];

  if (process.env.NODE_ENV === "production") {
    cookieParts.push("Secure");
  }

  res.setHeader("Set-Cookie", cookieParts.join("; "));
  return res.json({ success: true });
});

app.get("/api/site-settings", (req, res) => {
  res.json(siteSettings);
});

app.get("/api/admin/site-settings", adminAuth, (req, res) => {
  res.json(siteSettings);
});

app.put("/api/admin/site-settings", adminAuth, (req, res) => {
  const incoming = req.body || {};
  const merged = {
    layout: { ...siteSettings.layout, ...(incoming.layout || {}) },
    colors: { ...siteSettings.colors, ...(incoming.colors || {}) },
    buttons: { ...siteSettings.buttons, ...(incoming.buttons || {}) },
    stickers: { ...siteSettings.stickers, ...(incoming.stickers || {}) },
    layoutEditor: { ...siteSettings.layoutEditor, ...(incoming.layoutEditor || {}) },
  };
  siteSettings = sanitizeSettings(merged);
  saveSiteSettings(siteSettings);
  res.json(siteSettings);
});

app.post("/api/admin/site-settings/reset", adminAuth, (req, res) => {
  siteSettings = { ...defaultSiteSettings };
  saveSiteSettings(siteSettings);
  res.json(siteSettings);
});

app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

app.get("/adminmain", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "adminmain.html"));
});

app.get("/api/admin/summary", adminAuth, (req, res) => {
  res.json({ totalUsers: users.size });
});

app.get("/api/admin/users", adminAuth, (req, res) => {
  const search = (req.query.search || "").toString().trim();
  const list = Array.from(users.values())
    .filter((user) => (search ? user.id.includes(search) : true))
    .map((user) => ({
      id: user.id,
      credits: user.credits,
      online: user.online,
      lastActivityAt: user.lastActivityAt,
    }))
    .sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  res.json({ users: list });
});

app.patch("/api/admin/users/:id/credits", adminAuth, (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  const { delta, credits } = req.body;
  if (typeof credits === "number") {
    user.credits = Math.max(0, Math.floor(credits));
  } else if (typeof delta === "number") {
    user.credits = Math.max(0, user.credits + Math.floor(delta));
  } else {
    return res.status(400).json({ error: "A delta or credits value is required." });
  }
  touchUser(user);
  return res.json({ id: user.id, credits: user.credits });
});

app.use("/admin", adminAuth, express.static(path.join(__dirname, "public", "admin")));

app.use(express.static(path.join(__dirname, "public")));

setInterval(() => {
  const now = Date.now();
  users.forEach((user) => {
    if (user.online && now - user.lastActivityAt > USER_INACTIVITY_TIMEOUT_MS) {
      user.online = false;
      users.set(user.id, user);
    }
  });
}, 60 * 1000);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
