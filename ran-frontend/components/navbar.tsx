"use client";

import Link from "next/link";
import Image from "next/image";

import MaxWidthWrapper from "./maxwidthwrapper";
import { Button } from "./ui/button";
import { useAuth } from "@/context/AuthContext";
import AccountSection from "./AccountSection";
import LoginDialog from "@/components/auth/LoginDialog";

const NavBar = () => {
  const { user, loading, logout } = useAuth();

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
                  src="/images/logo1.png"
                  width={120}
                  height={120}
                  alt="logo"
                  className="object-contain"
                />
              </Link>
            </div>

            {/* Nav links */}
            <nav className="hidden md:flex space-x-6 absolute left-1/2 -translate-x-1/2">
              {/* Public Links */}
              <Link href="/" className={navLinkClass}>
                News
              </Link>

              <Link href="/download" className={navLinkClass}>
                Download
              </Link>

              <Link href="/rankings" className={navLinkClass}>
                Rankings
              </Link>

              {/* Auth Only Links */}
              {!loading && user && (
                <>
                  <Link href="/itemshop" className={navLinkClass}>
                    Item Shop
                  </Link>

                  <Link href="/tickets" className={navLinkClass}>
                    Ticket
                  </Link>
                </>
              )}
            </nav>

            {/* Auth Section */}
            <div className="space-x-4">
              {loading ? null : !user ? (
                <>
                  {/* <LoginDialog />
                  <Link href="/register">
                    <Button
                      variant="ghost"
                      className="uppercase text-gray-300 hover:text-white hover:bg-white/10"
                    >
                      Register
                    </Button>
                  </Link> */}
                </>
              ) : (
                <div className="flex items-center gap-4">
                  {/* FIX: force vertical centering */}
                  <Link
                    href="/account"
                    className="hidden lg:flex items-center h-16"
                  >
                    <AccountSection />
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="uppercase border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </header>
  );
};

export default NavBar;
