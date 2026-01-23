import React, { Suspense } from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "이미지 뷰어",
  description: "쿼리 스트링으로 받은 이미지를 보여주고 다운로드할 수 있습니다.",
};

export default function Page() {
  return React.createElement(
    Suspense,
    { fallback: React.createElement("div", null, "로딩 중...") },
    React.createElement(ClientPage)
  );
}

