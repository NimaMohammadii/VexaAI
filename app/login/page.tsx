"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("Processing...");

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const data = await response.json();
      setStatus(data.error ?? "Authentication failed");
      return;
    }

    window.location.href = "/";
  };

  return (
    <main>
      <div className="container" style={{ maxWidth: 520 }}>
        <h1 style={{ fontSize: 28 }}>
          {mode === "login" ? "Sign in to VexaAI" : "Create your account"}
        </h1>
        <p className="subtle" style={{ marginTop: 8 }}>
          Secure access is required for synthesis and credits tracking.
        </p>
        <form
          onSubmit={handleSubmit}
          style={{ marginTop: 24, display: "grid", gap: 16 }}
        >
          <label>
            <span className="subtle">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            <span className="subtle">Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button className="button" type="submit">
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
          {status ? <p className="subtle">{status}</p> : null}
        </form>
        <div className="divider" />
        <p className="subtle">
          {mode === "login" ? "Need an account?" : "Already have an account?"}{" "}
          <button
            className="button secondary"
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
        <p className="subtle" style={{ marginTop: 12 }}>
          <Link href="/">Return to studio</Link>
        </p>
      </div>
    </main>
  );
}
