import { supabaseAdmin } from "@src/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { VIDEO_EVENT } from "@src/lib/video-event/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (req.method !== "GET") {
    return Response.json({ error: "허용되지 않는 메서드입니다." }, { status: 405 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = (session.user as any).id || session.user.email;
  const url = new URL(req.url);
  const week = url.searchParams.get("week");
  const validWeeks = ["1", "2", "3", "4", "5", "6", "7"];
  if (!week || !validWeeks.includes(week)) {
    return Response.json({ error: "올바른 주차를 선택해주세요. (1-7)" }, { status: 400 });
  }
  try {
    const weekNumber = parseInt(week, 10);
    // 사순절 전체 주차: 1주 1-4, 2주 5-10, 3주 11-16, 4주 17-22, 5주 23-28, 6주 29-34, 7주 35-40
    const WEEK_DAY_RANGES: [number, number][] = [[1, 4], [5, 10], [11, 16], [17, 22], [23, 28], [29, 34], [35, 40]];
    const [startDay, endDay] = WEEK_DAY_RANGES[weekNumber - 1] ?? [1, 4];
    const { data: attendanceList, error } = await supabaseAdmin
      .from(VIDEO_EVENT.TABLE_ATTENDANCE)
      .select("day_number")
      .eq("event_slug", VIDEO_EVENT.EVENT_SLUG)
      .eq("user_id", userId)
      .gte("day_number", startDay)
      .lte("day_number", endDay)
      .order("day_number", { ascending: true });
    if (error) {
      console.error("출석 현황 조회 오류:", error);
      return Response.json(
        { error: "출석 현황 조회에 실패했습니다." },
        { status: 500 }
      );
    }
    const attendanceMap: { [day: number]: boolean } = {};
    attendanceList?.forEach((attendance: any) => {
      attendanceMap[attendance.day_number] = true;
    });
    return Response.json(
      { week: weekNumber, attendance: attendanceMap, startDay, endDay },
      { status: 200 }
    );
  } catch (error) {
    console.error("출석 현황 조회 오류:", error);
    return Response.json(
      { error: "출석 현황 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST() {
  return Response.json({ error: "허용되지 않는 메서드입니다." }, { status: 405 });
}
