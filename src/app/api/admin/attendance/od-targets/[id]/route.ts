import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  return methodNotAllowed(["DELETE"]);
}

export async function POST() {
  return methodNotAllowed(["DELETE"]);
}
