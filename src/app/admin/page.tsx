import React, { Suspense } from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "관리자",
  description: "HUB 관리자 페이지",
};

export default function Page() {
  return React.createElement(
    Suspense,
    { fallback: React.createElement("div", null, "로딩 중...") },
    React.createElement(ClientPage)
  );
}

