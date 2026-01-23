import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "설문",
  description: "설문 제출",
};

export default function Page() {
  return React.createElement(ClientPage);
}

