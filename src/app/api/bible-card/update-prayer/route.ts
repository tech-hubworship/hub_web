import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => null);
    const prayer_request = body?.prayer_request;

    if (!prayer_request || !String(prayer_request).trim()) {
      return Response.json({ error: "기도제목을 입력해주세요." }, { status: 400 });
    }

    if (String(prayer_request).length > 1000) {
      return Response.json({ error: "기도제목은 1000자 이내로 작성해주세요." }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("bible_card_applications")
      .select("id, status")
      .eq("user_id", userId)
      .single();

    if (fetchError || !existing) {
      return Response.json({ error: "신청 내역을 찾을 수 없습니다." }, { status: 404 });
    }

    if ((existing as any).status !== "pending") {
      return Response.json(
        { error: "목회자 배정이 완료된 후에는 기도제목을 수정할 수 없습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("bible_card_applications")
      .update({
        prayer_request: String(prayer_request).trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("status", "pending")
      .select()
      .single();

    if (error) {
      console.error("Error updating prayer request:", error);
      return Response.json({ error: "기도제목 수정 중 오류가 발생했습니다." }, { status: 500 });
    }

    return Response.json({ message: "기도제목이 수정되었습니다.", data }, { status: 200 });
  } catch (error) {
    console.error("Error in update-prayer API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["PATCH"]);
}

