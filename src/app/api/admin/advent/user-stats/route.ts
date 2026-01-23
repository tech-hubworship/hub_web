import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { executeSql } from "@src/lib/utils/sql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const url = new URL(req.url);
  const sortBy = url.searchParams.get("sortBy") ?? "attendance"; // 'attendance' | 'meditation'

  try {
    const query = `
      WITH meditation_counts AS (
        SELECT 
          reg_id as user_id,
          COUNT(*) as total_meditations
        FROM advent_comments
        WHERE post_dt >= '20251130' AND post_dt <= '20251225'
        GROUP BY reg_id
      ),
      attendance_counts AS (
        SELECT 
          user_id,
          COUNT(*) as total_attendance
        FROM advent_attendance
        WHERE post_dt >= '20251130' AND post_dt <= '20251225'
        GROUP BY user_id
      )
      SELECT 
        p.user_id,
        p.name,
        p.email,
        COALESCE(g.name, '') as group_name,
        COALESCE(c.name, '') as cell_name,
        COALESCE(m.total_meditations, 0) as total_meditations,
        COALESCE(a.total_attendance, 0) as total_attendance
      FROM profiles p
      LEFT JOIN meditation_counts m ON p.user_id = m.user_id
      LEFT JOIN attendance_counts a ON p.user_id = a.user_id
      LEFT JOIN hub_groups g ON p.group_id = g.id
      LEFT JOIN hub_cells c ON p.cell_id = c.id
      WHERE (m.total_meditations > 0 OR a.total_attendance > 0)
      ORDER BY 
        ${
          sortBy === "meditation"
            ? "COALESCE(m.total_meditations, 0) DESC, COALESCE(a.total_attendance, 0) DESC"
            : "COALESCE(a.total_attendance, 0) DESC, COALESCE(m.total_meditations, 0) DESC"
        },
        p.name ASC
    `;

    const { data, error } = await executeSql<{
      user_id: string;
      name: string;
      email: string;
      group_name: string;
      cell_name: string;
      total_meditations: number;
      total_attendance: number;
    }>(query);

    if (error) {
      console.error("사용자 통계 조회 오류:", error);
      return Response.json({ error: "사용자 통계 조회에 실패했습니다." }, { status: 500 });
    }

    return Response.json(
      { stats: data || [], total_users: data?.length || 0 },
      { status: 200 }
    );
  } catch (err) {
    console.error("사용자 통계 조회 오류:", err);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

