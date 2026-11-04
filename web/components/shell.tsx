"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Database, Headphones, List, LogOut, Moon, Sun, Globe2, ChevronRight } from "lucide-react";
import { Brand } from "./brand";
import { useLocale } from "./locale";

export function Shell({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout?: () => void;
}) {
  const path = usePathname();
  const { t, language, toggleLanguage } = useLocale();
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);
  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("bytevoice-theme", next); } catch { /* Theme remains usable without storage. */ }
    setTheme(next);
  }
  const links = [
    { href: "/portal", label: t("Call records"), Icon: List },
    { href: "/try", label: t("Voice test"), Icon: Headphones },
    { href: "/portal/data-model", label: t("Data model"), Icon: Database },
  ];
  return (
    <div className="workspace">
      <a className="skip-link" href="#main">
        {t("Skip to content")}</a>
      <aside className="sidebar">
        <Link className="brand" href="/portal">
          <Brand />
        </Link>
        <div className="clinic-label">
          <span className="clinic-avatar">DC</span>
          <div>{t("Dhaka Dental Care")}<span>{t("Assessment workspace")}</span></div>
          <ChevronRight size={14} aria-hidden="true" />
        </div>
        <nav aria-label={t("Workspace navigation")}>
          {links.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              className={path === href ? "nav-link active" : "nav-link"}
            >
              <Icon size={18} strokeWidth={1.65} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="locale-toggle nav-link" onClick={toggleLanguage} aria-label={language === "en" ? "বাংলায় দেখুন" : "View in English"}>
            <span className="locale-glyph" aria-hidden="true">{language === "en" ? "বাং" : "EN"}</span>
            <span>{language === "en" ? "বাংলা" : "English"}</span>
          </button>
          <button className="theme-toggle nav-link" onClick={toggleTheme} aria-label={t(theme === "light" ? "Switch to dark mode" : "Switch to light mode")}>
            {theme === "light" ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
            <span>{theme === "light" ? t("Dark mode") : t("Light mode")}</span>
          </button>
          <span className="timezone">
            <Globe2 size={14} aria-hidden="true" />
            <span>{t("Bangladesh time")}<strong>{t("Asia/Dhaka · UTC+6")}</strong></span>
          </span>
          {onLogout && (
            <button className="nav-link" onClick={onLogout}>
              <LogOut size={17} />
              {t("Sign out")}</button>
          )}
        </div>
      </aside>
      <main id="main" className="main-area">
        {children}
      </main>
    </div>
  );
}
