"use client";

import { useEffect, useState } from "react";
import type { StudioLayout } from "@/lib/layout";

const prettyJson = (value: unknown) => JSON.stringify(value, null, 2);

export const AdminEditor = ({ initialLayout }: { initialLayout: StudioLayout }) => {
  const [layoutJson, setLayoutJson] = useState(prettyJson(initialLayout));
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setLayoutJson(prettyJson(initialLayout));
  }, [initialLayout]);

  const handleSave = async () => {
    setStatus("Saving...");
    try {
      const payload = JSON.parse(layoutJson) as StudioLayout;
      const response = await fetch("/api/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.error ?? "Failed to update layout");
      }

      setStatus("Layout updated and pushed live.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON";
      setStatus(message);
    }
  };

  return (
    <div className="card">
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>Live Layout Editor</h2>
      <p className="subtle" style={{ marginBottom: 16 }}>
        Edit the JSON layout that powers the studio hero and content modules.
      </p>
      <textarea
        className="textarea"
        value={layoutJson}
        onChange={(event) => setLayoutJson(event.target.value)}
        style={{ minHeight: 320 }}
      />
      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <button className="button" type="button" onClick={handleSave}>
          Save & broadcast
        </button>
        {status ? <span className="subtle">{status}</span> : null}
      </div>
    </div>
  );
};
