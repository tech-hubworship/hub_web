import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "이미지 뷰어",
  description: "경로 파라미터로 받은 이미지를 보여주고 다운로드할 수 있습니다.",
};

export default function Page() {
  return React.createElement(ClientPage);
}

