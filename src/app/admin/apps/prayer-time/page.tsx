import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "기도 시간 관리",
  description: "허브 기도 시간 앱 관리",
};

export default function Page() {
  return React.createElement(ClientPage);
}
