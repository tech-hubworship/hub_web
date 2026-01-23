import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("hub_groups")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) throw error;

    return jsonOk((data as any[]) || [], 200);
  } catch (err) {
    console.error("group list error", err);
    return jsonError("그룹 목록 조회 실패", 500);
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

