import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "정보 업데이트",
  description: "그룹/다락방 정보 업데이트",
};

export default function Page() {
  return React.createElement(ClientPage);
}

