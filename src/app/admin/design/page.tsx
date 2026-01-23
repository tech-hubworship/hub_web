import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "디자인 관리",
  description: "설문 결과 다운로드 등 디자인팀 관리 기능",
};

export default function Page() {
  return React.createElement(ClientPage);
}

