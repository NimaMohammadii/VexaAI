const textInput = document.getElementById("textInput");
const charCount = document.getElementById("charCount");
const charTotal = document.getElementById("charTotal");
const generateBtn = document.getElementById("generateBtn");
const statusMessage = document.getElementById("statusMessage");
const audioPlayer = document.getElementById("audioPlayer");
const playerWrap = document.getElementById("playerWrap");
const audioPlay = document.getElementById("audioPlay");
const audioDownload = document.getElementById("audioDownload");
const menuToggle = document.getElementById("menuToggle");
const menuClose = document.getElementById("menuClose");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");
const historyToggle = document.getElementById("historyToggle");
const historyPanel = document.getElementById("historyPanel");
const historyClose = document.getElementById("historyClose");
const historyList = document.getElementById("historyList");
const creditsChip = document.getElementById("creditsChip");
const creditsAvailable = document.getElementById("creditsAvailable");
const creditsRemaining = document.getElementById("creditsRemaining");
const creditsTotal = document.getElementById("creditsTotal");
const creditsFill = document.getElementById("creditsFill");

const maxChars = textInput ? Number(textInput.getAttribute("maxlength")) || 1000 : 0;
let currentVoice = window.VEXA_SELECTED_VOICE || "Rachel";

const formatNumber = (value) => value.toLocaleString("en-US");
const USER_ID_STORAGE_KEY = "vexa_user_id";
const CREDIT_FILL_MAX = 100;

let currentCredits = null;
let totalCredits = null;
const historyEntries = [];

const applyStickerSettings = (stickers = {}) => {
  const stickerSlots = document.querySelectorAll("[data-sticker-key]");
  stickerSlots.forEach((slot) => {
    const key = slot.dataset.stickerKey;
    const src = stickers?.[key];
    const image = slot.querySelector(".sticker-image");
    if (image) {
      image.src = src || "";
      image.alt = image.alt || `${key} sticker`;
    }
    slot.classList.toggle("has-sticker", Boolean(src));
  });
};

const applySiteSettings = (settings = {}) => {
  const root = document.documentElement;
  const layout = settings.layout || {};
  const colors = settings.colors || {};
  const buttons = settings.buttons || {};

  if (layout.pageMaxWidth) {
    root.style.setProperty("--page-max-width", `${layout.pageMaxWidth}px`);
  }
  if (layout.ttsMaxWidth) {
    root.style.setProperty("--tts-max-width", `${layout.ttsMaxWidth}px`);
  }
  if (layout.homeGridMaxWidth) {
    root.style.setProperty("--home-grid-max-width", `${layout.homeGridMaxWidth}px`);
  }

  if (colors.bg) {
    root.style.setProperty("--bg", colors.bg);
  }
  if (colors.bgAlt) {
    root.style.setProperty("--bg-alt", colors.bgAlt);
  }
  if (colors.surface) {
    root.style.setProperty("--surface", colors.surface);
  }
  if (colors.panel) {
    root.style.setProperty("--panel", colors.panel);
  }
  if (colors.primary) {
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-dark", colors.primary);
  }
  if (colors.headerBg) {
    root.style.setProperty("--header-bg", colors.headerBg);
  }

  if (buttons.baseFontSize) {
    root.style.setProperty("--button-font-size", `${buttons.baseFontSize}rem`);
  }
  if (buttons.basePaddingY) {
    root.style.setProperty("--button-padding-y", `${buttons.basePaddingY}px`);
  }
  if (buttons.basePaddingX) {
    root.style.setProperty("--button-padding-x", `${buttons.basePaddingX}px`);
  }
  if (buttons.ctaFontSize) {
    root.style.setProperty("--cta-font-size", `${buttons.ctaFontSize}rem`);
  }
  if (buttons.ctaPaddingY) {
    root.style.setProperty("--cta-padding-y", `${buttons.ctaPaddingY}px`);
  }
  if (buttons.ctaPaddingX) {
    root.style.setProperty("--cta-padding-x", `${buttons.ctaPaddingX}px`);
  }

  applyStickerSettings(settings.stickers);
};

const loadSiteSettings = async () => {
  try {
    const response = await fetch("/api/site-settings");
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    applySiteSettings(data);
  } catch (error) {
    console.warn("Unable to load site settings.", error);
  }
};

const readCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

const writeCookie = (name, value, days = 365) => {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
};

const getStoredUserId = () => {
  try {
    return localStorage.getItem(USER_ID_STORAGE_KEY);
  } catch (error) {
    return readCookie(USER_ID_STORAGE_KEY);
  }
};

