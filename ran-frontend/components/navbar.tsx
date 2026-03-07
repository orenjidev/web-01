"use client";

import Link from "next/link";
import Image from "next/image";

import MaxWidthWrapper from "./maxwidthwrapper";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { useLanguage, useT } from "@/context/LanguageContext";

const NavBar = () => {
  const { user, loading, logout } = useAuth();
  const { config } = usePublicConfig();
  const { lang, setLang } = useLanguage();
  const t = useT();

  const navLinkClass =
    "nav-link relative font-medium text-gray-200 hover:text-white " +
    "transition-all duration-200 ease-out " +
    "hover:-translate-y-[1px] " +
    "after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full " +
    "after:origin-left after:scale-x-0 after:bg-white/80 after:transition-transform after:duration-200 after:ease-out " +
    "hover:after:scale-x-100";

  return (
    <header className="sticky top-0 inset-x-0 z-50 bg-black/85">
      <MaxWidthWrapper>
        <div className="border-b border-white/10">
          <div className="relative flex h-24 items-center justify-between">
            {/* Logo */}
            <div className="ml-4 flex lg:ml-0">
              <Link
                href="/"
                className="inline-flex items-center transition-transform duration-200 ease-out hover:scale-105 active:scale-100"
              >
                <Image
                  src={config?.siteImages?.logoUrl || "/images/logo1.png"}
                  width={120}
                  height={120}
                  alt="logo"
                  className="object-contain"
                  unoptimized={!!config?.siteImages?.logoUrl}
                />
              </Link>
            </div>

            {/* Nav links */}
            <nav className="hidden md:flex space-x-6 absolute left-1/2 -translate-x-1/2">
              {/* Public Links */}
              <Link href="/" className={navLinkClass}>{t.nav.news}</Link>
              <Link href="/classes" className={navLinkClass}>{t.nav.classes}</Link>
              <Link href="/download" className={navLinkClass}>{t.nav.download}</Link>
              <Link href="/rankings" className={navLinkClass}>{t.nav.rankings}</Link>

              {/* Auth Only Links */}
              {!loading && user && config?.shop?.enabled !== false && (
                <Link href="/itemshop" className={navLinkClass}>{t.nav.itemShop}</Link>
              )}
              {!loading && user && config?.features?.ticketSystem !== false && (
                <Link href="/tickets" className={navLinkClass}>{t.nav.tickets}</Link>
              )}
            </nav>

            {/* Auth Section */}
            <div className="flex items-center gap-2">
              {loading ? null : !user ? (
                <>
                  {/* Language switcher (not logged in) — dropdown for 3+, cycle for 2 */}
                  {(config?.enabledLocales?.length ?? 0) > 1 && (() => {
                    const langs = config!.enabledLocales;
                    const current = langs.find((l) => l.code === lang);
                    const currentDisplay = current?.displayName ?? lang.toUpperCase();

                    if (langs.length === 2) {
                      const next = langs.find((l) => l.code !== lang) ?? langs[0];
                      return (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLang(next.code)}
                          className="text-xs text-gray-300 hover:text-white hover:bg-white/10 px-2"
                          title={`Switch to ${next.displayName}`}
                        >
                          {next.displayName}
                        </Button>
                      );
                    }

                    return (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-300 hover:text-white hover:bg-white/10 px-2 gap-1"
                          >
                            {currentDisplay}
                            <span className="text-[10px] opacity-60">▼</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-30">
                          {langs.map((l) => (
                            <DropdownMenuItem
                              key={l.code}
                              onClick={() => setLang(l.code)}
                              className={l.code === lang ? "font-semibold" : ""}
                            >
                              {l.displayName}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  })()}
                </>
              ) : (
                /* User dropdown — username triggers all options */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm text-gray-200 hover:text-white hover:bg-white/10 gap-1 px-3"
                    >
                      {user.userid}
                      <span className="text-[10px] opacity-60">▼</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-44">
                    {/* Points info */}
                    <div className="px-2 py-1.5 text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between gap-4">
                        <span>{config?.ePointsName ?? "ePoints"}</span>
                        <span className="font-semibold text-foreground tabular-nums">{user.epoint}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>{config?.vPointsName ?? "vPoints"}</span>
                        <span className="font-semibold text-foreground tabular-nums">{user.vpoint}</span>
                      </div>
                    </div>

                    {/* Language switcher */}
                    {(config?.enabledLocales?.length ?? 0) > 1 && (() => {
                      const langs = config!.enabledLocales;
                      return (
                        <>
                          <DropdownMenuSeparator />
                          {langs.map((l) => (
                            <DropdownMenuItem
                              key={l.code}
                              onClick={() => setLang(l.code)}
                              className={l.code === lang ? "font-semibold" : ""}
                            >
                              {l.displayName}
                            </DropdownMenuItem>
                          ))}
                        </>
                      );
                    })()}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                    >
                      {t.nav.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </header>
  );
};

export default NavBar;
