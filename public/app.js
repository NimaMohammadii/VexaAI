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

const maxChars = textInput ? Number(textInput.getAttribute("maxlength")) || 1000 : 0;

const formatNumber = (value) => value.toLocaleString("en-US");

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
  generateBtn.textContent = isLoading ? "Generating voice..." : "🎧 Generate Voice";
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
    window.location.href = "/admin-login";
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
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "We couldn't generate that voice.");
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
