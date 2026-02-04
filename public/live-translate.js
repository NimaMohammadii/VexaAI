const micButton = document.getElementById("micButton");
const micTestButton = document.getElementById("micTestButton");
const liveStatus = document.getElementById("liveStatus");

let activeStream = null;
let isPressing = false;

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
  micButton.disabled = false;
};

const setPressedState = (pressed) => {
  if (!micButton) {
    return;
  }
  micButton.classList.toggle("is-pressed", pressed);
  document.body?.classList.toggle("no-text-select", pressed);
};

const ensureSecureMicrophoneContext = () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("Microphone access is not supported in this browser.");
    return false;
  }
  if (!window.isSecureContext) {
    setStatus("Microphone access requires HTTPS.");
    console.error("Microphone access blocked: insecure context.");
    return false;
  }
  return true;
};

const logMicrophoneError = (error) => {
  const name = error?.name || "UnknownError";
  const message = error?.message || "Unknown error.";
  console.error("Microphone permission failed:", error);
  setStatus(`Microphone error: ${name} - ${message}`);
};

const stopActiveStream = () => {
  if (!activeStream) {
    return;
  }
  activeStream.getTracks().forEach((track) => track.stop());
  activeStream = null;
};

const handlePointerDown = (event) => {
  if (event.type === "touchstart" && window.PointerEvent) {
    return;
  }
  event.preventDefault();
  if (!micButton || isPressing) {
    return;
  }
  isPressing = true;
  setPressedState(true);
  if (event.pointerId != null && micButton.setPointerCapture) {
    micButton.setPointerCapture(event.pointerId);
  }
  if (!ensureSecureMicrophoneContext()) {
    setPressedState(false);
    isPressing = false;
    return;
  }

  const streamPromise = navigator.mediaDevices.getUserMedia({ audio: true });
  streamPromise
    .then((stream) => {
      activeStream = stream;
      setButtonState("recording");
      setStatus("Microphone live. Release to stop.");
    })
    .catch((error) => {
      logMicrophoneError(error);
      setPressedState(false);
      isPressing = false;
    });
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
  stopActiveStream();
  setButtonState("idle");
  setStatus("Microphone released.");
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

const handleTestPress = (event) => {
  if (event.type === "touchstart" && window.PointerEvent) {
    return;
  }
  event.preventDefault();
  if (!ensureSecureMicrophoneContext()) {
    return;
  }
  if (activeStream) {
    setStatus("Microphone already active.");
    return;
  }
  const streamPromise = navigator.mediaDevices.getUserMedia({ audio: true });
  streamPromise
    .then((stream) => {
      activeStream = stream;
      setStatus("Microphone permission granted.");
      stopActiveStream();
    })
    .catch((error) => {
      logMicrophoneError(error);
    });
};

if (micTestButton) {
  micTestButton.addEventListener("pointerdown", handleTestPress);
  micTestButton.addEventListener("touchstart", handleTestPress, {
    passive: false,
  });
}

window.addEventListener("beforeunload", () => {
  stopActiveStream();
});
