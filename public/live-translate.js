const micButton = document.getElementById("micBtn");
const transcriptText = document.getElementById("transcriptText");
const translatedText = document.getElementById("translatedText");
const sourceLanguageSelect = document.getElementById("sourceLanguage");
const targetLanguageSelect = document.getElementById("targetLanguage");
const translatedAudio = document.getElementById("translatedAudio");
const translatedAudioWrap = document.getElementById("translatedAudioWrap");
const statusText = document.getElementById("liveStatus");
const originalCard = document.getElementById("originalCard");
const translatedCard = document.getElementById("translatedCard");

const transcriptPlaceholder = transcriptText?.textContent || "";
const translatedPlaceholder = translatedText?.textContent || "";

const TARGET_SAMPLE_RATE = 16000;
let audioContext;
let mediaStream;
let mediaSource;
let processor;
let isCapturing = false;
let recordedChunks = [];
let recordedLength = 0;
let isProcessing = false;

const stopStreamTracks = (stream) => {
  stream?.getTracks().forEach((track) => track.stop());
};

const ensureAudioContext = () => {
  if (!audioContext) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextCtor();
  }
  return audioContext;
};

const downsampleBuffer = (buffer, inputSampleRate, outputSampleRate) => {
  if (outputSampleRate === inputSampleRate) {
    return buffer;
  }
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accumulator = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
      accumulator += buffer[i];
      count += 1;
    }
    result[offsetResult] = accumulator / count;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
};

const floatTo16BitPCM = (floatBuffer) => {
  const buffer = new Int16Array(floatBuffer.length);
  for (let i = 0; i < floatBuffer.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, floatBuffer[i]));
    buffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return buffer;
};

const encodeWav = (pcm16Buffer, sampleRate) => {
  const headerSize = 44;
  const dataSize = pcm16Buffer.length * 2;
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i += 1) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < pcm16Buffer.length; i += 1) {
    view.setInt16(offset, pcm16Buffer[i], true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
};

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read audio data."));
    reader.readAsDataURL(blob);
  });

const updateStatus = (message) => {
  if (statusText) {
    statusText.textContent = message;
  }
};

const setCardFilled = (card, isFilled) => {
  if (!card) {
    return;
  }
  card.classList.toggle("is-filled", Boolean(isFilled));
};

const setTranscript = (text, isFinal = false) => {
  if (transcriptText) {
    transcriptText.textContent = text;
  }
  setCardFilled(originalCard, isFinal);
};

const setTranslation = (text, isFinal = false) => {
  if (translatedText) {
    translatedText.textContent = text;
  }
  setCardFilled(translatedCard, isFinal);
};

const resetAudioOutput = () => {
  if (translatedAudio) {
    translatedAudio.removeAttribute("src");
    translatedAudio.load();
  }
  if (translatedAudioWrap) {
    translatedAudioWrap.hidden = true;
    translatedAudioWrap.classList.remove("is-visible");
  }
};

const startCapture = async () => {
  if (isCapturing) {
    return;
  }

  try {
    const context = ensureAudioContext();
    await context.resume();
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaSource = context.createMediaStreamSource(mediaStream);
    processor = context.createScriptProcessor(4096, 1, 1);

    recordedChunks = [];
    recordedLength = 0;
    isCapturing = true;
    if (micButton) {
      micButton.classList.add("is-recording");
      micButton.classList.remove("is-holding");
    }
    updateStatus("Listening…");

    processor.onaudioprocess = (event) => {
      if (!isCapturing) {
        return;
      }
      const inputBuffer = event.inputBuffer.getChannelData(0);
      const chunk = new Float32Array(inputBuffer.length);
      chunk.set(inputBuffer);
      recordedChunks.push(chunk);
      recordedLength += chunk.length;
    };

    mediaSource.connect(processor);
    processor.connect(context.destination);
    console.log("CAPTURE STARTED");
  } catch (error) {
    console.error("MIC ACCESS DENIED", error);
    updateStatus("Microphone access denied.");
    micButton?.classList.remove("is-holding", "is-recording", "is-processing");
  }
};

