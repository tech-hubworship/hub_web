"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

type InquiryModalContextValue = {
  openModal: () => void;
  openRequested: boolean;
  consumeOpenRequest: () => void;
};

const InquiryModalContext = createContext<InquiryModalContextValue | null>(null);

export function InquiryModalProvider({ children }: { children: React.ReactNode }) {
  const [openRequested, setOpenRequested] = useState(false);
  const openModal = useCallback(() => setOpenRequested(true), []);
  const consumeOpenRequest = useCallback(() => setOpenRequested(false), []);
  return (
    <InquiryModalContext.Provider value={{ openModal, openRequested, consumeOpenRequest }}>
      {children}
    </InquiryModalContext.Provider>
  );
}

export function useInquiryModal() {
  const ctx = useContext(InquiryModalContext);
  if (!ctx) return { openModal: () => {}, openRequested: false, consumeOpenRequest: () => {} };
  return ctx;
}
