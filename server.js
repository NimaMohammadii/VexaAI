import crypto from "crypto";
import express from "express";
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
