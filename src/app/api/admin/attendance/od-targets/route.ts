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
  const category = url.searchParams.get("category") || "OD";

  try {
    const { data, error } = await supabaseAdmin
      .from("attendance_od_targets")
      .select("id, user_id, name, category")
      .eq("category", category)
      .order("name");

    if (error) throw error;

    return Response.json({ data: data || [] }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "조회 실패" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const { userId, category = "OD", name } = body ?? {};

    if (!userId) {
      return Response.json({ error: "userId가 필요합니다." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("attendance_od_targets")
      .upsert(
        {
          category,
          user_id: userId,
          name: name || null,
          created_by: (session?.user as any)?.id,
        },
        { onConflict: "user_id,category" }
      )
      .select()
      .single();

    if (error) throw error;
    return Response.json({ data }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "추가 실패" }, { status: 500 });
  }
}
