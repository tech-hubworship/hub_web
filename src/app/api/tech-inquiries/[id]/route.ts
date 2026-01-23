import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanTimestamp } from "@src/lib/utils/date";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseId(id: string) {
  const n = parseInt(id, 10);
  if (Number.isNaN(n)) return null;
  return n;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return null;
  return session;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자 권한이 필요합니다.", 401);

  const { id: idStr } = await ctx.params;
  const id = parseId(idStr);
  if (!id) return jsonError("유효하지 않은 ID입니다.", 400);

  const { data, error } = await supabaseAdmin
    .from("tech_inquiries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("문의사항 조회 오류:", error);
    return jsonError("문의사항을 찾을 수 없습니다.", 404);
  }

  return jsonOk({ success: true, data }, 200);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자 권한이 필요합니다.", 401);

  const { id: idStr } = await ctx.params;
  const id = parseId(idStr);
  if (!id) return jsonError("유효하지 않은 ID입니다.", 400);

  const body = await req.json().catch(() => ({}));
  const { status, adminNote, inquiryType, adminResponse } = body as Record<string, any>;

  const updateData: any = {};

  if (status) {
    if (!["new", "in_progress", "resolved", "closed"].includes(status)) {
      return jsonError("유효하지 않은 상태입니다.", 400);
    }
    updateData.status = status;
    if (status === "resolved") updateData.resolved_at = getKoreanTimestamp();
  }

  if (adminNote !== undefined) updateData.admin_note = adminNote;

  if (adminResponse !== undefined) {
    if (adminResponse && String(adminResponse).trim().length > 5000) {
      return jsonError("피드백은 5000자를 초과할 수 없습니다.", 400);
    }
    updateData.admin_response = adminResponse ? String(adminResponse).trim() : null;
    if (adminResponse && String(adminResponse).trim().length > 0) {
      updateData.response_at = getKoreanTimestamp();
    } else {
      updateData.response_at = null;
    }
  }

  if (inquiryType) {
    if (!["bug", "inquiry", "suggestion", "general"].includes(inquiryType)) {
      return jsonError("유효하지 않은 문의 유형입니다.", 400);
    }
    updateData.inquiry_type = inquiryType;
  }

  if (Object.keys(updateData).length === 0) {
    return jsonError("업데이트할 내용이 없습니다.", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("tech_inquiries")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("문의사항 업데이트 오류:", error);
    return jsonError("문의사항 업데이트에 실패했습니다.", 500);
  }

  return jsonOk(
    { success: true, message: "문의사항이 업데이트되었습니다.", data },
    200
  );
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return jsonError("관리자 권한이 필요합니다.", 401);

  const { id: idStr } = await ctx.params;
  const id = parseId(idStr);
  if (!id) return jsonError("유효하지 않은 ID입니다.", 400);

  const { error } = await supabaseAdmin.from("tech_inquiries").delete().eq("id", id);

  if (error) {
    console.error("문의사항 삭제 오류:", error);
    return jsonError("문의사항 삭제에 실패했습니다.", 500);
  }

  return jsonOk({ success: true, message: "문의사항이 삭제되었습니다." }, 200);
}

export async function POST() {
  return methodNotAllowed(["GET", "PATCH", "DELETE"]);
}

export async function PUT() {
  return methodNotAllowed(["GET", "PATCH", "DELETE"]);
}

