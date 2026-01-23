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

    const { data: groups, error } = await supabaseAdmin
      .from("hub_groups")
      .select(
        `
        id,
        name,
        pastor_id,
        pastor:pastor_id(user_id, name, email)
      `
      )
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching groups:", error);
      return Response.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    const result = (groups || []).map((group: any) => ({
      id: group.id,
      name: group.name,
      pastor_id: group.pastor_id,
      pastor_name: group.pastor?.name || null,
      pastor_email: group.pastor?.email || null,
    }));

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("Error in groups-with-pastors API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

