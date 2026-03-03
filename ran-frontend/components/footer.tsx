"use client";

import Link from "next/link";
import { Facebook, MessageCircle, Youtube } from "lucide-react";

import MaxWidthWrapper from "@/components/maxwidthwrapper";
import { useModal } from "@/context/ModalContext";

const GAME_NAME = "RAN Online";
const CURRENT_YEAR = 2026;

const gameLinks = [
  { label: "News", href: "/" },
  { label: "Download", href: "/download" },
  { label: "Rankings", href: "/rankings" },
];

const shopLinks = [
  { label: "Item Shop", href: "/itemshop" },
  { label: "Top-Up", href: "/topup" },
];

const supportLinks = [{ label: "Support Tickets", href: "/tickets" }];

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

  return (
    <footer className="bg-background border-t border-border mt-8">
      <MaxWidthWrapper className="py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col">
            <p className="text-sm font-bold leading-tight">{GAME_NAME}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your adventure awaits. Play free today.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2 mt-4">
              <a
                href="#"
                aria-label="Facebook"
                className="h-8 w-8 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 flex items-center justify-center transition-colors"
              >
                <Facebook className="h-3.5 w-3.5" />
              </a>
              <a
                href="#"
                aria-label="Discord"
                className="h-8 w-8 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 flex items-center justify-center transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="h-8 w-8 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 flex items-center justify-center transition-colors"
              >
                <Youtube className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Game */}
          <FooterLinkGroup heading="Game">
            {gameLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </FooterLinkGroup>

          {/* Shop */}
          <FooterLinkGroup heading="Shop">
            {shopLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </FooterLinkGroup>

          {/* Account */}
          <FooterLinkGroup heading="Account">
            <button
              type="button"
              onClick={() => openModal("login")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              Sign In
            </button>
            <Link
              href="/register"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Register
            </Link>
            <Link
              href="/account"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              My Account
            </Link>
          </FooterLinkGroup>

          {/* Support */}
          <FooterLinkGroup heading="Support">
            {supportLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </FooterLinkGroup>

        </div>
      </MaxWidthWrapper>

      {/* Copyright */}
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {CURRENT_YEAR} {GAME_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
