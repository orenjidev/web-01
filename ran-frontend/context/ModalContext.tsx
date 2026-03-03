"use client";

import { createContext, useContext, useState } from "react";

export type ModalType = "login" | "register" | "forgot" | null;

interface ModalContextValue {
  modal: ModalType;
  openModal: (m: ModalType) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue>({
  modal: null,
  openModal: () => {},
  closeModal: () => {},
});

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalType>(null);

  return (
    <ModalContext.Provider
      value={{
        modal,
        openModal: (m) => setModal(m),
        closeModal: () => setModal(null),
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
