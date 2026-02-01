import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "허브 캘린더",
  description: "허브 공동체 일정을 확인할 수 있습니다.",
};

export default function Page() {
  return React.createElement(ClientPage);
}
