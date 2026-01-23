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

    const { data: allApplications } = await supabaseAdmin
      .from("bible_card_applications")
      .select("status");

    const stats = {
      total: allApplications?.length || 0,
      pending: allApplications?.filter((a: any) => a.status === "pending").length || 0,
      assigned: allApplications?.filter((a: any) => a.status === "assigned").length || 0,
      completed: allApplications?.filter((a: any) => a.status === "completed").length || 0,
      delivered: allApplications?.filter((a: any) => a.status === "delivered").length || 0,
    };

    const { data: byCommunity } = await supabaseAdmin
      .from("bible_card_applications")
      .select("community, status");

    const communityStats: Record<string, any> = {};
    byCommunity?.forEach((app: any) => {
      const comm = app.community || "미지정";
      if (!communityStats[comm]) {
        communityStats[comm] = { total: 0, pending: 0, assigned: 0, completed: 0, delivered: 0 };
      }
      communityStats[comm].total++;
      communityStats[comm][app.status]++;
    });

    const { data: byPastor } = await supabaseAdmin
      .from("bible_card_applications")
      .select(
        `
        status,
        assigned_pastor_id,
        pastor:assigned_pastor_id(name)
      `
      )
      .not("assigned_pastor_id", "is", null);

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

