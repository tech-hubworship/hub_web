import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as { isAdmin?: boolean })?.isAdmin) return null;
  return session;
}

/** 전도 질문 목록 조회 (관리자 전용) */
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자 권한이 필요합니다.", 401);

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  let query = supabaseAdmin
    .from("evangelism_questions")
    .select("id, created_at, name, contact, question, status, answer, answered_at")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("전도 질문 목록 조회 오류:", error);
    return jsonError("질문 목록 조회에 실패했습니다.", 500);
  }

  return jsonOk({ success: true, data: data ?? [] }, 200);
}

export function POST() {
  return methodNotAllowed(["GET"]);
}
