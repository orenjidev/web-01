import type { Metadata } from "next";

/**
 * Single source of truth for all page titles and SEO settings.
 * Each route's layout.tsx imports from here.
 *
 * noindex: true  → tells search engines NOT to index this page
 * noindex: false → page is indexable (default for public pages)
 */
export const PAGE_TITLES: Record<
  string,
  { title: string; noindex?: boolean }
> = {
  // ── Public pages (indexable) ──────────────────────────────
  home:         { title: "Home" },
  rankings:     { title: "Rankings" },
  itemShop:     { title: "Item Shop" },
  download:     { title: "Downloads" },
  news:         { title: "News" },

  // ── Auth pages (no index — thin redirect pages) ───────────
  login:        { title: "Sign In",        noindex: true },
  register:     { title: "Register",       noindex: true },
  forgot:       { title: "Reset Password", noindex: true },

  // ── Private / user pages ──────────────────────────────────
  account:      { title: "My Account",     noindex: true },
  tickets:      { title: "Support",        noindex: true },
  newTicket:    { title: "New Ticket",     noindex: true },
  ticketDetail: { title: "Ticket Details", noindex: true },

  // ── Admin panel ───────────────────────────────────────────
  admin:        { title: "Admin Dashboard", noindex: true },
};

/** Build a Next.js Metadata object for a given page key. */
export function buildMetadata(key: keyof typeof PAGE_TITLES): Metadata {
  const entry = PAGE_TITLES[key];
  return {
    title: entry.title,
    ...(entry.noindex && {
      robots: { index: false, follow: false },
    }),
  };
}
