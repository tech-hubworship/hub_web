import { redirect } from "next/navigation";

export const metadata = {
  title: "캘린더 관리",
  description: "일정 등록·수정·삭제 등 캘린더 관리",
};

export default function Page() {
  redirect("/admin?tab=calendar");
}
