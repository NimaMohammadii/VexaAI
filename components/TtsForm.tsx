"use client";

import { useState } from "react";
import { useUserStore } from "@/store/useUserStore";

export const TtsForm = () => {
  const { user, setUser } = useUserStore();
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("Synthesizing...");
    setAudioUrl(null);

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId })
    });

    if (!response.ok) {
      const message = await response.json();
      setStatus(message.error ?? "Synthesis failed");
      return;
    }

    const nextCredits = response.headers.get("x-credits-remaining");
    if (nextCredits && user) {
      setUser({ ...user, credits: Number(nextCredits) });
    }

    const audioBlob = await response.blob();
    setAudioUrl(URL.createObjectURL(audioBlob));
    setStatus("Complete");
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div style={{ display: "grid", gap: 12 }}>
        <label>
          <span className="subtle">Voice ID</span>
          <input
            className="input"
            value={voiceId}
            onChange={(event) => setVoiceId(event.target.value)}
            placeholder="Leave blank to use default"
          />
        </label>
        <label>
          <span className="subtle">Script</span>
          <textarea
            className="textarea"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste your narration here..."
          />
        </label>
        <button className="button" type="submit" disabled={!text.trim()}>
          Generate audio
        </button>
        {status ? <p className="subtle">{status}</p> : null}
        {audioUrl ? (
          <audio controls src={audioUrl} style={{ width: "100%" }} />
        ) : null}
      </div>
    </form>
  );
};
