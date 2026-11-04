"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioLines, Database, Headphones, List, LogOut } from "lucide-react";

export function Shell({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout?: () => void;
}) {
  const path = usePathname();
  const links = [
    { href: "/portal", label: "Call records", Icon: List },
    { href: "/try", label: "Voice test", Icon: Headphones },
    { href: "/portal/data-model", label: "Data model", Icon: Database },
  ];
  return (
    <div className="workspace">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/portal">
          <span className="brand-symbol">
            <AudioLines size={23} />
          </span>
          <span>
            ByteVoice<span className="brand-region">Bangla</span>
          </span>
        </Link>
        <div className="clinic-label">
          Dhaka Dental Care<span>Fictional clinic · Demo workspace</span>
        </div>
        <nav aria-label="Workspace navigation">
          {links.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              className={path === href ? "nav-link active" : "nav-link"}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="timezone">
            All times in Bangladesh
            <br />
            <strong>Asia/Dhaka · UTC+6</strong>
          </span>
          {onLogout && (
            <button className="nav-link" onClick={onLogout}>
              <LogOut size={17} />
              Sign out
            </button>
          )}
        </div>
      </aside>
      <main id="main" className="main-area">
        {children}
      </main>
    </div>
  );
}
