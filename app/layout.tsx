import "@/styles/globals.css";

export const metadata = {
  title: "VexaAI TTS Studio",
  description: "Production-grade Text-to-Speech studio with ElevenLabs"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
