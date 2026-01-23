import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "내 정보",
  description: "내 정보 보기 및 수정",
};

export default function Page() {
  return React.createElement(ClientPage);
}

