import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "사진 관리",
  description: "HUB 사진 관리",
};

export default function Page() {
  return React.createElement(ClientPage);
}