const storeUserId = (userId) => {
  try {
    localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  } catch (error) {
    writeCookie(USER_ID_STORAGE_KEY, userId);
  }
};

const generateUserId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `user_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const getOrCreateUserId = () => {
  let userId = getStoredUserId();
  if (!userId) {
    userId = generateUserId();
    storeUserId(userId);
  }
  return userId;
};

const userId = getOrCreateUserId();

const updateCreditDisplay = () => {
  if (currentCredits === null) {
    return;
  }

  if (creditsAvailable) {
    creditsAvailable.textContent = formatNumber(currentCredits);
  }

  if (creditsRemaining) {
    creditsRemaining.textContent = formatNumber(currentCredits);
  }

  if (creditsTotal) {
    const totalValue = totalCredits ?? currentCredits;
    creditsTotal.textContent = formatNumber(totalValue);
  }

  if (creditsFill) {
    const totalValue = totalCredits ?? currentCredits;
    const ratio = totalValue > 0 ? (currentCredits / totalValue) * CREDIT_FILL_MAX : 0;
    const clamped = Math.min(CREDIT_FILL_MAX, Math.max(0, ratio));
    creditsFill.style.width = `${clamped}%`;
  }

  if (creditsChip) {
    creditsChip.hidden = false;
  }
};

const setCredits = (remaining, total) => {
  if (Number.isFinite(remaining)) {
    currentCredits = Math.max(0, Math.floor(remaining));
  }
  if (Number.isFinite(total)) {
    totalCredits = Math.max(currentCredits ?? 0, Math.floor(total));
  }
  updateCreditDisplay();
};

const initUser = async () => {
  try {
    const response = await fetch("/api/users/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error("Unable to initialize user.");
    }
    const data = await response.json();
    setCredits(data.credits, data.startingCredits);
  } catch (error) {
    console.warn("Unable to initialize user.", error);
  }
};

const sendHeartbeat = async () => {
  try {
    await fetch("/api/users/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  } catch (error) {
    console.warn("Unable to send heartbeat.", error);
  }
};

const updateCharCount = () => {
  const length = textInput.value.length;
  if (charCount) {
    charCount.textContent = formatNumber(length);
  }
  if (statusMessage && statusMessage.classList.contains("error")) {
    setStatus("");
  }
  if (playerWrap && !playerWrap.hidden) {
    playerWrap.hidden = true;
  }
  if (audioPlayer && !audioPlayer.paused) {
    audioPlayer.pause();
  }
  if (audioPlay) {
    audioPlay.classList.remove("is-playing");
  }
  if (generateBtn) {
    generateBtn.classList.toggle("is-ready", textInput.value.trim().length > 0);
  }
};

const setStatus = (message, { isError = false, isLoading = false } = {}) => {
  if (!statusMessage) {
    return;
  }
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
  statusMessage.classList.toggle("loading", isLoading);
};

const handleVoiceChange = (event) => {
  if (event?.detail?.voice) {
    currentVoice = event.detail.voice;
  }
};

const toggleHistoryPanel = (isOpen) => {
  if (!historyPanel || !historyToggle) {
    return;
  }
  historyPanel.hidden = !isOpen;
  historyToggle.setAttribute("aria-expanded", String(isOpen));
};

const renderHistory = () => {
  if (!historyList) {
    return;
  }
  historyList.innerHTML = "";
  if (!historyEntries.length) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "No generations yet.";
    historyList.appendChild(empty);
    return;
  }

  historyEntries.slice(0, 6).forEach((entry) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "history-item";
    item.dataset.text = entry.text;

    const title = document.createElement("span");
    title.className = "history-title";
    title.textContent = entry.title;

    const time = document.createElement("span");
    time.className = "history-time";
    time.textContent = entry.time;

    item.appendChild(title);
    item.appendChild(time);
    historyList.appendChild(item);
  });
};

const formatTimestamp = (date) =>
  date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

const toggleLoading = (isLoading) => {
  if (!generateBtn) {
    return;
  }
  generateBtn.disabled = isLoading;
  generateBtn.classList.toggle("is-loading", isLoading);
  generateBtn.textContent = isLoading ? "Generating Speech..." : "Generate Speech";
};

const handleGenerate = async () => {
  if (!textInput) {
    return;
  }
  const text = textInput.value.trim();
  const voice = currentVoice;

  if (!text) {
    setStatus("Please enter some text to generate audio.", { isError: true });
    return;
  }

  if (text === "/adminmain") {
    window.location.href = "/adminmain";
    return;
  }

  setStatus("Generating your voice...", { isLoading: true });
  toggleLoading(true);
  if (playerWrap) {
    playerWrap.hidden = true;
  }
  if (audioPlay) {
    audioPlay.classList.remove("is-playing");
  }

  try {
    const response = await fetch("/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice, userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "We couldn't generate that voice.");
    }

    const remainingHeader = response.headers.get("x-user-credits");
    const startingHeader = response.headers.get("x-user-starting-credits");
    const remainingCredits = remainingHeader ? Number(remainingHeader) : null;
    const startingCredits = startingHeader ? Number(startingHeader) : null;
    if (Number.isFinite(remainingCredits)) {
      setCredits(remainingCredits, Number.isFinite(startingCredits) ? startingCredits : totalCredits);
    } else if (Number.isFinite(currentCredits)) {
      setCredits(currentCredits - text.length, totalCredits);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    if (audioPlayer) {
      audioPlayer.src = audioUrl;
    }
    if (audioDownload) {
      audioDownload.href = audioUrl;
    }
    if (playerWrap) {
      playerWrap.hidden = false;
    }
    updateCharCount();
    setStatus("Your audio is ready.");

    const title = text.length > 40 ? `${text.slice(0, 40)}...` : text;
    historyEntries.unshift({
      text,
      title,
      time: formatTimestamp(new Date()),
    });
    renderHistory();
  } catch (error) {
    setStatus(error.message, { isError: true });
  } finally {
    toggleLoading(false);
  }
};

const openMenu = () => {
  if (!sideMenu || !menuOverlay) {
    return;
  }
  sideMenu.classList.add("is-open");
  menuOverlay.hidden = false;
  menuToggle?.setAttribute("aria-expanded", "true");
};

const closeMenu = () => {
  if (!sideMenu || !menuOverlay) {
    return;
  }
  sideMenu.classList.remove("is-open");
  menuOverlay.hidden = true;
  menuToggle?.setAttribute("aria-expanded", "false");
};

const toggleMenu = () => {
  if (!sideMenu) {
    return;
  }
  const isOpen = sideMenu.classList.contains("is-open");
  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
};

if (textInput) {
  textInput.addEventListener("input", updateCharCount);
}

if (generateBtn) {
  generateBtn.addEventListener("click", handleGenerate);
}

window.addEventListener("vexa:voice-change", handleVoiceChange);

if (historyToggle) {
  historyToggle.addEventListener("click", () => {
    toggleHistoryPanel(historyPanel?.hidden ?? true);
  });
}

if (historyClose) {
  historyClose.addEventListener("click", () => {
    toggleHistoryPanel(false);
  });
}

if (historyList) {
  historyList.addEventListener("click", (event) => {
    const target = event.target.closest(".history-item");
    if (!target || !textInput) {
      return;
    }
    textInput.value = target.dataset.text || "";
    updateCharCount();
    toggleHistoryPanel(false);
  });
}

if (menuToggle) {
  menuToggle.addEventListener("click", toggleMenu);
}
if (menuClose) {
  menuClose.addEventListener("click", closeMenu);
}
if (menuOverlay) {
  menuOverlay.addEventListener("click", closeMenu);
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    toggleHistoryPanel(false);
    closeMenu();
  }
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (historyPanel && historyToggle && !historyPanel.contains(target) && !historyToggle.contains(target)) {
    toggleHistoryPanel(false);
  }
});

if (charTotal) {
  charTotal.textContent = formatNumber(maxChars);
}
if (textInput) {
  updateCharCount();
}
document.body.setAttribute("data-theme", "dark");

if (window.VEXA_SELECTED_VOICE) {
  currentVoice = window.VEXA_SELECTED_VOICE;
}

loadSiteSettings();
initUser();
sendHeartbeat();
setInterval(sendHeartbeat, 60 * 1000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    sendHeartbeat();
  }
});

if (audioPlay && audioPlayer) {
  audioPlay.addEventListener("click", () => {
    if (audioPlayer.paused) {
      audioPlayer.play();
    } else {
      audioPlayer.pause();
    }
  });

  audioPlayer.addEventListener("play", () => {
    audioPlay.classList.add("is-playing");
    audioPlay.setAttribute("aria-label", "Pause audio");
    const icon = audioPlay.querySelector(".play-icon");
    if (icon) {
      icon.textContent = "⏸";
    }
  });

  audioPlayer.addEventListener("pause", () => {
    audioPlay.classList.remove("is-playing");
    audioPlay.setAttribute("aria-label", "Play audio");
    const icon = audioPlay.querySelector(".play-icon");
    if (icon) {
      icon.textContent = "▶";
    }
  });
}
