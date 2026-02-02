const textInput = document.getElementById("textInput");
const charCount = document.getElementById("charCount");
const charTotal = document.getElementById("charTotal");
const voiceSelect = document.getElementById("voiceSelect");
const generateBtn = document.getElementById("generateBtn");
const statusMessage = document.getElementById("statusMessage");
const audioPlayer = document.getElementById("audioPlayer");
const playerWrap = document.getElementById("playerWrap");
const headerCredits = document.getElementById("headerCredits");
const availableCredits = document.getElementById("availableCredits");
const requiredCredits = document.getElementById("requiredCredits");
const remainingCredits = document.getElementById("remainingCredits");
const creditsWarning = document.getElementById("creditsWarning");
const siteHeader = document.getElementById("siteHeader");
const langToggle = document.getElementById("langToggle");

const maxChars = Number(textInput.getAttribute("maxlength")) || 1000;
let currentCredits = 1240;

const formatNumber = (value) => value.toLocaleString("en-US");

const updateCharCount = () => {
  const length = textInput.value.length;
  charCount.textContent = formatNumber(length);
  requiredCredits.textContent = formatNumber(length);
  const remaining = Math.max(currentCredits - length, 0);
  remainingCredits.textContent = formatNumber(remaining);
  const isInsufficient = length > currentCredits;
  creditsWarning.hidden = !isInsufficient;
  generateBtn.disabled = isInsufficient;
  if (isInsufficient) {
    setStatus("Not enough credits to generate this voice.", { isError: true });
  } else if (statusMessage.classList.contains("error")) {
    setStatus("");
  }
};

const syncCreditsDisplay = () => {
  headerCredits.textContent = formatNumber(currentCredits);
  availableCredits.textContent = formatNumber(currentCredits);
};

const setStatus = (message, { isError = false, isLoading = false } = {}) => {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
  statusMessage.classList.toggle("loading", isLoading);
};

const toggleLoading = (isLoading) => {
  generateBtn.disabled = isLoading;
  generateBtn.classList.toggle("is-loading", isLoading);
  generateBtn.textContent = isLoading ? "Generating voice..." : "🎧 Generate Voice";
};

const handleGenerate = async () => {
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

  if (text.length > currentCredits) {
    creditsWarning.hidden = false;
    setStatus("Not enough credits to generate this voice.", { isError: true });
    return;
  }

  setStatus("Generating your voice...", { isLoading: true });
  toggleLoading(true);
  playerWrap.hidden = true;

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

    audioPlayer.src = audioUrl;
    playerWrap.hidden = false;
    currentCredits = Math.max(currentCredits - text.length, 0);
    syncCreditsDisplay();
    updateCharCount();
    setStatus("Your audio is ready. Press play to listen.");
  } catch (error) {
    setStatus(error.message, { isError: true });
  } finally {
    toggleLoading(false);
  }
};

const handleHeaderShadow = () => {
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 4);
};

const toggleLanguageDirection = () => {
  const isRtl = document.body.getAttribute("dir") === "rtl";
  const nextDir = isRtl ? "ltr" : "rtl";
  document.body.setAttribute("dir", nextDir);
  document.documentElement.setAttribute("lang", nextDir === "rtl" ? "fa" : "en");
};

textInput.addEventListener("input", updateCharCount);

generateBtn.addEventListener("click", handleGenerate);

window.addEventListener("scroll", handleHeaderShadow);
langToggle.addEventListener("click", toggleLanguageDirection);

charTotal.textContent = formatNumber(maxChars);
syncCreditsDisplay();
updateCharCount();
handleHeaderShadow();
