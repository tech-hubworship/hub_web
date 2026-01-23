import { supabaseAdmin } from "@src/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";

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

  if (!week || (week !== "1" && week !== "2" && week !== "3" && week !== "4")) {
    return Response.json({ error: "올바른 주차를 선택해주세요. (1-4)" }, { status: 400 });
  }

  try {
    const weekNumber = parseInt(week, 10);
    const startDay = (weekNumber - 1) * 7 + 1;
    const endDay = Math.min(weekNumber * 7, 26);

    const { data: attendanceList, error } = await supabaseAdmin
      .from("advent_attendance")
      .select("day_number")
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

