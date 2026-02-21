import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 기도 기록 단건 삭제 (본인 것만)
 * DELETE /api/prayer-time/[id]
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return Response.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const { data: row, error: findError } = await supabaseAdmin
      .from("prayer_times")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (findError || !row) {
      return Response.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
    }

    if (row.user_id !== session.user.id) {
      return Response.json({ error: "본인 기록만 삭제할 수 있습니다." }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("prayer_times")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting prayer time:", deleteError);
      return Response.json({ error: "삭제에 실패했습니다." }, { status: 500 });
    }

    return Response.json(
      { success: true, message: "삭제되었습니다." },
      { status: 200 }
    );
  } catch (err) {
    console.error("Prayer time delete API error:", err);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
