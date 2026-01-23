import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("hub_groups")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("[API ERROR] Supabase 조회 오류:", error);
      throw error;
    }

    return jsonOk({ success: true, data }, 200);
  } catch (error: any) {
    console.error("[API CRITICAL] /api/signup/groups 처리 중 오류 발생:", error);
    return jsonError("서버 오류가 발생했습니다.", 500, { details: error?.message });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

export async function PUT() {
  return methodNotAllowed(["GET"]);
}

export async function PATCH() {
  return methodNotAllowed(["GET"]);
}

export async function DELETE() {
  return methodNotAllowed(["GET"]);
}

