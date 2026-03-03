"use client";

import { useModal } from "@/context/ModalContext";
import { useT } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";

export default function LoginDialog() {
  const { openModal } = useModal();
  const t = useT();

  return (
    <Button className="uppercase text-white" onClick={() => openModal("login")}>
      {t.auth.signIn}
    </Button>
  );
}
