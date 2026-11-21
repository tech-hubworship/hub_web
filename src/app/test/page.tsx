import React, { Suspense } from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "말씀카드 사전 테스트",
  description: "말씀카드 신청 사전 테스트 (MC·목회자·마스터 전용)",
  robots: { index: false, follow: false },
};

export default function Page() {
  return React.createElement(
    Suspense,
    { fallback: React.createElement("div", null, "로딩 중...") },
    React.createElement(ClientPage)
  );
}
