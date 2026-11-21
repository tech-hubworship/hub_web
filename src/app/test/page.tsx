import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "HUB Worship (테스트)",
  description: "기능 사전 테스트 페이지 (MC·목회자·마스터 전용)",
  robots: { index: false, follow: false },
};

export default function Page() {
  return React.createElement(ClientPage);
}
