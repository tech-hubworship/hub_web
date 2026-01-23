import React, { Suspense } from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "대림절",
  description: "대림절 말씀과 나눔",
};

export default function Page() {
  // Emotion jsxImportSource 이슈로 server 파일은 JSX를 쓰지 않습니다.
  return React.createElement(
    Suspense,
    { fallback: React.createElement("div", null, "로딩 중...") },
    React.createElement(ClientPage)
  );
}

