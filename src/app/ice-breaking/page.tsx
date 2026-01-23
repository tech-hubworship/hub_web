import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "허브 커넥트 플레이",
  description: "허브 공동체를 더 가깝게 이어주는 랜덤 질문 플레이",
};

export default function Page() {
  return React.createElement(ClientPage);
}

