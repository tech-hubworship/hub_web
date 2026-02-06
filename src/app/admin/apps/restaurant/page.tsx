import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "맛집지도 관리",
  description: "허브 맛집지도 관리",
};

export default function Page() {
  return React.createElement(ClientPage);
}
