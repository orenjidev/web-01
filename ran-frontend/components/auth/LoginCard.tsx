"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn, User, Lock } from "lucide-react";

import { loginUser, fetchUserDetails } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { useT } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginCardProps = {
  redirectTo?: string;
  checkSessionRedirectTo?: string;
  disableRouting?: boolean;
  className?: string;
};

export default function LoginCard({
  redirectTo = "/account",
  checkSessionRedirectTo = "/account",
  disableRouting = false,
  className,
}: LoginCardProps) {
  const router = useRouter();
  const { refresh } = useAuth();
  const { openModal } = useModal();
  const t = useT();

  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      if (!localStorage.getItem("has_session")) return;
      try {
        await fetchUserDetails();

        // If already logged in:
        // - state-based mode: do nothing, wrapper will switch
        // - routing mode: redirect to account page
        if (mounted && !disableRouting) {
          router.replace(checkSessionRedirectTo);
        }
      } catch {
        localStorage.removeItem("has_session");
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router, checkSessionRedirectTo, disableRouting]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userid || !password) {
      toast.error(t.auth.errors.enterCredentials);
      return;
    }

    setLoading(true);

    try {
      await loginUser({ userid, password });

      localStorage.setItem("has_session", "1");
      toast.success("Login successful!");

      await refresh(true);

      // If state-based mode, wrapper will show AccountPanel automatically
      if (!disableRouting) {
        router.push(redirectTo);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid username or password";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden mb-4",
        className
      )}
    >
      {/* Header */}
      <div className="bg-linear-to-br from-amber-900/40 to-stone-900/80 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/25">
            <LogIn className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">{t.auth.loginTitle}</h3>
            <p className="text-xs text-muted-foreground">
              {t.auth.loginSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
        <div className="grid gap-1.5">
          <Label
            htmlFor="userid"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {t.auth.username}
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="userid"
              name="userid"
              type="text"
              placeholder={t.auth.usernamePlaceholder}
              required
              value={userid}
              onChange={(e) => setUserid(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t.auth.password}
            </Label>
            <button
              type="button"
              onClick={() => openModal("forgot")}
              className="text-xs text-primary/80 hover:text-primary hover:underline underline-offset-2"
            >
              {t.auth.forgotLink}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-9 gap-2 mt-0.5"
          disabled={loading}
        >
          {loading ? (
            t.auth.signingIn
          ) : (
            <>
              <LogIn className="h-3.5 w-3.5" />
              {t.auth.signIn}
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {t.auth.noAccount}{" "}
          <button
            type="button"
            onClick={() => openModal("register")}
            className="text-primary/80 hover:text-primary hover:underline underline-offset-2 font-medium"
          >
            {t.auth.createOne}
          </button>
        </p>
      </form>
    </div>
  );
}
