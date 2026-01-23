import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanTimestamp } from "@src/lib/utils/date";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getInquiries() {
  const { data, error } = await supabaseAdmin
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("문의사항 조회 에러:", error);
    return [];
  }

  return data || [];
}

async function createInquiry(data: {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  const { data: newInquiry, error } = await supabaseAdmin
    .from("inquiries")
    .insert({
      name: data.name || null,
      email: data.email || null,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
    })
    .select()
    .single();

  if (error) throw error;
  return newInquiry;
}

async function updateInquiryStatus(id: number, status: string) {
  const { data: updatedInquiry, error } = await supabaseAdmin
    .from("inquiries")
    .update({
      status,
      updated_at: getKoreanTimestamp(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return updatedInquiry;
}

export async function GET() {
  try {
    const inquiries = await getInquiries();
    return jsonOk({ success: true, data: inquiries }, 200);
  } catch (error) {
    console.error("Inquiries API error:", error);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const newInquiry = await createInquiry(body as any);
    return jsonOk(
      {
        success: true,
        data: newInquiry,
        message: "문의사항이 성공적으로 등록되었습니다.",
      },
      201
    );
  } catch (error) {
    console.error("Inquiries API error:", error);
    return jsonError("Internal server error", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, status } = body as Record<string, any>;

    if (!id || !status) {
      return jsonOk(
        { success: false, message: "ID와 status가 필요합니다." },
        400
      );
    }

    const updatedInquiry = await updateInquiryStatus(id, status);
    return jsonOk({ success: true, data: updatedInquiry }, 200);
  } catch (error) {
    console.error("Inquiries API error:", error);
    return jsonError("Internal server error", 500);
  }
}

export async function PATCH() {
  return methodNotAllowed(["GET", "POST", "PUT"]);
}

export async function DELETE() {
  return methodNotAllowed(["GET", "POST", "PUT"]);
}

