export type ElevenLabsRequest = {
  text: string;
  voiceId: string;
  modelId?: string;
  voiceSettings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
};

export const synthesizeSpeech = async ({
  text,
  voiceId,
  modelId,
  voiceSettings
}: ElevenLabsRequest) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text,
        model_id: modelId ?? "eleven_multilingual_v2",
        voice_settings: voiceSettings ?? {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`ElevenLabs error: ${message}`);
  }

  return response.arrayBuffer();
};
