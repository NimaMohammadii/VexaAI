import crypto from "crypto";
import express from "express";
import fs from "fs/promises";
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
const themePreviewBySession = new Map();
const themeStreamClients = new Set();

const THEME_STORE_PATH = path.join(__dirname, "theme-store.json");
const THEME_VERSION_LIMIT = 25;

const DEFAULT_THEME = {
  colors: {
    background: "#0b0c0f",
    primary: "#8f92ff",
    secondary: "#2dd4bf",
    text: "#f4f4f6",
    muted: "#9b9da4",
  },
  typography: {
    fontFamily: "Inter",
    baseFontSize: 16,
    headingScale: 1,
  },
  layout: {
    pagePadding: 32,
    sectionSpacing: 60,
    containerWidth: 1120,
  },
  components: {
    buttonRadius: 999,
    cardRadius: 22,
    inputHeight: 48,
  },
  sections: {
    showHistory: true,
    showCredits: true,
    showMenu: true,
  },
};

const ALLOWED_FONTS = ["Inter", "Roboto", "Poppins", "Manrope", "Arial", "Vazirmatn"];

let themeStore = {
  versions: [],
  publishedVersionId: null,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const isHexColor = (value) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value || "");

const sanitizeTheme = (input, fallback = DEFAULT_THEME) => {
  const safe = JSON.parse(JSON.stringify(fallback));
  if (!input || typeof input !== "object") {
    return safe;
  }

  if (input.colors && typeof input.colors === "object") {
    Object.entries(safe.colors).forEach(([key, value]) => {
      const candidate = input.colors?.[key];
      safe.colors[key] = isHexColor(candidate) ? candidate : value;
    });
  }

  if (input.typography && typeof input.typography === "object") {
    const fontFamily = input.typography.fontFamily;
    safe.typography.fontFamily = ALLOWED_FONTS.includes(fontFamily) ? fontFamily : safe.typography.fontFamily;
    const baseFontSize = Number(input.typography.baseFontSize);
    if (Number.isFinite(baseFontSize)) {
      safe.typography.baseFontSize = clamp(Math.round(baseFontSize), 14, 20);
    }
    const headingScale = Number(input.typography.headingScale);
    if (Number.isFinite(headingScale)) {
      safe.typography.headingScale = clamp(Number(headingScale.toFixed(2)), 0.85, 1.3);
    }
  }

  if (input.layout && typeof input.layout === "object") {
    const pagePadding = Number(input.layout.pagePadding);
    if (Number.isFinite(pagePadding)) {
      safe.layout.pagePadding = clamp(Math.round(pagePadding), 16, 72);
    }
    const sectionSpacing = Number(input.layout.sectionSpacing);
    if (Number.isFinite(sectionSpacing)) {
      safe.layout.sectionSpacing = clamp(Math.round(sectionSpacing), 32, 120);
    }
    const containerWidth = Number(input.layout.containerWidth);
    if (Number.isFinite(containerWidth)) {
      safe.layout.containerWidth = clamp(Math.round(containerWidth), 900, 1400);
    }
  }

  if (input.components && typeof input.components === "object") {
    const buttonRadius = Number(input.components.buttonRadius);
    if (Number.isFinite(buttonRadius)) {
      safe.components.buttonRadius = clamp(Math.round(buttonRadius), 8, 999);
    }
    const cardRadius = Number(input.components.cardRadius);
    if (Number.isFinite(cardRadius)) {
      safe.components.cardRadius = clamp(Math.round(cardRadius), 8, 40);
    }
    const inputHeight = Number(input.components.inputHeight);
    if (Number.isFinite(inputHeight)) {
      safe.components.inputHeight = clamp(Math.round(inputHeight), 36, 64);
    }
  }

  if (input.sections && typeof input.sections === "object") {
    Object.keys(safe.sections).forEach((key) => {
      if (typeof input.sections[key] === "boolean") {
        safe.sections[key] = input.sections[key];
      }
    });
  }

  return safe;
};

const loadThemeStore = async () => {
  try {
    const raw = await fs.readFile(THEME_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid theme store");
    }
    const versions = Array.isArray(parsed.versions) ? parsed.versions : [];
    themeStore = {
      versions,
      publishedVersionId: parsed.publishedVersionId || null,
    };
    if (!themeStore.publishedVersionId && versions.length) {
      themeStore.publishedVersionId = versions[versions.length - 1].id;
    }
    if (!themeStore.publishedVersionId) {
      const version = createThemeVersion(DEFAULT_THEME, "Initial default");
      themeStore.versions = [version];
      themeStore.publishedVersionId = version.id;
      await persistThemeStore();
    }
  } catch (error) {
    const version = createThemeVersion(DEFAULT_THEME, "Initial default");
    themeStore = {
      versions: [version],
      publishedVersionId: version.id,
    };
    await persistThemeStore();
  }
};

const persistThemeStore = async () => {
  const payload = {
    versions: themeStore.versions.slice(-THEME_VERSION_LIMIT),
    publishedVersionId: themeStore.publishedVersionId,
  };
  themeStore.versions = payload.versions;
  await fs.writeFile(THEME_STORE_PATH, JSON.stringify(payload, null, 2));
};

const createThemeVersion = (theme, label = "Theme update") => ({
  id: crypto.randomUUID(),
  createdAt: Date.now(),
  label,
  theme: sanitizeTheme(theme),
});

const getPublishedTheme = () => {
  const version = themeStore.versions.find((item) => item.id === themeStore.publishedVersionId);
  return version || themeStore.versions[themeStore.versions.length - 1];
};

