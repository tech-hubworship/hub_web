import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "이용약관",
  description: "HUB Worship 서비스 이용약관",
};

export default function Page() {
  return React.createElement(ClientPage);
}

