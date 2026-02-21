import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_OD = "OD";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return jsonError("권한이 없습니다.", 403);
  }

  const body = await req.json().catch(() => ({}));
  const { userId, weekDate, category = CATEGORY_OD } = body;

  if (!userId || !weekDate) {
    return jsonError("userId, weekDate가 필요합니다.", 400);
  }

  const baseDate = typeof weekDate === "string" ? weekDate.split("T")[0] : weekDate;

  try {
    const { data: existing, error: findError } = await supabaseAdmin
      .from("weekly_attendance")
      .select("id")
      .eq("user_id", userId)
      .eq("week_date", baseDate)
      .eq("category", category)
      .maybeSingle();

    if (findError) throw findError;
    if (!existing?.id) {
      return jsonError("삭제할 출석 기록이 없습니다.", 404);
    }

    const { error: deleteError } = await supabaseAdmin
      .from("weekly_attendance")
      .delete()
      .eq("id", existing.id);

    if (deleteError) throw deleteError;
    return jsonOk({ message: "출석 기록이 삭제되었습니다." }, 200);
  } catch (e) {
    console.error("Attendance delete error:", e);
    return jsonError(`서버 오류: ${(e as Error)?.message}`, 500);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}
