import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return Response.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const { applicationId, drive_link_1, drive_link_2 } = body ?? {};

    if (!applicationId) {
      return Response.json({ error: "신청 ID가 필요합니다." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("bible_card_applications")
      .update({
        drive_link_1: drive_link_1 || null,
        drive_link_2: drive_link_2 || null,
        links_added_at: new Date().toISOString(),
        status: "delivered",
      })
      .eq("id", applicationId);

    if (error) {
      console.error("Error updating links:", error);
      return Response.json({ error: "링크 저장 중 오류가 발생했습니다." }, { status: 500 });
    }

    return Response.json({ message: "링크가 저장되었습니다." }, { status: 200 });
  } catch (error) {
    console.error("Error in links API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["PUT"]);
}

