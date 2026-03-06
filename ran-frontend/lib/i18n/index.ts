import { en } from "./locales/en";
import { th } from "./locales/th";

/** Built-in locales shipped with the frontend. Admin can add more via the DB. */
export type BuiltInLanguage = "en" | "th";
/** Accepts built-in codes + any admin-defined code (e.g. "ph"). */
export type SupportedLanguage = BuiltInLanguage | (string & {});
export type Translations = typeof en;

export const translations: Record<string, Translations> = { en, th };
