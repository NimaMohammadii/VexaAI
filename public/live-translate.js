const micButton = document.getElementById("micButton");
const liveStatus = document.getElementById("liveStatus");
const transcriptText = document.getElementById("transcriptText");
const translatedText = document.getElementById("translatedText");
const translatedAudio = document.getElementById("translatedAudio");
const audioHint = document.getElementById("audioHint");
const sourceLanguage = document.getElementById("sourceLanguage");
const targetLanguage = document.getElementById("targetLanguage");

let mediaRecorder = null;
let activeStream = null;
let audioChunks = [];
let isProcessing = false;
let isPressing = false;
let recordingMimeType = "";

const setStatus = (message, { loading = false } = {}) => {
  if (!liveStatus) {
    return;
  }
  liveStatus.textContent = message;
  liveStatus.classList.toggle("is-loading", loading);
};

const setButtonState = (state) => {
  if (!micButton) {
    return;
  }
  micButton.classList.toggle("is-recording", state === "recording");
  micButton.disabled = state === "processing";
};

const setPressedState = (pressed) => {
  if (!micButton) {
    return;
  }
  micButton.classList.toggle("is-pressed", pressed);
  document.body?.classList.toggle("no-text-select", pressed);
};

const resetAudio = () => {
  if (!translatedAudio) {
    return;
  }
  translatedAudio.removeAttribute("src");
  translatedAudio.load();
};

const updateOutputs = ({ transcript, translation, audioUrl }) => {
  if (transcriptText) {
    transcriptText.textContent = transcript || "";
  }
  if (translatedText) {
    translatedText.textContent = translation || "";
  }
  if (audioHint) {
    audioHint.textContent = audioUrl
      ? "Tap play to listen to the translated voice."
      : "Awaiting audio output from the server.";
  }
  if (translatedAudio) {
    if (audioUrl) {
      translatedAudio.src = audioUrl;
    } else {
      resetAudio();
    }
  }
};

const stopRecording = () => {
  if (!mediaRecorder || mediaRecorder.state !== "recording") {
    return;
  }
  mediaRecorder.stop();
  setButtonState("processing");
  setStatus("Processing...", { loading: true });
};

const pickSupportedMimeType = () => {
  if (!window.MediaRecorder) {
    return "";
  }
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

const requestMicrophoneStream = () => {
  if (activeStream) {
    return Promise.resolve(activeStream);
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return Promise.reject(
      new Error("Microphone access is not supported in this browser.")
    );
  }
  return navigator.mediaDevices.getUserMedia({ audio: true });
};

const createMediaRecorder = (stream) => {
  if (!window.MediaRecorder) {
    throw new Error("Recording is not supported in this browser.");
  }
  recordingMimeType = pickSupportedMimeType();
  return new MediaRecorder(
    stream,
    recordingMimeType ? { mimeType: recordingMimeType } : undefined
  );
};

const getRecordingFilename = () => {
  if (recordingMimeType.includes("mp4")) {
    return "recording.mp4";
  }
  if (recordingMimeType.includes("mpeg")) {
    return "recording.mp3";
  }
  return "recording.webm";
};

const sendToBackend = async (audioBlob) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, getRecordingFilename());
  formData.append("sourceLanguage", sourceLanguage?.value || "en-US");
  formData.append("targetLanguage", targetLanguage?.value || "es-ES");

  const response = await fetch("/api/live-translate", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Live translate API unavailable.");
  }

  return response.json();
};

const runDemoFallback = () => ({
  transcript: "Hello, can you help me with a quick question?",
  translation: "Hola, ¿puedes ayudarme con una pregunta rápida?",
  audioUrl: "",
});

const handleProcessingComplete = (payload) => {
  updateOutputs(payload);
  setStatus("Translation ready.");
  setButtonState("idle");
  isProcessing = false;
};

const processAudio = async (audioBlob) => {
  if (isProcessing) {
    return;
  }
  isProcessing = true;
  try {
    const data = await sendToBackend(audioBlob);
    handleProcessingComplete({
      transcript: data?.transcript || "",
      translation: data?.translation || "",
      audioUrl: data?.audioUrl || "",
    });
  } catch (error) {
    const fallback = runDemoFallback();
    handleProcessingComplete(fallback);
  }
};

const handlePointerDown = async (event) => {
  if (event.type === "touchstart" && window.PointerEvent) {
    return;
  }
  event.preventDefault();
  if (!micButton || isProcessing || isPressing) {
    return;
  }
  isPressing = true;
  setPressedState(true);
  if (event.pointerId != null && micButton.setPointerCapture) {
    micButton.setPointerCapture(event.pointerId);
  }

  const streamPromise = requestMicrophoneStream();
  try {
    const stream = await streamPromise;
    mediaRecorder = createMediaRecorder(stream);
  } catch (error) {
    setStatus("Microphone access is unavailable.");
    setPressedState(false);
    isPressing = false;
    return;
  }

  audioChunks = [];
  mediaRecorder.addEventListener("dataavailable", (eventRecord) => {
    if (eventRecord.data.size > 0) {
      audioChunks.push(eventRecord.data);
    }
  });
  mediaRecorder.addEventListener(
    "stop",
    () => {
      const audioBlob = new Blob(audioChunks, {
        type: recordingMimeType || "audio/webm",
      });
      processAudio(audioBlob);
    },
    { once: true }
  );

  mediaRecorder.start();
  setButtonState("recording");
  setStatus("Listening... release to translate.");
};

const handlePointerUp = (event) => {
  if (event.type === "touchend" && window.PointerEvent) {
    return;
  }
  event.preventDefault();
  if (!isPressing) {
    return;
  }
  isPressing = false;
  setPressedState(false);
  stopRecording();
};

if (micButton) {
  micButton.addEventListener("pointerdown", handlePointerDown);
  micButton.addEventListener("pointerup", handlePointerUp);
  micButton.addEventListener("pointerleave", handlePointerUp);
  micButton.addEventListener("pointercancel", handlePointerUp);
  micButton.addEventListener("touchstart", handlePointerDown, { passive: false });
  micButton.addEventListener("touchend", handlePointerUp, { passive: false });
  micButton.addEventListener("touchcancel", handlePointerUp, { passive: false });
}

window.addEventListener("beforeunload", () => {
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
  }
});
