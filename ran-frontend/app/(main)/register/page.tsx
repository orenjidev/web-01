"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/context/ModalContext";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const { openModal } = useModal();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace("/");
    } else {
      openModal("register");
      router.replace("/");
    }
  }, [loading, user, openModal, router]);

  return null;
}
