import React from "react";
import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "분실물 관리",
  description: "분실물 포스트 등록·수정·삭제 (Cloudinary)",
};

export default function Page() {
  return React.createElement(ClientPage);
}
