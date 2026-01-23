import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "HUB Worship",
  description: "HUB Worship 공동체 웹사이트",
};

export default function Page() {
  return React.createElement(ClientPage);
}

