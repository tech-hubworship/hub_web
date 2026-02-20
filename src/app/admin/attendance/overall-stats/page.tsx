import { redirect } from "next/navigation";

export const metadata = {
  title: "OD 출석 전체 통계",
  description: "기간별 주차 단위 지각비·출석 현황 (엑셀 시트 형식)",
};

export default function Page() {
  redirect("/admin?tab=attendance-overall-stats");
}
