import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Q&A · 내 문의사항",
  description: "제출한 문의사항과 답변을 확인합니다.",
};

export default function QALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
