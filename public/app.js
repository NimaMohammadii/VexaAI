const textInput = document.getElementById("textInput");
const charCount = document.getElementById("charCount");
const charTotal = document.getElementById("charTotal");
const voiceSelect = document.getElementById("voiceSelect");
const generateBtn = document.getElementById("generateBtn");
const statusMessage = document.getElementById("statusMessage");
const audioPlayer = document.getElementById("audioPlayer");
const playerWrap = document.getElementById("playerWrap");
const menuToggle = document.getElementById("menuToggle");
const menuClose = document.getElementById("menuClose");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");
const voicePills = document.querySelectorAll(".voice-pill");
const creditsChip = document.getElementById("creditsChip");
const creditsAvailable = document.getElementById("creditsAvailable");
const creditsRemaining = document.getElementById("creditsRemaining");
const creditsTotal = document.getElementById("creditsTotal");
const creditsFill = document.getElementById("creditsFill");

const maxChars = textInput ? Number(textInput.getAttribute("maxlength")) || 1000 : 0;

const formatNumber = (value) => value.toLocaleString("en-US");
const USER_ID_STORAGE_KEY = "vexa_user_id";
const CREDIT_FILL_MAX = 100;

let currentCredits = null;
let totalCredits = null;

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
};

const setStatus = (message, { isError = false, isLoading = false } = {}) => {
  if (!statusMessage) {
    return;
  }
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
  statusMessage.classList.toggle("loading", isLoading);
};

const toggleLoading = (isLoading) => {
  if (!generateBtn) {
    return;
  }
  generateBtn.disabled = isLoading;
  generateBtn.classList.toggle("is-loading", isLoading);
  generateBtn.textContent = isLoading ? "Generating speech..." : "Generate speech";
};

const handleGenerate = async () => {
  if (!textInput || !voiceSelect) {
    return;
  }
  const text = textInput.value.trim();
  const voice = voiceSelect.value;

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
    if (playerWrap) {
      playerWrap.hidden = false;
    }
    updateCharCount();
    setStatus("Your audio is ready. Press play to listen.");
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

if (textInput) {
  textInput.addEventListener("input", updateCharCount);
}

if (generateBtn) {
  generateBtn.addEventListener("click", handleGenerate);
}

if (voicePills.length && voiceSelect) {
  const setActiveVoice = (voice) => {
    voiceSelect.value = voice;
    voicePills.forEach((pill) => {
      pill.classList.toggle("is-active", pill.dataset.voice === voice);
    });
  };

  voicePills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const voice = pill.dataset.voice;
      if (voice) {
        setActiveVoice(voice);
      }
    });
  });
}

if (menuToggle) {
  menuToggle.addEventListener("click", openMenu);
}
if (menuClose) {
  menuClose.addEventListener("click", closeMenu);
}
if (menuOverlay) {
  menuOverlay.addEventListener("click", closeMenu);
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

if (charTotal) {
  charTotal.textContent = formatNumber(maxChars);
}
if (textInput) {
  updateCharCount();
}
document.body.setAttribute("data-theme", "dark");

initUser();
sendHeartbeat();
setInterval(sendHeartbeat, 60 * 1000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    sendHeartbeat();
  }
});
