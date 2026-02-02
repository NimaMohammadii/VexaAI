const textInput = document.getElementById("textInput");
const charCount = document.getElementById("charCount");
const voiceSelect = document.getElementById("voiceSelect");
const generateBtn = document.getElementById("generateBtn");
const statusMessage = document.getElementById("statusMessage");
const audioPlayer = document.getElementById("audioPlayer");
const playerWrap = document.getElementById("playerWrap");

const updateCharCount = () => {
  const length = textInput.value.length;
  charCount.textContent = length.toLocaleString("fa-IR");
  // اینجا می‌توان شمارش کاراکترها را برای سیستم کردیت ذخیره یا ارسال کرد.
};

const setStatus = (message, isError = false) => {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
};

textInput.addEventListener("input", updateCharCount);

const toggleLoading = (isLoading) => {
  generateBtn.disabled = isLoading;
  generateBtn.textContent = isLoading ? "در حال ساخت..." : "ساخت صدا";
};

const handleGenerate = async () => {
  const text = textInput.value.trim();
  const voice = voiceSelect.value;

  if (!text) {
    setStatus("لطفاً ابتدا یک متن وارد کنید.", true);
    return;
  }

  setStatus("در حال آماده‌سازی صدا...");
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
      throw new Error(errorData.error || "خطا در ساخت صدا.");
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    audioPlayer.src = audioUrl;
    playerWrap.hidden = false;
    setStatus("صدا آماده است. می‌توانید آن را پخش کنید.");
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    toggleLoading(false);
  }
};

generateBtn.addEventListener("click", handleGenerate);

updateCharCount();
// در این بخش می‌توانید احراز هویت یا پرداخت را به جریان UX اضافه کنید.
