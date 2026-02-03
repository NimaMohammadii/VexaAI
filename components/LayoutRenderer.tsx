import type { LayoutSection } from "@/lib/layout";

const SectionHero = ({
  title,
  subtitle,
  badge
}: {
  title: string;
  subtitle: string;
  badge?: string;
}) => (
  <section className="card">
    {badge ? <span className="badge">{badge}</span> : null}
    <h2 style={{ marginTop: 12, fontSize: 28 }}>{title}</h2>
    <p className="subtle" style={{ marginTop: 12 }}>
      {subtitle}
    </p>
  </section>
);

const SectionFeatureGrid = ({
  title,
  items
}: {
  title: string;
  items: { title: string; description: string }[];
}) => (
  <section className="card">
    <h3 style={{ fontSize: 20, marginBottom: 16 }}>{title}</h3>
    <div className="grid two">
      {items.map((item) => (
        <div key={item.title} className="card">
          <strong>{item.title}</strong>
          <p className="subtle" style={{ marginTop: 8 }}>
            {item.description}
          </p>
        </div>
      ))}
    </div>
  </section>
);

const SectionTips = ({ title, tips }: { title: string; tips: string[] }) => (
  <section className="card">
    <h3 style={{ fontSize: 20, marginBottom: 16 }}>{title}</h3>
    <ul style={{ display: "grid", gap: 10 }}>
      {tips.map((tip) => (
        <li key={tip} className="subtle">
          • {tip}
        </li>
      ))}
    </ul>
  </section>
);

export const LayoutRenderer = ({ sections }: { sections: LayoutSection[] }) => (
  <div className="grid" style={{ marginBottom: 32 }}>
    {sections.map((section) => {
      if (section.type === "hero") {
        return <SectionHero key={section.title} {...section} />;
      }

      if (section.type === "featureGrid") {
        return <SectionFeatureGrid key={section.title} {...section} />;
      }

      if (section.type === "tips") {
        return <SectionTips key={section.title} {...section} />;
      }

      return null;
    })}
  </div>
);
