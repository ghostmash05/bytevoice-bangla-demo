"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLocale } from "./locale";

export function CopyValue({ value, label }: { value: string; label: string }) {
  const { t } = useLocale();
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { setStatus("idle"); }, [value]);
  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try { await navigator.clipboard.writeText(value); setStatus("copied"); }
    catch { setStatus("failed"); }
    timer.current = setTimeout(() => setStatus("idle"), 2500);
  }
  return <span className="copy-value"><button className="copy-button" onClick={copy} aria-label={t(label)} title={t(label)}>{status === "copied" ? <Check size={15} /> : <Copy size={15} />}</button><span role="status" className={status === "failed" ? "copy-feedback error" : "sr-only"}>{status === "copied" ? t("Copied") : status === "failed" ? t("Could not copy. Select and copy the text.") : ""}</span></span>;
}
