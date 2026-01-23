import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return jsonError("로그인이 필요합니다.", 401);

    const userId = session.user.id;

    const { data, error } = await supabaseAdmin
      .from("tech_inquiries")
      .select("id, message, inquiry_type, status, admin_response, response_at, created_at, page_url")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("문의사항 조회 오류:", error);
      return jsonError("문의사항 조회에 실패했습니다.", 500);
    }

    return jsonOk(
      {
        success: true,
        data:
          data?.map((inquiry: any) => ({
            ...inquiry,
            has_response: !!inquiry.admin_response,
          })) || [],
      },
      200
    );
  } catch (error) {
    console.error("My Inquiries API Error:", error);
    return jsonError("서버 오류가 발생했습니다.", 500);
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

