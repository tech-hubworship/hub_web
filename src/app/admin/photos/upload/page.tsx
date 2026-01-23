import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "사진 업로드",
  description: "사진팀 사진 업로드",
};

export default function Page() {
  return React.createElement(ClientPage);
}

