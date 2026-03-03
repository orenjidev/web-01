"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, User, Lock, Hash } from "lucide-react";

import { useModal } from "@/context/ModalContext";
import { useT } from "@/context/LanguageContext";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

async function forgotPassword(data: {
  userid: string;
  pincode: string;
  confirmPincode: string;
  newPassword: string;
  confirmNewPassword: string;
}) {
  if (!API_BASE_URL) throw new Error("API endpoint is not configured");

  const res = await fetch(`${API_BASE_URL}/api/auth/forgotpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok || !json.ok) throw new Error(json.message || "Request failed");

  return json;
}

export default function ForgotPasswordDialog() {
  const { modal, openModal, closeModal } = useModal();
  const t = useT();

  const [userid, setUserid] = useState("");
  const [pincode, setPincode] = useState("");
  const [confirmPincode, setConfirmPincode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setUserid("");
    setPincode("");
    setConfirmPincode("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userid || !pincode || !confirmPincode || !newPassword || !confirmNewPassword) {
      toast.error(t.auth.errors.allRequired);
      return;
    }
    if (pincode !== confirmPincode) { toast.error(t.auth.errors.pincodeMismatch); return; }
    if (newPassword !== confirmNewPassword) { toast.error(t.auth.errors.passwordMismatch); return; }

    setLoading(true);

    try {
      await forgotPassword({ userid, pincode, confirmPincode, newPassword, confirmNewPassword });
      toast.success("Password reset successfully.");
      resetForm();
      setTimeout(() => openModal("login"), 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={modal === "forgot"}
      onOpenChange={(open) => !open && closeModal()}
    >
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="bg-linear-to-br from-sky-900/40 to-stone-900/80 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 border border-sky-500/25">
              <KeyRound className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{t.auth.forgotTitle}</h3>
              <p className="text-xs text-muted-foreground">
                {t.auth.forgotSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
          {/* Username */}
          <div className="grid gap-1.5">
            <Label htmlFor="fp-userid" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.auth.username}
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="fp-userid"
                type="text"
                placeholder="your username"
                required
                value={userid}
                onChange={(e) => setUserid(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>

          {/* Pincode row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="fp-pincode" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.account.pincode}
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="fp-pincode"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fp-confirm-pincode" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.auth.confirmLabel}
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="fp-confirm-pincode"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmPincode}
                  onChange={(e) => setConfirmPincode(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* New password row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="fp-new-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.auth.newPasswordLabel}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="fp-new-password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fp-confirm-new-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.auth.confirmLabel}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="fp-confirm-new-password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-9 gap-2 mt-0.5"
            disabled={loading}
          >
            <KeyRound className="h-3.5 w-3.5" />
            {loading ? t.auth.resetting : t.auth.resetPassword}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {t.auth.rememberPassword}{" "}
            <button
              type="button"
              onClick={() => openModal("login")}
              className="text-primary/80 hover:text-primary hover:underline underline-offset-2 font-medium"
            >
              {t.auth.backToSignIn}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
