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
  const { userId, amount, note, category = CATEGORY_OD } = body;

  if (!userId || typeof userId !== "string") {
    return jsonError("userId가 필요합니다.", 400);
  }
  const amountNum = amount != null ? Number(amount) : 0;
  if (Number.isNaN(amountNum) || amountNum < 0) {
    return jsonError("유효한 금액(0 이상)을 입력해주세요.", 400);
  }

  try {
    const adminName = session?.user?.name || (session?.user as any)?.email || "관리자";

    const { data, error } = await supabaseAdmin
      .from("late_fee_settlements")
      .insert({
        user_id: userId,
        category,
        amount: amountNum,
        note: typeof note === "string" ? note.trim() || null : null,
        settled_by: adminName,
      })
      .select()
      .single();

    if (error) throw error;
    return jsonOk({ message: "정산 기록이 저장되었습니다.", result: data }, 200);
  } catch (error) {
    console.error("Late fee settle error:", error);
    return jsonError(`서버 오류: ${(error as any)?.message}`, 500);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}
