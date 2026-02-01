import { redirect } from "next/navigation";

export const metadata = {
  title: "OD 명단 관리",
  description: "OD 출석 대상 명단을 등록·수정합니다.",
};

export default function Page() {
  redirect("/admin?tab=attendance-od-roster");
}
