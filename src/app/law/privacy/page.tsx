import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description: "HUB Worship 서비스 개인정보 처리방침",
};

export default function Page() {
  return React.createElement(ClientPage);
}

