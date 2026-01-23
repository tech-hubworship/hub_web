import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "리더십 인증",
  description: "리더십 권한 인증",
};

export default function Page() {
  return React.createElement(ClientPage);
}

