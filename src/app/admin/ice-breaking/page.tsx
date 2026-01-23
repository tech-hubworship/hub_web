import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "아이스브레이킹 관리",
  description: "아이스브레이킹 질문 관리",
};

export default function Page() {
  return React.createElement(ClientPage);
}

