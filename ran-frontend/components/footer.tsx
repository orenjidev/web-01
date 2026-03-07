"use client";

import Link from "next/link";
import { Facebook, Twitter, Youtube, Twitch, Gamepad2 } from "lucide-react";

import MaxWidthWrapper from "@/components/maxwidthwrapper";
import { useModal } from "@/context/ModalContext";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { useT } from "@/context/LanguageContext";

const CURRENT_YEAR = new Date().getFullYear();

function FooterLinkGroup({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {heading}
      </p>
      <nav className="flex flex-col gap-2">{children}</nav>
    </div>
  );
}

export default function Footer() {
  const { openModal } = useModal();
  const { config } = usePublicConfig();
  const t = useT();

  const serverName = config?.serverName ?? "RAN Online";
  const serverMotto = config?.serverMotto;
  const footerText = config?.footertext;

  const social = config?.gameoptions?.social;
  const socialLinks = social?.enabled
    ? [
        { key: "facebook", href: social.facebook, icon: Facebook, label: "Facebook" },
        { key: "x",        href: social.x,        icon: Twitter,  label: "X / Twitter" },
        { key: "youtube",  href: social.youtube,  icon: Youtube,  label: "YouTube" },
        { key: "twitch",   href: social.twitch,   icon: Twitch,   label: "Twitch" },
        { key: "steam",    href: social.steam,    icon: Gamepad2, label: "Steam" },
      ].filter((s) => !!s.href)
    : [];

  const shopEnabled = config?.shop?.enabled !== false;
  const topUpEnabled = config?.features?.topUp !== false;
  const ticketsEnabled = config?.features?.ticketSystem !== false;

  const linkClass = "text-sm text-muted-foreground hover:text-foreground transition-colors";

  return (
    <footer className="bg-background border-t border-border mt-8">
      <MaxWidthWrapper className="py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col">
            <p className="text-sm font-bold leading-tight">{serverName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {serverMotto || t.footer.tagline}
            </p>

            {/* Social icons */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 mt-4">
                {socialLinks.map(({ key, href, icon: Icon, label }) => (
                  <a
                    key={key}
                    href={href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="h-8 w-8 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 flex items-center justify-center transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Game */}
          <FooterLinkGroup heading={t.footer.game}>
            <Link href="/" className={linkClass}>{t.nav.news}</Link>
            <Link href="/classes" className={linkClass}>{t.nav.classes}</Link>
            <Link href="/download" className={linkClass}>{t.nav.download}</Link>
            <Link href="/rankings" className={linkClass}>{t.nav.rankings}</Link>
          </FooterLinkGroup>

          {/* Shop */}
          <FooterLinkGroup heading={t.footer.shop}>
            {shopEnabled && <Link href="/itemshop" className={linkClass}>{t.nav.itemShop}</Link>}
            {topUpEnabled && <Link href="/topup" className={linkClass}>{t.footer.topUp}</Link>}
          </FooterLinkGroup>

          {/* Account */}
          <FooterLinkGroup heading={t.footer.account}>
            <button type="button" onClick={() => openModal("login")} className={`${linkClass} text-left`}>
              {t.footer.signIn}
            </button>
            <Link href="/register" className={linkClass}>{t.nav.register}</Link>
            <Link href="/account" className={linkClass}>{t.footer.myAccount}</Link>
          </FooterLinkGroup>

          {/* Support */}
          <FooterLinkGroup heading={t.footer.support}>
            {ticketsEnabled && <Link href="/tickets" className={linkClass}>{t.footer.supportTickets}</Link>}
          </FooterLinkGroup>

        </div>
      </MaxWidthWrapper>

      {/* Copyright */}
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        {footerText || `© ${CURRENT_YEAR} ${serverName}. ${t.footer.rights}`}
      </div>
    </footer>
  );
}
