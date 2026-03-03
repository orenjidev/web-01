import { en } from "./locales/en";
import { th } from "./locales/th";

export type SupportedLanguage = "en" | "th";
export type Translations = typeof en;

export const translations: Record<SupportedLanguage, Translations> = { en, th };
