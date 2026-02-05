const micButton = document.getElementById("micBtn");

const stopStreamTracks = (stream) => {
  stream?.getTracks().forEach((track) => track.stop());
};

const requestMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("MIC ACCESS GRANTED");
    stopStreamTracks(stream);
  } catch (error) {
    console.error("MIC ACCESS DENIED", error);
  }
};

if (micButton) {
  micButton.addEventListener("touchstart", (event) => {
    event.preventDefault();
    requestMicrophonePermission();
  });

  micButton.addEventListener("touchend", (event) => {
    event.preventDefault();
  });
}
