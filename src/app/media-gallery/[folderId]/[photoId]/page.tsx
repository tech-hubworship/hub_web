import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "미디어선교 갤러리",
  description: "미디어선교 갤러리 사진",
};

export default function Page() {
  return React.createElement(ClientPage);
}

