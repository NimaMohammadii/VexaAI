const micButton = document.getElementById("micBtn");

const TARGET_SAMPLE_RATE = 16000;
let audioContext;
let mediaStream;
let mediaSource;
let processor;
let isCapturing = false;
let recordedChunks = [];
let recordedLength = 0;

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
  }
};

const stopCapture = () => {
  if (!isCapturing) {
    return;
  }

  isCapturing = false;
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
    return;
  }

  const downsampled = downsampleBuffer(mergedBuffer, context.sampleRate, TARGET_SAMPLE_RATE);
  const pcm16Buffer = floatTo16BitPCM(downsampled);
  const wavBlob = encodeWav(pcm16Buffer, TARGET_SAMPLE_RATE);

  console.log("AUDIO CAPTURED", {
    rawSamples: mergedBuffer.length,
    wavBytes: wavBlob.size,
  });
};

if (micButton) {
  micButton.addEventListener("touchstart", (event) => {
    event.preventDefault();
    startCapture();
  });

  micButton.addEventListener("touchend", (event) => {
    event.preventDefault();
    stopCapture();
  });
}
