"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { bangla } from "@/lib/translations";

type Language = "en" | "bn";
const LocaleContext = createContext({ language: "bn" as Language, toggleLanguage: () => {}, t: (value: string) => bangla[value] || value });
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("bn");
  useEffect(() => {
    try { setLanguage(localStorage.getItem("bytevoice-language") === "en" ? "en" : "bn"); } catch { /* Storage is optional. */ }
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  function toggleLanguage() {
    const next = language === "en" ? "bn" : "en";
    setLanguage(next);
    try { localStorage.setItem("bytevoice-language", next); } catch { /* Storage is optional. */ }
  }
  const t = (value: string) => language === "bn" ? bangla[value] || value : value;
  return <LocaleContext.Provider value={{ language, toggleLanguage, t }}>{children}</LocaleContext.Provider>;
}
export const useLocale = () => useContext(LocaleContext);
