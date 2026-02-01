import React from "react";
import type { Metadata } from "next";
import ClientPage from "@src/app/calendar/ClientPage";

export const metadata: Metadata = {
  title: "허브 캘린더",
  description: "공동체 일정을 확인하세요",
};

export default function Page() {
  return React.createElement(ClientPage);
}
