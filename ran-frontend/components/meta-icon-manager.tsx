"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { META_ICON_PATHS } from "@/lib/meta-icon-paths";

const FALLBACK_ICON = "/favicon.ico";

function applyHeadLink(rel: string, href: string) {
  if (typeof document === "undefined") return;
  const existing = Array.from(
    document.head.querySelectorAll(`link[rel="${rel}"]`),
  ) as HTMLLinkElement[];

  if (existing.length > 0) {
    existing.forEach((link) => {
      link.setAttribute("href", href);
      link.setAttribute("data-meta-icon-managed", "true");
    });
    return;
  }

  const link = document.createElement("link");
  link.setAttribute("rel", rel);
  link.setAttribute("href", href);
  link.setAttribute("data-meta-icon-managed", "true");
  document.head.appendChild(link);
}

function matchesPattern(pathname: string, pattern: string) {
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2);
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  }
  return pathname === pattern;
}

function isPathEnabled(pathname: string, accessMap: Record<string, boolean>) {
  const exact = META_ICON_PATHS.find((p) => !p.path.endsWith("/*") && p.path === pathname);
  if (exact) return accessMap[exact.path] !== false;

  const wildcard = META_ICON_PATHS.find((p) => p.path.endsWith("/*") && matchesPattern(pathname, p.path));
  if (wildcard) return accessMap[wildcard.path] !== false;

  return accessMap["/"] !== false;
}

function resolvePathIcon(pathname: string, iconMap: Record<string, string>) {
  const exact = META_ICON_PATHS.find((p) => !p.path.endsWith("/*") && p.path === pathname);
  const exactIcon = exact ? iconMap[exact.path] : "";
  if (exactIcon) return exactIcon;

  const wildcard = META_ICON_PATHS.find((p) => p.path.endsWith("/*") && matchesPattern(pathname, p.path));
  const wildcardIcon = wildcard ? iconMap[wildcard.path] : "";
  if (wildcardIcon) return wildcardIcon;

  return "";
}

export default function MetaIconManager() {
  const pathname = usePathname();
  const { config } = usePublicConfig();

  useEffect(() => {
    const siteImages = config?.siteImages;
    const allowedByPath = isPathEnabled(pathname, siteImages?.metaIconPaths ?? {});
    const pathIcon = resolvePathIcon(pathname, siteImages?.metaIconPerPath ?? {});
    const globalIcon = siteImages?.metaIconUrl ?? "";

    const href =
      siteImages?.metaIconEnabled && allowedByPath
        ? pathIcon || globalIcon || FALLBACK_ICON
        : FALLBACK_ICON;

    applyHeadLink("icon", href);
    applyHeadLink("shortcut icon", href);
    applyHeadLink("apple-touch-icon", href);
  }, [config, pathname]);

  return null;
}
