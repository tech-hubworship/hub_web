import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "앱",
  description: "허브 공동체를 더 가깝게 이어주는 앱",
};

export default function Page() {
  // NOTE: 프로젝트 tsconfig가 jsxImportSource=@emotion/react 이라
  // App Router 서버 컴포넌트에서 JSX를 쓰면 react-server 환경에서 깨질 수 있어
  // server 파일은 createElement로만 구성합니다.
  return React.createElement(ClientPage);
}

