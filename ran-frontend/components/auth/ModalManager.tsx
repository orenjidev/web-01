"use client";

import { useEffect } from "react";
import { useModal } from "@/context/ModalContext";
import { useAuth } from "@/context/AuthContext";
import LoginCard from "@/components/auth/LoginCard";
import RegisterDialog from "@/components/auth/RegisterDialog";
import ForgotPasswordDialog from "@/components/auth/ForgotPasswordDialog";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function LoginModal() {
  const { modal, closeModal } = useModal();
  const { user } = useAuth();

  // Close the modal immediately if the user is already authenticated
  useEffect(() => {
    if (user && modal === "login") closeModal();
  }, [user, modal, closeModal]);

  return (
    <Dialog open={modal === "login" && !user} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Login</DialogTitle>
        </DialogHeader>
        <LoginCard disableRouting={true} className="border-0 rounded-none mb-0" />
      </DialogContent>
    </Dialog>
  );
}

export default function ModalManager() {
  const { modal, closeModal } = useModal();
  const { user } = useAuth();

  // If user is logged in and an auth modal is open, close it
  useEffect(() => {
    if (user && (modal === "login" || modal === "register" || modal === "forgot")) {
      closeModal();
    }
  }, [user, modal, closeModal]);

  return (
    <>
      <LoginModal />
      <RegisterDialog />
      <ForgotPasswordDialog />
    </>
  );
}
