"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Database, Headphones, List, LogOut, Moon, Sun, Globe2, PanelLeftClose, PanelLeftOpen, LogIn } from "lucide-react";
import { Brand } from "./brand";
import { useLocale } from "./locale";
import { api, ApiError } from "@/lib/api";

type StaffSession = { username: string; csrf_token: string };

export function Shell({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout?: () => void | Promise<void>;
}) {
  const path = usePathname();
  const { t, language, toggleLanguage } = useLocale();
  const [theme, setTheme] = useState("light");
  const [collapsed, setCollapsed] = useState(false);
  const [session, setSession] = useState<StaffSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [sessionError, setSessionError] = useState("");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    try { setCollapsed(localStorage.getItem("bytevoice-sidebar") === "collapsed"); } catch { /* Storage is optional. */ }
  }, []);
  useEffect(() => {
    setSessionError("");
    if (onLogout) { setCheckingSession(false); return; }
    let active = true;
    setCheckingSession(true);
    api<StaffSession>("/auth/me")
      .then((value) => { if (active) setSession(value); })
      .catch((error) => {
        if (!active) return;
        setSession(null);
        if (!(error instanceof ApiError && error.status === 401)) {
          setSessionError("Session could not be checked. Open Call records to sign in again.");
        }
      })
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, [path, onLogout]);
  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("bytevoice-sidebar", next ? "collapsed" : "expanded"); } catch { /* The control still works without storage. */ }
  }
  async function signOut() {
    setSigningOut(true);
    setSessionError("");
    try {
      if (onLogout) await onLogout();
      else if (session) {
        await api("/auth/logout", { method: "POST", headers: { "X-CSRF-Token": session.csrf_token } });
        setSession(null);
        // A full navigation also clears any protected view held in client state.
        window.location.assign("/portal");
      }
    } catch {
      setSessionError("Could not sign out. Please try again.");
    } finally { setSigningOut(false); }
  }
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
    <div className={`workspace${collapsed ? " sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#main">
        {t("Skip to content")}</a>
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link className="brand" href="/portal" aria-label="ByteVoice">
            <span className="sidebar-brand-full"><Brand /></span>
            <span className="sidebar-brand-mark"><Brand mark /></span>
          </Link>
          <button className="sidebar-collapse" onClick={toggleSidebar} aria-expanded={!collapsed} aria-controls="workspace-nav" aria-label={t(collapsed ? "Expand sidebar" : "Collapse sidebar")} title={t(collapsed ? "Expand sidebar" : "Collapse sidebar")}>
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <nav id="workspace-nav" aria-label={t("Workspace navigation")}>
          {links.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={collapsed ? label : undefined}
              aria-current={path === href ? "page" : undefined}
              className={path === href ? "nav-link active" : "nav-link"}
            >
              <Icon size={18} strokeWidth={1.65} aria-hidden="true" />
              <span className="nav-label">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="locale-toggle nav-link" onClick={toggleLanguage} aria-label={language === "en" ? "বাংলায় দেখুন" : "View in English"} title={language === "en" ? "বাংলায় দেখুন" : "View in English"}>
            <span className="locale-glyph" aria-hidden="true">{language === "en" ? "বাং" : "EN"}</span>
            <span>{language === "en" ? "বাংলা" : "English"}</span>
          </button>
          <button className="theme-toggle nav-link" onClick={toggleTheme} aria-label={t(theme === "light" ? "Switch to dark mode" : "Switch to light mode")} title={t(theme === "light" ? "Switch to dark mode" : "Switch to light mode")}>
            {theme === "light" ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
            <span>{theme === "light" ? t("Dark mode") : t("Light mode")}</span>
          </button>
          <span className="timezone">
            <Globe2 size={14} aria-hidden="true" />
            <span>{t("Bangladesh time")}<strong>{t("Asia/Dhaka · UTC+6")}</strong></span>
          </span>
          {(onLogout || session) ? (
            <button className="nav-link logout-button" onClick={signOut} disabled={signingOut} aria-label={t(signingOut ? "Signing out…" : "Sign out")} title={t("Sign out")}>
              <LogOut size={17} />
              <span>{t(signingOut ? "Signing out…" : "Sign out")}</span></button>
          ) : !checkingSession && (
            <Link className="nav-link session-link" href="/portal" aria-label={t("Sign in")} title={t("Sign in")}><LogIn size={17} /><span>{t("Sign in")}</span></Link>
          )}
        </div>
      </aside>
      {sessionError && <p className="shell-notice error" role="alert">{t(sessionError)}</p>}
      <main id="main" className="main-area">
        {children}
      </main>
    </div>
  );
}
