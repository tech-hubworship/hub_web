import React, { Suspense } from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "한 영혼을 향한 사랑",
  description:
    "하나님에 대해 궁금했던 이야기와 복음을 천천히 알아가고, 편하게 질문할 수 있는 공간입니다.",
};

export default function Page() {
  // NOTE: tsconfig가 jsxImportSource=@emotion/react 이라 서버 컴포넌트에서
  // JSX를 쓰면 react-server 환경에서 깨질 수 있어 createElement로만 구성합니다.
  return React.createElement(
    Suspense,
    { fallback: React.createElement("div", null, "로딩 중...") },
    React.createElement(ClientPage)
  );
}
