import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userRoles = (session.user as any)?.roles || [];
    if (!userRoles.includes("목회자")) {
      return Response.json({ error: "목회자 권한이 필요합니다." }, { status: 403 });
    }

    const pastorId = session.user.id;
    const body = await req.json().catch(() => null);
    const { applicationId, bible_verse, bible_verse_reference, pastor_message } = body ?? {};

    if (!applicationId) {
      return Response.json({ error: "신청 ID가 필요합니다." }, { status: 400 });
    }

    if (!bible_verse || !bible_verse_reference) {
      return Response.json({ error: "성경 말씀과 구절 참조는 필수입니다." }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("bible_card_applications")
      .select("id, assigned_pastor_id, status")
      .eq("id", applicationId)
      .single();

    if (!existing) {
      return Response.json({ error: "신청을 찾을 수 없습니다." }, { status: 404 });
    }

    if ((existing as any).assigned_pastor_id !== pastorId) {
      return Response.json(
        { error: "본인에게 배정된 지체만 말씀을 입력할 수 있습니다." },
        { status: 403 }
      );
    }

    if ((existing as any).status === "completed" || (existing as any).status === "delivered") {
      return Response.json({ error: "완료된 말씀은 수정할 수 없습니다." }, { status: 403 });
    }

    const updateData: Record<string, any> = {
      bible_verse,
      bible_verse_reference,
      pastor_message: pastor_message || null,
    };

    const { error } = await supabaseAdmin
      .from("bible_card_applications")
      .update(updateData)
      .eq("id", applicationId);

    if (error) {
      console.error("Error completing:", error);
      return Response.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
    }

    return Response.json({ message: "말씀이 저장되었습니다." }, { status: 200 });
  } catch (error) {
    console.error("Error in complete API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["PUT"]);
}

