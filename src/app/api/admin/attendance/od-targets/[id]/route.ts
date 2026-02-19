import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await params;
  if (!id) return Response.json({ error: "id가 필요합니다." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const { is_group_leader, is_cell_leader } = body;

  const updates: Record<string, boolean> = {};
  if (typeof is_group_leader === "boolean") updates.is_group_leader = is_group_leader;
  if (typeof is_cell_leader === "boolean") updates.is_cell_leader = is_cell_leader;
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "is_group_leader 또는 is_cell_leader가 필요합니다." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("attendance_od_targets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await params;
  if (!id) return Response.json({ error: "id가 필요합니다." }, { status: 400 });

  try {
    const { error } = await supabaseAdmin
      .from("attendance_od_targets")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "삭제 실패" }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["PATCH", "DELETE"]);
}

export async function POST() {
  return methodNotAllowed(["PATCH", "DELETE"]);
}
