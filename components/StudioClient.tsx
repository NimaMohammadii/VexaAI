"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutRenderer } from "@/components/LayoutRenderer";
import { CreditsCard } from "@/components/CreditsCard";
import { TtsForm } from "@/components/TtsForm";
import type { StudioLayout } from "@/lib/layout";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useUserStore } from "@/store/useUserStore";

export const StudioClient = ({ initialLayout }: { initialLayout: StudioLayout }) => {
  const { layout, setLayout } = useLayoutStore();
  const { user, setUser } = useUserStore();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setLayout(initialLayout);
  }, [initialLayout, setLayout]);

  useEffect(() => {
    const loadUser = async () => {
      const response = await fetch("/api/user/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    };

    loadUser();
  }, [setUser]);

  useEffect(() => {
    const eventSource = new EventSource("/api/layout/stream");
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as StudioLayout;
        setLayout(payload);
        setStatus("Layout synced");
      } catch (error) {
        setStatus("Live update failed");
      }
    };

    eventSource.onerror = () => {
      setStatus("Live updates offline");
      eventSource.close();
    };

    return () => eventSource.close();
  }, [setLayout]);

  const layoutSections = useMemo(
    () => (layout ? layout.sections : initialLayout.sections),
    [layout, initialLayout]
  );

  return (
    <section>
      <LayoutRenderer sections={layoutSections} />
      <div className="grid two">
        <TtsForm />
        {user ? (
          <CreditsCard user={user} />
        ) : (
          <div className="card">
            <h3 style={{ fontSize: 20 }}>Sign in required</h3>
            <p className="subtle" style={{ marginTop: 12 }}>
              Create an account to activate credits and start generating audio.
            </p>
            <Link href="/login" className="button" style={{ marginTop: 16 }}>
              Go to login
            </Link>
          </div>
        )}
      </div>
      <div className="divider" />
      {status ? <p className="subtle">{status}</p> : null}
    </section>
  );
};
