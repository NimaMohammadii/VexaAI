import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const voiceMap = {
  Ava: "21m00Tcm4TlvDq8ikWAM",
  Liam: "AZnzlk1XvdvUeBnXmlld",
  Noah: "ErXwobaYiN019PkySvjV",
  Emma: "MF3mGyEYCl7XYWbV9V6O",
};

app.post("/tts", async (req, res) => {
  try {
    const { text, voice } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required." });
    }

    const voiceId = voiceMap[voice] || voiceMap.Ava;
    const apiKey = process.env.ELEVEN_API;

    if (!apiKey) {
      return res.status(500).json({ error: "Server API key is missing." });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_v3",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: errorText || "TTS failed." });
    }

    res.setHeader("Content-Type", "audio/mpeg");

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return res.send(audioBuffer);
  } catch (error) {
    return res.status(500).json({ error: "Unexpected server error." });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
