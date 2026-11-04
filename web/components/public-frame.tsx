"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Brand } from "./brand";
import { useLocale } from "./locale";

export function PublicFrame({ children }: { children: React.ReactNode }) {
  const { t, language, toggleLanguage } = useLocale();
  const path = usePathname();
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.dataset.theme === "dark"); }, []);
  function toggleTheme() {
    const next = !dark;
    setDark(next); document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("bytevoice-theme", next ? "dark" : "light"); } catch { /* Optional preference storage. */ }
  }
  return <div className="public-frame"><a className="skip-link" href="#main">{t("Skip to content")}</a><header className="public-header"><Link href="/try" className="brand" aria-label="ByteVoice"><Brand /></Link><div className="public-controls"><button className="secondary" onClick={toggleLanguage} aria-label={language === "bn" ? "View in English" : "বাংলায় দেখুন"}>{language === "bn" ? "English" : "বাংলা"}</button><button className="secondary" onClick={toggleTheme} aria-label={t(dark ? "Switch to light mode" : "Switch to dark mode")}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>{path !== "/login" && <Link className="text-link" href="/login">{t("Staff sign in")}</Link>}</div></header><main id="main" className="public-main">{children}</main></div>;
}
