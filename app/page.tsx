import { Header } from "@/components/Header";
import { StudioClient } from "@/components/StudioClient";
import { getOrCreateLayout } from "@/lib/layout-service";

export default async function HomePage() {
  const layout = await getOrCreateLayout();

  return (
    <main>
      <Header
        title="VexaAI Studio"
        subtitle="Secure ElevenLabs synthesis with real-time layout updates."
      />
      <StudioClient initialLayout={layout} />
    </main>
  );
}
