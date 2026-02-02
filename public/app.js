const textInput = document.getElementById("textInput");
const charCount = document.getElementById("charCount");
const charTotal = document.getElementById("charTotal");
const voiceSelect = document.getElementById("voiceSelect");
const generateBtn = document.getElementById("generateBtn");
const statusMessage = document.getElementById("statusMessage");
const audioPlayer = document.getElementById("audioPlayer");
const playerWrap = document.getElementById("playerWrap");
const themeToggle = document.getElementById("themeToggle");

const maxChars = Number(textInput.getAttribute("maxlength")) || 1000;

const updateCharCount = () => {
  const length = textInput.value.length;
  charCount.textContent = length.toLocaleString("en-US");
};

const setStatus = (message, { isError = false, isLoading = false } = {}) => {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
  statusMessage.classList.toggle("loading", isLoading);
};

textInput.addEventListener("input", updateCharCount);

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
    setStatus("Your audio is ready. Press play to listen.");
  } catch (error) {
    setStatus(error.message, { isError: true });
  } finally {
    toggleLoading(false);
  }
};

generateBtn.addEventListener("click", handleGenerate);

charTotal.textContent = maxChars.toLocaleString("en-US");
updateCharCount();

const getPreferredTheme = () => {
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme) {
    return storedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.textContent = isDark ? "☀️ Light mode" : "🌙 Dark mode";
};

const toggleTheme = () => {
  const nextTheme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", nextTheme);
  applyTheme(nextTheme);
};

applyTheme(getPreferredTheme());
themeToggle.addEventListener("click", toggleTheme);
