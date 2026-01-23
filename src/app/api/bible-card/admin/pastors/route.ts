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

    const { data: pastorRoles, error: roleError } = await supabaseAdmin
      .from("admin_roles")
      .select(
        `
        user_id,
        roles!inner(name)
      `
      )
      .eq("roles.name", "목회자");

    if (roleError) {
      console.error("Error fetching pastor roles:", roleError);
      return Response.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!pastorRoles || pastorRoles.length === 0) {
      return Response.json([], { status: 200 });
    }

    const pastorIds = (pastorRoles as any[]).map((r) => r.user_id);

    const { data: pastors, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, email, community")
      .in("user_id", pastorIds)
      .order("name", { ascending: true });

    if (profileError) {
      console.error("Error fetching pastors:", profileError);
      return Response.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    const { data: assignmentCounts } = await supabaseAdmin
      .from("bible_card_applications")
      .select("assigned_pastor_id")
      .in("assigned_pastor_id", pastorIds);

    const countMap: Record<string, number> = {};
    assignmentCounts?.forEach((a: any) => {
      countMap[a.assigned_pastor_id] = (countMap[a.assigned_pastor_id] || 0) + 1;
    });

    const pastorsWithCounts = (pastors as any[])?.map((p: any) => ({
      ...p,
      assigned_count: countMap[p.user_id] || 0,
    }));

    return Response.json(pastorsWithCounts || [], { status: 200 });
  } catch (error) {
    console.error("Error in pastors API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

