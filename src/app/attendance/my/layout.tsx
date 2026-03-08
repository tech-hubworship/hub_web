import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 출석·지각비",
  description: "OD 출석 내역 및 지각비 현황",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
