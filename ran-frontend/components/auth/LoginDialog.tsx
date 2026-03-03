"use client";

import { useModal } from "@/context/ModalContext";
import { Button } from "@/components/ui/button";

export default function LoginDialog() {
  const { openModal } = useModal();

  return (
    <Button className="uppercase text-white" onClick={() => openModal("login")}>
      Sign-In
    </Button>
  );
}
