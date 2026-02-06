import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "분실물 찾기",
  description: "그날 분실물 사진을 확인하세요",
};

export default function Page() {
  return React.createElement(ClientPage);
}
