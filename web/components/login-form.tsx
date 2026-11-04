"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
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
  return <div className="login-layout"><div className="login-intro"><ShieldCheck size={30} /><h1>{t("Your clinic’s calls,")}<br />{t("clearly recorded.")}</h1><p>{t("Review conversations, patient requests and appointment outcomes in one place.")}</p><p className="quiet">{t("Assessment demo. Use fictional patient details only.")}</p></div><form className="login-form" onSubmit={login}><h2>{t("Sign in to the workspace")}</h2><p>{t("Use the reviewer credentials provided with the demo.")}</p><label htmlFor="username">{t("Username")}</label><input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required /><label htmlFor="password">{t("Password")}</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />{error && <p className="error" role="alert">{t(error)}</p>}<button className="primary" disabled={busy}>{t(busy ? "Signing in…" : "Sign in")}<ArrowRight size={17} /></button><Link href="/try" className="text-link">{t("Try the Bangla voice demo")}</Link></form></div>;
}