const stopCapture = async () => {
  if (!isCapturing) {
    return;
  }

  isCapturing = false;
  if (micButton) {
    micButton.classList.remove("is-recording");
    micButton.classList.remove("is-holding");
    micButton.classList.remove("is-processing");
  }
  processor?.disconnect();
  mediaSource?.disconnect();
  stopStreamTracks(mediaStream);

  const context = ensureAudioContext();
  const mergedBuffer = new Float32Array(recordedLength);
  let offset = 0;
  recordedChunks.forEach((chunk) => {
    mergedBuffer.set(chunk, offset);
    offset += chunk.length;
  });

  if (mergedBuffer.length === 0) {
    console.warn("NO AUDIO CAPTURED");
    updateStatus("No audio captured.");
    setTranscript(transcriptPlaceholder, false);
    return;
  }

  const downsampled = downsampleBuffer(mergedBuffer, context.sampleRate, TARGET_SAMPLE_RATE);
  const pcm16Buffer = floatTo16BitPCM(downsampled);
  const wavBlob = encodeWav(pcm16Buffer, TARGET_SAMPLE_RATE);

  console.log("AUDIO CAPTURED", {
    rawSamples: mergedBuffer.length,
    wavBytes: wavBlob.size,
  });

  if (isProcessing) {
    return;
  }

  try {
    isProcessing = true;
    if (micButton) {
      micButton.classList.add("is-processing");
    }
    updateStatus("Translating…");
    setTranslation("Translating…", false);

    const sourceLabel = sourceLanguageSelect?.options[sourceLanguageSelect.selectedIndex]?.text || "";
    const targetLabel = targetLanguageSelect?.options[targetLanguageSelect.selectedIndex]?.text || "";

    const audioBase64 = await blobToBase64(wavBlob);
    const response = await fetch("/api/live-translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audioBase64,
        sourceLanguage: sourceLanguageSelect?.value,
        targetLanguage: targetLanguageSelect?.value,
        sourceLabel,
        targetLabel,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Translation failed.");
    }

    setTranscript(data?.transcript || "No transcript returned.", Boolean(data?.transcript));
    setTranslation(data?.translation || "No translation returned.", Boolean(data?.translation));
    if (translatedAudio) {
      if (data?.audioBase64) {
        translatedAudio.src = data.audioBase64;
        translatedAudio.load();
        if (translatedAudioWrap) {
          translatedAudioWrap.hidden = false;
          requestAnimationFrame(() => {
            translatedAudioWrap.classList.add("is-visible");
          });
        }
      } else {
        resetAudioOutput();
      }
    }
    updateStatus("Ready");
  } catch (error) {
    console.error("LIVE TRANSLATE ERROR", error);
    updateStatus("Unable to translate audio.");
    setTranscript(transcriptPlaceholder, false);
    setTranslation("Unable to translate audio.", false);
    resetAudioOutput();
  } finally {
    isProcessing = false;
    if (micButton) {
      micButton.classList.remove("is-processing");
    }
  }
};

resetAudioOutput();
setTranscript(transcriptPlaceholder, false);
setTranslation(translatedPlaceholder, false);

if (micButton) {
  const handlePointerDown = (event) => {
    event.preventDefault();
    if (isProcessing) {
      return;
    }
    micButton.classList.add("is-holding");
    startCapture();
  };

  const handlePointerUp = (event) => {
    event.preventDefault();
    stopCapture();
  };

  micButton.addEventListener("pointerdown", handlePointerDown);
  micButton.addEventListener("pointerup", handlePointerUp);
  micButton.addEventListener("pointerleave", handlePointerUp);
  micButton.addEventListener("pointercancel", handlePointerUp);
}

if (translatedAudio) {
  translatedAudio.addEventListener("play", () => {
    updateStatus("Speaking…");
    micButton?.classList.add("is-speaking");
  });

  translatedAudio.addEventListener("pause", () => {
    micButton?.classList.remove("is-speaking");
    updateStatus("Ready");
  });

  translatedAudio.addEventListener("ended", () => {
    micButton?.classList.remove("is-speaking");
    updateStatus("Ready");
  });
}
