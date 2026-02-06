import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "허브 맛집지도",
  description: "공동체가 추천하는 맛집을 공유하고 함께 식사할 장소를 찾아보세요",
};

export default function Page() {
  return React.createElement(ClientPage);
}
