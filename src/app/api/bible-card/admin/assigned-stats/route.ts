import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 완료 관리 페이지용: 배정됨 수, 배정됨+말씀입력 수 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return Response.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const [assignedCount, assignedWithVerseCount] = await Promise.all([
      supabaseAdmin
        .from("bible_card_applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "assigned")
        .then(({ count }) => count ?? 0),
      supabaseAdmin
        .from("bible_card_applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "assigned")
        .not("bible_verse", "is", null)
        .neq("bible_verse", "")
        .then(({ count }) => count ?? 0),
    ]);

    return Response.json(
      { assignedCount, assignedWithVerseCount },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in assigned-stats API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}
