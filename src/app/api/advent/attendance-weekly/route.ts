import { supabaseAdmin } from "@src/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = (session.user as any).id || session.user.email;

  try {
    const { data: attendanceList, error } = await supabaseAdmin
      .from("advent_attendance")
      .select("day_number")
      .eq("user_id", userId)
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

    return Response.json({ attendance: attendanceMap }, { status: 200 });
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

