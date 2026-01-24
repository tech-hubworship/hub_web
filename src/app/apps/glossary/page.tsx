import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "허브 용어사전",
  description: "공동체만의 특별한 용어와 개념을 정리하고 공유하는 사전 서비스",
};

export default function Page() {
  // Emotion jsxImportSource 이슈로 server 파일은 JSX를 쓰지 않습니다.
  return React.createElement(ClientPage);
}
