import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 배정됨 + 말씀 입력된 신청들을 일괄 작성완료(completed) 상태로 변경
 */
export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return Response.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { data: toUpdate, error: fetchError } = await supabaseAdmin
      .from("bible_card_applications")
      .select("id")
      .eq("status", "assigned")
      .not("bible_verse", "is", null)
      .neq("bible_verse", "");

    if (fetchError) {
      console.error("Error fetching applications:", fetchError);
      return Response.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!toUpdate || toUpdate.length === 0) {
      return Response.json(
        { message: "작성완료 처리할 신청이 없습니다.", updatedCount: 0 },
        { status: 200 }
      );
    }

    const ids = toUpdate.map((r: { id: number }) => r.id);
    const now = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("bible_card_applications")
      .update({
        status: "completed",
        completed_at: now,
      })
      .in("id", ids);

    if (updateError) {
      console.error("Error bulk updating:", updateError);
      return Response.json({ error: "일괄 처리 중 오류가 발생했습니다." }, { status: 500 });
    }

    return Response.json(
      { message: `${ids.length}건이 작성완료 상태로 변경되었습니다.`, updatedCount: ids.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in bulk-complete API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["PUT"]);
}
