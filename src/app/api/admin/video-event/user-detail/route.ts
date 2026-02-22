import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { executeSql, escapeSqlString } from "@src/lib/utils/sql";
import { VIDEO_EVENT } from "@src/lib/video-event/constants";
import { getDayNumber } from "@src/lib/video-event/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toDateLiteral(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const url = new URL(req.url);
  const user_id = url.searchParams.get("user_id");
  if (!user_id) {
    return Response.json({ error: "사용자 ID가 필요합니다." }, { status: 400 });
  }

  const startDate = VIDEO_EVENT.BASE_DATE;
  const endDate = VIDEO_EVENT.END_DATE;
  const startDateLiteral = toDateLiteral(startDate);
  const endDateLiteral = toDateLiteral(endDate);
  const tableComments = VIDEO_EVENT.TABLE_COMMENTS;
  const tableAttendance = VIDEO_EVENT.TABLE_ATTENDANCE;
  const eventSlugFilter = ` AND event_slug = '${escapeSqlString(VIDEO_EVENT.EVENT_SLUG)}'`;

  try {
    const escapedUserId = escapeSqlString(user_id);
    const query = `
      WITH date_series AS (
        SELECT 
          generate_series(
            '${startDateLiteral}'::date,
            '${endDateLiteral}'::date,
            '1 day'::interval
          )::date as date
      ),
      all_dates AS (
        SELECT 
          TO_CHAR(date, 'YYYYMMDD') as post_dt,
          (date - '${startDateLiteral}'::date)::integer + 1 as day_number
        FROM date_series
        WHERE (date - '${startDateLiteral}'::date)::integer >= 0
        ORDER BY date ASC
      ),
      user_meditations AS (
        SELECT 
          post_dt,
          content as meditation_content,
          reg_dt as meditation_reg_dt
        FROM ${tableComments}
        WHERE reg_id = '${escapedUserId}'
          AND post_dt >= '${startDate}' AND post_dt <= '${endDate}'${eventSlugFilter}
      ),
      user_attendance AS (
        SELECT 
          post_dt,
          reg_dt as attendance_reg_dt
        FROM ${tableAttendance}
        WHERE user_id = '${escapedUserId}'
          AND post_dt >= '${startDate}' AND post_dt <= '${endDate}'${eventSlugFilter}
      )
      SELECT 
        ad.post_dt as date,
        ad.day_number,
        CASE WHEN um.post_dt IS NOT NULL THEN true ELSE false END as has_meditation,
        um.meditation_content,
        um.meditation_reg_dt,
        CASE WHEN ua.post_dt IS NOT NULL THEN true ELSE false END as has_attendance,
        ua.attendance_reg_dt
      FROM all_dates ad
      LEFT JOIN user_meditations um ON ad.post_dt = um.post_dt
      LEFT JOIN user_attendance ua ON ad.post_dt = ua.post_dt
      ORDER BY ad.post_dt ASC
    `;

    const { data, error } = await executeSql<{
      date: string;
      day_number: number;
      has_meditation: boolean;
      meditation_content: string | null;
      meditation_reg_dt: string | null;
      has_attendance: boolean;
      attendance_reg_dt: string | null;
    }>(query);

    if (error) {
      console.error("사용자 상세 정보 조회 오류:", error);
      return Response.json(
        { error: "사용자 상세 정보 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const userInfoQuery = `
      SELECT 
        p.user_id,
        p.name,
        p.email,
        COALESCE(g.name, '') as group_name,
        COALESCE(c.name, '') as cell_name
      FROM profiles p
      LEFT JOIN hub_groups g ON p.group_id = g.id
      LEFT JOIN hub_cells c ON p.cell_id = c.id
      WHERE p.user_id = '${escapedUserId}'
    `;

    const { data: userInfo, error: userInfoError } = await executeSql<{
      user_id: string;
      name: string;
      email: string;
      group_name: string;
      cell_name: string;
    }>(userInfoQuery);

    if (userInfoError) {
      console.error("사용자 정보 조회 오류:", userInfoError);
    }

    // 사순절: 일요일은 일수에 넣지 않음 (day_number는 getDayNumber로 통일)
    const details = (data || []).map((row) => ({
      ...row,
      day_number: getDayNumber(row.date) ?? row.day_number,
    }));

    return Response.json(
      { user_info: userInfo?.[0] || null, details },
      { status: 200 }
    );
  } catch (err) {
    console.error("사용자 상세 정보 조회 오류:", err);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
