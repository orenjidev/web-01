"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, SupportedLanguage, Translations } from "@/lib/i18n";
import { usePublicConfig } from "@/context/PublicConfigContext";

interface LanguageContextType {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { config } = usePublicConfig();
  const [lang, setLangState] = useState<SupportedLanguage>("en");

  useEffect(() => {
    const stored = localStorage.getItem("ran_lang") as SupportedLanguage | null;
    const serverDefault = (config?.defaultLanguage ?? "en") as SupportedLanguage;
    const resolved = stored && translations[stored] ? stored : serverDefault;
    setLangState(resolved);
  }, [config]);

  function setLang(l: SupportedLanguage) {
    setLangState(l);
    localStorage.setItem("ran_lang", l);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

/** Convenience hook — returns the typed translation object for the current language. */
export function useT() {
  return useLanguage().t;
}
