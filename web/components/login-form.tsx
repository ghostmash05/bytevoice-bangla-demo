"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useLocale } from "./locale";
export function LoginForm({ next, unavailable }: { next: string; unavailable: boolean }) {
  const { t } = useLocale();
  const [username, setUsername] = useState("reviewer");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(unavailable ? "Session service is unavailable. Please try signing in again shortly." : "");
  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { await api("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }); setPassword(""); window.location.assign(next); }
    catch (error) { setError((error as Error).message); setBusy(false); }
  }
  return <div className="login-layout">
    <div className="login-intro">
      <h2>{t("Your clinic’s calls,")}<br /><span>{t("clearly recorded.")}</span></h2>
      <p>{t("Review conversations, patient requests and appointment outcomes in one place.")}</p>
      <div className="login-art" aria-hidden="true"><img src="/landing/reference/glass-flower.webp" alt="" /></div>
    </div>
    <div className="login-entry">
      <form className="login-form" onSubmit={login}>
        <h1>{t("Staff sign in")}</h1>
        <p>{t("Use the reviewer credentials provided with the demo.")}</p>
        <label htmlFor="username">{t("Username")}</label>
        <input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <label htmlFor="password">{t("Password")}</label>
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error" role="alert">{t(error)}</p>}
        <button className="primary" disabled={busy}>{t(busy ? "Signing in…" : "Sign in")}<ArrowRight size={17} aria-hidden="true" /></button>
        <Link href="/" className="text-link"><ArrowLeft size={16} aria-hidden="true" />{t("Back to ByteVoice")}</Link>
      </form>
      <p className="login-demo-note">{t("Assessment demo. Use fictional patient details only.")}</p>
    </div>
  </div>;
}
