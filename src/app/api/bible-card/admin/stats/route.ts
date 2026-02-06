import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return Response.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // Supabase 1000행 제한 회피: count 쿼리 사용 (head: true는 행을 반환하지 않음)
    const runCount = async (filter?: { column: string; value: string | null }) => {
      let q = supabaseAdmin
        .from("bible_card_applications")
        .select("id", { count: "exact", head: true });
      if (filter) {
        if (filter.value === null) {
          q = q.is(filter.column, null);
        } else {
          q = q.eq(filter.column, filter.value);
        }
      }
      const { count } = await q;
      return count ?? 0;
    };

    const runCountByStatus = async (status: string, filter?: { column: string; value: string | null }) => {
      let q = supabaseAdmin
        .from("bible_card_applications")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      if (filter) {
        if (filter.value === null) {
          q = q.is(filter.column, null);
        } else {
          q = q.eq(filter.column, filter.value);
        }
      }
      const { count } = await q;
      return count ?? 0;
    };

    const [
      total,
      pending,
      assigned,
      completed,
      delivered,
      hubTotal,
      hubPending,
      hubAssigned,
      hubCompleted,
      hubDelivered,
      otherTotal,
      otherPending,
      otherAssigned,
      otherCompleted,
      otherDelivered,
      unspecifiedTotal,
      unspecifiedPending,
      unspecifiedAssigned,
      unspecifiedCompleted,
      unspecifiedDelivered,
    ] = await Promise.all([
      runCount(),
      runCountByStatus("pending"),
      runCountByStatus("assigned"),
      runCountByStatus("completed"),
      runCountByStatus("delivered"),
      runCount({ column: "community", value: "허브" }),
      runCountByStatus("pending", { column: "community", value: "허브" }),
      runCountByStatus("assigned", { column: "community", value: "허브" }),
      runCountByStatus("completed", { column: "community", value: "허브" }),
      runCountByStatus("delivered", { column: "community", value: "허브" }),
      runCount({ column: "community", value: "타공동체" }),
      runCountByStatus("pending", { column: "community", value: "타공동체" }),
      runCountByStatus("assigned", { column: "community", value: "타공동체" }),
      runCountByStatus("completed", { column: "community", value: "타공동체" }),
      runCountByStatus("delivered", { column: "community", value: "타공동체" }),
      runCount({ column: "community", value: null }),
      runCountByStatus("pending", { column: "community", value: null }),
      runCountByStatus("assigned", { column: "community", value: null }),
      runCountByStatus("completed", { column: "community", value: null }),
      runCountByStatus("delivered", { column: "community", value: null }),
    ]);

    const stats = { total, pending, assigned, completed, delivered };

    const communityStats: Record<string, any> = {
      허브: { total: hubTotal, pending: hubPending, assigned: hubAssigned, completed: hubCompleted, delivered: hubDelivered },
      타공동체: { total: otherTotal, pending: otherPending, assigned: otherAssigned, completed: otherCompleted, delivered: otherDelivered },
      미지정: { total: unspecifiedTotal, pending: unspecifiedPending, assigned: unspecifiedAssigned, completed: unspecifiedCompleted, delivered: unspecifiedDelivered },
    };

    // byPastor: 목회자별 통계는 count 쿼리로 구현하려면 목회자 목록 필요 → 기존 로직 유지 (1000행 이하일 때만 정확)
    const { data: byPastor } = await supabaseAdmin
      .from("bible_card_applications")
      .select("status, assigned_pastor_id, pastor:assigned_pastor_id(name)")
      .not("assigned_pastor_id", "is", null)
      .limit(1000);

    const pastorStats: Record<string, any> = {};
    byPastor?.forEach((app: any) => {
      const pastorName = app.pastor?.name || "알수없음";
      const pastorId = app.assigned_pastor_id;
      if (!pastorStats[pastorId]) {
        pastorStats[pastorId] = { name: pastorName, total: 0, assigned: 0, completed: 0, delivered: 0 };
      }
      pastorStats[pastorId].total++;
      if (app.status !== "pending") {
        pastorStats[pastorId][app.status]++;
      }
    });

    return Response.json(
      {
        overall: stats,
        byCommunity: communityStats,
        byPastor: Object.values(pastorStats),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in stats API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

