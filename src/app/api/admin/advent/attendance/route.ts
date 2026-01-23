import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanTimestamp } from "@src/lib/utils/date";
import { getDayNumber } from "@src/lib/advent/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { user_id, post_dt } = body ?? {};

    if (!user_id || !post_dt) {
      return Response.json({ error: "사용자 ID와 날짜는 필수입니다." }, { status: 400 });
    }

    if (typeof post_dt !== "string" || post_dt.length !== 8) {
      return Response.json(
        { error: "올바른 날짜 형식이 아닙니다. (YYYYMMDD)" },
        { status: 400 }
      );
    }

    const day_number = getDayNumber(post_dt);
    if (!day_number || day_number < 1) {
      return Response.json({ error: "유효한 대림절 날짜가 아닙니다." }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("advent_attendance")
      .select("*")
      .eq("user_id", user_id)
      .eq("post_dt", post_dt)
      .single();

    if (existing) {
      return Response.json(
        { message: "이미 출석 처리되어 있습니다.", attendance: existing },
        { status: 200 }
      );
    }

    const now = getKoreanTimestamp();
    const { data, error } = await supabaseAdmin
      .from("advent_attendance")
      .insert({
        user_id,
        post_dt,
        day_number,
        reg_dt: now,
        mod_dt: now,
      })
      .select()
      .single();

    if (error) {
      console.error("출석 기록 오류:", error);
      return Response.json({ error: "출석 기록에 실패했습니다." }, { status: 500 });
    }

    return Response.json({ attendance: data }, { status: 201 });
  } catch (error) {
    console.error("출석 기록 오류:", error);
    return Response.json({ error: "출석 기록 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const search = url.searchParams.get("search") ?? "";
  const group_id = url.searchParams.get("group_id");
  const cell_id = url.searchParams.get("cell_id");

  if (!date || date.length !== 8) {
    return Response.json({ error: "유효한 날짜가 필요합니다. (YYYYMMDD)" }, { status: 400 });
  }

  try {
    // 1) 묵상 작성자 목록 조회
    const { data: meditationData, error: meditationError } = await supabaseAdmin
      .from("advent_comments")
      .select("reg_id, reg_dt")
      .eq("post_dt", date);

    if (meditationError) {
      console.error("❌ 묵상 조회 오류:", meditationError);
      return Response.json({ error: "묵상 조회 오류" }, { status: 500 });
    }

    const meditationUserIds = Array.from(
      new Set((meditationData || []).map((m: any) => m.reg_id))
    );

    // 2) 출석자 목록 조회
    const { data: attendanceData, error: attendanceError } = await supabaseAdmin
      .from("advent_attendance")
      .select("user_id, reg_dt")
      .eq("post_dt", date);

    if (attendanceError) {
      console.error("❌ 출석 조회 오류:", attendanceError);
      return Response.json({ error: "출석 조회 오류" }, { status: 500 });
    }

    const attendedUserIds = attendanceData?.map((a: any) => a.user_id) ?? [];

    const attendanceMap = new Map<string, string | null>();
    (attendanceData || []).forEach((a: any) => {
      if (a.user_id && a.reg_dt) attendanceMap.set(a.user_id, a.reg_dt);
    });

    // 3) 합치기
    const allUserIds = Array.from(new Set([...meditationUserIds, ...attendedUserIds]));

    if (allUserIds.length === 0) {
      return Response.json(
        {
          date,
          total_users: 0,
          attended: 0,
          meditation_count: 0,
          attendance_rate: 0,
          list: [],
        },
        { status: 200 }
      );
    }

    // 4) profiles + group + cell
    let query = supabaseAdmin
      .from("profiles")
      .select(
        `
        user_id,
        name,
        email,
        group_id,
        cell_id,
        hub_groups:group_id (id, name),
        hub_cells:cell_id (id, name)
      `
      )
      .in("user_id", allUserIds);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (group_id) {
      query = query.eq("group_id", Number(group_id));
    }

    if (cell_id) {
      query = query.eq("cell_id", Number(cell_id));
    }

    const { data: users, error } = await query;

    if (error) {
      console.error("❌ User 조회 오류:", error);
      return Response.json({ error: "사용자 조회 오류" }, { status: 500 });
    }

    const safeUsers = users ?? [];
    const safeMeditation = meditationData ?? [];
    const meditationMap = new Map((safeMeditation as any[]).map((m) => [m.reg_id, m.reg_dt]));

    const list = safeUsers.map((u: any) => {
      const hasMeditation = meditationUserIds.includes(u.user_id);
      const hasAttendance = attendedUserIds.includes(u.user_id);
      const meditationTime = meditationMap.get(u.user_id) || null;
      const attendanceTime = attendanceMap.get(u.user_id) || null;

      return {
        user_id: u.user_id,
        name: u.name,
        email: u.email,
        hub_groups: u.hub_groups || null,
        hub_cells: u.hub_cells || null,
        has_meditation: hasMeditation,
        attended: hasAttendance,
        meditation_created_at: meditationTime,
        attendance_created_at: attendanceTime,
      };
    });

    const total_users = list.length;
    const attended = list.filter((u: any) => u.attended).length;
    const meditation_count = list.filter((u: any) => u.has_meditation).length;
    const attendance_rate = total_users > 0 ? Math.round((attended / total_users) * 100) : 0;

    return Response.json(
      { date, total_users, attended, meditation_count, attendance_rate, list },
      { status: 200 }
    );
  } catch (err) {
    console.error("attendance API error", err);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

