export type LayoutSection =
  | {
      type: "hero";
      title: string;
      subtitle: string;
      badge?: string;
    }
  | {
      type: "featureGrid";
      title: string;
      items: { title: string; description: string }[];
    }
  | {
      type: "tips";
      title: string;
      tips: string[];
    };

export type StudioLayout = {
  name: string;
  sections: LayoutSection[];
};

export const defaultLayout: StudioLayout = {
  name: "studio",
  sections: [
    {
      type: "hero",
      title: "VexaAI Text-to-Speech Studio",
      subtitle:
        "Craft lifelike narration with secure ElevenLabs synthesis, real-time layout updates, and production-ready controls.",
      badge: "Production-ready"
    },
    {
      type: "featureGrid",
      title: "Why teams choose VexaAI",
      items: [
        {
          title: "Secure ElevenLabs pipeline",
          description:
            "All synthesis happens server-side with keys locked behind environment variables."
        },
        {
          title: "Credits that scale",
          description:
            "Automatic credit deductions per request with auditable usage tracking."
        },
        {
          title: "Live layout control",
          description:
            "Admin updates are pushed instantly to every active studio session."
        }
      ]
    },
    {
      type: "tips",
      title: "Studio tips",
      tips: [
        "Keep scripts concise and consistent for the most natural synthesis.",
        "Use the preview player to validate pacing before exporting.",
        "Monitor credits in real time to stay in control of usage."
      ]
    }
  ]
};
