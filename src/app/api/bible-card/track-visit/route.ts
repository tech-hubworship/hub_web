import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = session.user.id;

    const { data: application, error: fetchError } = await supabaseAdmin
      .from("bible_card_applications")
      .select("id, visit_count")
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching application:", fetchError);
      return Response.json({ error: "신청 정보 조회 실패" }, { status: 500 });
    }

    if (!application) {
      return Response.json({ error: "신청 내역이 없습니다." }, { status: 404 });
    }

    const currentCount = ((application as any).visit_count as number) || 0;
    const { error: updateError } = await supabaseAdmin
      .from("bible_card_applications")
      .update({ visit_count: currentCount + 1 })
      .eq("id", (application as any).id);

    if (updateError) {
      if ((updateError as any).code === "42703" || (updateError as any).message?.includes("visit_count")) {
        console.warn("visit_count 컬럼이 없습니다. 컬럼을 추가해주세요.");
        return Response.json(
          { success: true, visit_count: 0, warning: "visit_count 컬럼이 없습니다." },
          { status: 200 }
        );
      }
      console.error("Error updating visit count:", updateError);
      return Response.json({ error: "접속 카운트 업데이트 실패" }, { status: 500 });
    }

    return Response.json({ success: true, visit_count: currentCount + 1 }, { status: 200 });
  } catch (error) {
    console.error("Error in track-visit API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}

