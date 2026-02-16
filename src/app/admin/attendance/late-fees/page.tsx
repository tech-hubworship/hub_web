import { redirect } from "next/navigation";

export const metadata = {
  title: "지각비 관리",
  description: "OD 명단 회원별 지각비 현황 및 상세 로그",
};

export default function Page() {
  redirect("/admin?tab=attendance-late-fees");
}
