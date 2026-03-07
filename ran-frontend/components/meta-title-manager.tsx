"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { META_ICON_PATHS } from "@/lib/meta-icon-paths";

function matchesPattern(pathname: string, pattern: string) {
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2);
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  }
  return pathname === pattern;
}

function resolvePathTitle(pathname: string, titleMap: Record<string, string>) {
  const exact = META_ICON_PATHS.find((p) => !p.path.endsWith("/*") && p.path === pathname);
  const exactTitle = exact ? titleMap[exact.path] : "";
  if (exactTitle) return exactTitle;

  const wildcard = META_ICON_PATHS.find((p) => p.path.endsWith("/*") && matchesPattern(pathname, p.path));
  const wildcardTitle = wildcard ? titleMap[wildcard.path] : "";
  if (wildcardTitle) return wildcardTitle;

  return "";
}

export default function MetaTitleManager() {
  const pathname = usePathname();
  const { config } = usePublicConfig();

  useEffect(() => {
    if (!config) return;
    const siteImages = config.siteImages;
    const pathTitleRaw = resolvePathTitle(pathname, siteImages?.metaTitlePerPath ?? {});
    const pathTitle = pathTitleRaw.trim();
    const baseTitle = siteImages?.metaTitle?.trim() || config.serverName || "Ran Online GS";

    // Only override when an explicit per-path title is configured.
    // Otherwise, keep route/layout metadata title as-is.
    if (!pathTitle) return;
    document.title = `${baseTitle} | ${pathTitle}`;
  }, [config, pathname]);

  return null;
}
