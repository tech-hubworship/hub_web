import React, { Suspense } from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "말씀카드",
  description: "말씀카드 신청",
};

export default function Page() {
  return React.createElement(
    Suspense,
    { fallback: React.createElement("div", null, "로딩 중...") },
    React.createElement(ClientPage)
  );
}

