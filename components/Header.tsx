import Link from "next/link";

export const Header = ({
  title,
  subtitle
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="header">
    <div>
      <h1>{title}</h1>
      <p className="subtle" style={{ marginTop: 8 }}>
        {subtitle}
      </p>
    </div>
    <nav className="nav">
      <Link href="/" className="button secondary">
        Studio
      </Link>
      <Link href="/admin" className="button secondary">
        Admin
      </Link>
    </nav>
  </div>
);
