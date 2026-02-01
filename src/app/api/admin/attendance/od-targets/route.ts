import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const url = new URL(req.url);
  const weekDate = url.searchParams.get("week_date");
  const category = url.searchParams.get("category") || "OD";

  if (!weekDate) {
    return Response.json({ error: "week_date가 필요합니다." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("attendance_od_targets")
      .select("id, user_id, name, week_date, category")
      .eq("week_date", weekDate)
      .eq("category", category)
      .order("name");

    if (error) throw error;

    return Response.json({ data: data || [] }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "조회 실패" }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}