const USER_STARTING_CREDITS = 500;
const USER_INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

app.use(express.json({ limit: "1mb" }));

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

const getAdminSessionId = (req) => {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[ADMIN_SESSION_COOKIE] || null;
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

const broadcastThemeUpdate = ({ mode, theme, versionId, sessionId }) => {
  const payload = JSON.stringify({ theme, versionId, mode });
  themeStreamClients.forEach((client) => {
    if (client.mode !== mode) {
      return;
    }
    if (mode === "preview" && client.sessionId !== sessionId) {
      return;
    }
    try {
      client.res.write("event: theme\n");
      client.res.write(`data: ${payload}\n\n`);
    } catch (error) {
      client.res.end();
      themeStreamClients.delete(client);
    }
  });
};

const voiceMap = {
  Rachel: "21m00Tcm4TlvDq8ikWAM",
  Maya: "AZnzlk1XvdvUeBnXmlld",
  Arman: "ErXwobaYiN019PkySvjV",
  Noah: "MF3mGyEYCl7XYWbV9V6O",
};

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

app.post("/api/admin/login", (req, res) => {
  const { key } = req.body;
  const adminKey = process.env.ADMIN_SECRET;

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

app.get("/api/theme", (req, res) => {
  const wantsPreview = req.query.preview === "1";
  if (wantsPreview) {
    const session = getAdminSession(req);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const sessionId = getAdminSessionId(req);
    const previewTheme = sessionId ? themePreviewBySession.get(sessionId) : null;
    const published = getPublishedTheme();
    return res.json({
      theme: previewTheme || published.theme,
      versionId: previewTheme ? "preview" : published.id,
      mode: previewTheme ? "preview" : "published",
    });
  }

  const published = getPublishedTheme();
  return res.json({ theme: published.theme, versionId: published.id, mode: "published" });
});

app.get("/api/theme/stream", (req, res) => {
  const wantsPreview = req.query.preview === "1";
  if (wantsPreview) {
    const session = getAdminSession(req);
    if (!session) {
      return res.status(401).end();
    }
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sessionId = wantsPreview ? getAdminSessionId(req) : null;
  const previewTheme = sessionId ? themePreviewBySession.get(sessionId) : null;
  const published = getPublishedTheme();
  const initialTheme = wantsPreview && previewTheme ? previewTheme : published.theme;
  const initialPayload = JSON.stringify({
    theme: initialTheme,
    versionId: wantsPreview && previewTheme ? "preview" : published.id,
    mode: wantsPreview && previewTheme ? "preview" : "published",
  });
  res.write("event: theme\n");
  res.write(`data: ${initialPayload}\n\n`);

  const client = { res, mode: wantsPreview ? "preview" : "published", sessionId };
  themeStreamClients.add(client);

  req.on("close", () => {
    themeStreamClients.delete(client);
  });
});

app.get("/api/admin/theme/current", adminAuth, (req, res) => {
  const sessionId = getAdminSessionId(req);
  const previewTheme = sessionId ? themePreviewBySession.get(sessionId) : null;
  const published = getPublishedTheme();
  res.json({
    published: published.theme,
    publishedVersionId: published.id,
    preview: previewTheme,
  });
});

app.get("/api/admin/theme/history", adminAuth, (req, res) => {
  res.json({
    publishedVersionId: themeStore.publishedVersionId,
    versions: themeStore.versions.map((version) => ({
      id: version.id,
      label: version.label,
      createdAt: version.createdAt,
      theme: version.theme,
    })),
  });
});

app.post("/api/admin/theme/preview", adminAuth, (req, res) => {
  const sessionId = getAdminSessionId(req);
  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  if (req.body?.clear) {
    themePreviewBySession.delete(sessionId);
    const published = getPublishedTheme();
    broadcastThemeUpdate({ mode: "preview", theme: published.theme, versionId: published.id, sessionId });
    return res.json({ theme: published.theme });
  }
  const published = getPublishedTheme();
  const nextTheme = sanitizeTheme(req.body?.theme, published.theme);
  themePreviewBySession.set(sessionId, nextTheme);
  broadcastThemeUpdate({ mode: "preview", theme: nextTheme, versionId: "preview", sessionId });
  return res.json({ theme: nextTheme });
});

app.post("/api/admin/theme/publish", adminAuth, async (req, res) => {
  const sessionId = getAdminSessionId(req);
  const published = getPublishedTheme();
  const nextTheme = sanitizeTheme(req.body?.theme, published.theme);
  const label = typeof req.body?.label === "string" ? req.body.label : "Published update";
  const version = createThemeVersion(nextTheme, label);
  themeStore.versions.push(version);
  themeStore.publishedVersionId = version.id;
  if (sessionId) {
    themePreviewBySession.delete(sessionId);
  }
  await persistThemeStore();
  broadcastThemeUpdate({ mode: "published", theme: version.theme, versionId: version.id });
  return res.json({ version });
});

app.post("/api/admin/theme/rollback", adminAuth, async (req, res) => {
  const { versionId } = req.body || {};
  const version = themeStore.versions.find((item) => item.id === versionId);
  if (!version) {
    return res.status(404).json({ error: "Version not found." });
  }
  themeStore.publishedVersionId = version.id;
  await persistThemeStore();
  broadcastThemeUpdate({ mode: "published", theme: version.theme, versionId: version.id });
  return res.json({ version });
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

const startServer = async () => {
  await loadThemeStore();
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
};

startServer();
