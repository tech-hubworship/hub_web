import React, { Suspense } from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "내 문의사항",
  description: "제출한 문의사항과 관리자 피드백을 확인합니다.",
};

export default function Page() {
  return React.createElement(
    Suspense,
    { fallback: React.createElement("div", null, "로딩 중...") },
    React.createElement(ClientPage)
  );
}

