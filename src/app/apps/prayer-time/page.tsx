import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "기도 시간",
  description: "허브 기도 시간 측정 앱",
};

export default function Page() {
  // Emotion jsxImportSource 이슈로 server 파일은 JSX를 쓰지 않습니다.
  return React.createElement(ClientPage);
}

