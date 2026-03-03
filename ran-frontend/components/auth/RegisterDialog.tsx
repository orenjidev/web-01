"use client";

import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "sonner";
import { UserPlus, User, Mail, Lock, Hash } from "lucide-react";

import { registerUser, type RegisterPayload, type RegisterResponse } from "@/lib/auth";
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

export default function RegisterDialog() {
  const { modal, openModal, closeModal } = useModal();
  const t = useT();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [captchaToken, setCaptchaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Omit<RegisterPayload, "token" | "referrer">>({
    username: "",
    password: "",
    confirm_password: "",
    email: "",
    pincode: "",
    confirm_pincode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      username: "",
      email: "",
      password: "",
      confirm_password: "",
      pincode: "",
      confirm_pincode: "",
    });
    recaptchaRef.current?.reset();
    setCaptchaToken("");
  };

  const validateForm = (f: typeof form): string => {
    if (!/^[a-zA-Z0-9_.-]{4,12}$/.test(f.username))
      return t.auth.errors.usernameFormat;
    if (f.password.length < 4 || f.password.length > 11)
      return t.auth.errors.passwordLength;
    if (f.password !== f.confirm_password) return t.auth.errors.passwordMismatch;
    if (f.pincode.length < 4 || f.pincode.length > 11)
      return t.auth.errors.pincodeLength;
    if (f.pincode !== f.confirm_pincode) return t.auth.errors.pincodeMismatch;
    return "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const err = validateForm(form);
    if (err) { toast.error(err); return; }

    if (!captchaToken) {
      toast.error(t.auth.errors.captchaRequired);
      return;
    }

    setLoading(true);

    const payload: RegisterPayload = { ...form, token: captchaToken, referrer: "" };

    const res: RegisterResponse = await registerUser(payload, () => {
      recaptchaRef.current?.reset();
      setCaptchaToken("");
    });

    setLoading(false);

    if (res.success) {
      toast.success(res.message || "Account created! You can now sign in.");
      resetForm();
      setTimeout(() => openModal("login"), 1200);
    } else {
      toast.error(res.message || "Registration failed.");
    }
  };

  return (
    <Dialog
      open={modal === "register"}
      onOpenChange={(open) => !open && closeModal()}
    >
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Create Account</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="bg-linear-to-br from-emerald-900/40 to-stone-900/80 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/25">
              <UserPlus className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{t.auth.registerTitle}</h3>
              <p className="text-xs text-muted-foreground">
                {t.auth.registerSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="overflow-y-auto max-h-[70vh]">
          <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
            {/* Username */}
            <div className="grid gap-1.5">
              <Label htmlFor="reg-username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.auth.username}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="reg-username"
                  name="username"
                  placeholder={t.auth.usernameHint}
                  required
                  value={form.username}
                  onChange={handleChange}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div className="grid gap-1.5">
              <Label htmlFor="reg-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.account.email}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            {/* Password row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="reg-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.auth.password}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="reg-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={form.password}
                    onChange={handleChange}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="reg-confirm-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.auth.confirmLabel}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="reg-confirm-password"
                    name="confirm_password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={form.confirm_password}
                    onChange={handleChange}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Pincode row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="reg-pincode" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.account.pincode}
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="reg-pincode"
                    name="pincode"
                    type="password"
                    placeholder={t.auth.pincodeHint}
                    required
                    value={form.pincode}
                    onChange={handleChange}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="reg-confirm-pincode" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.auth.confirmLabel}
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="reg-confirm-pincode"
                    name="confirm_pincode"
                    type="password"
                    placeholder={t.auth.pincodeHint}
                    required
                    value={form.confirm_pincode}
                    onChange={handleChange}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* reCAPTCHA */}
            <div className="flex justify-center pt-1">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                onChange={(token) => setCaptchaToken(token || "")}
                theme="dark"
              />
            </div>

            <p className="text-xs text-center text-muted-foreground">
              {t.auth.termsText}{" "}
              <a href="#" className="underline underline-offset-2">{t.auth.termsLink}</a>
            </p>

            <Button type="submit" className="w-full h-9 gap-2" disabled={loading}>
              <UserPlus className="h-3.5 w-3.5" />
              {loading ? t.auth.creatingAccount : t.auth.createAccount}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {t.auth.alreadyHaveAccount}{" "}
              <button
                type="button"
                onClick={() => openModal("login")}
                className="text-primary/80 hover:text-primary hover:underline underline-offset-2 font-medium"
              >
                {t.auth.signIn}
              </button>
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
