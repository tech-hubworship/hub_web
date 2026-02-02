import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("로그인이 필요합니다.", 401);

  // 🗑️ 기존 인증 문구(phrase) 확인 로직 제거함
  // 별도의 입력값 없이 요청만 오면 바로 권한 부여 진행

  try {
    // 1. '리더십' 역할 ID 조회
    const { data: roleData } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", "리더십")
      .single();

    if (!roleData) return jsonError("시스템에 리더십 역할이 없습니다.", 500);

    // 2. 해당 유저에게 리더십 역할 부여 (admin_roles 테이블)
    const { error } = await supabaseAdmin
      .from("admin_roles")
      .insert({ user_id: session.user.id, role_id: (roleData as any).id })
      .select()
      .single();

    // 이미 권한이 있는 경우(중복 키 에러 23505)도 성공으로 간주
    if (error && (error as any).code !== "23505") {
      console.error(error);
      return jsonError("권한 부여 실패", 500);
    }

    return jsonOk({ message: "리더십 권한이 설정되었습니다." }, 200);
  } catch (err) {
    return jsonError("Server Error", 500);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}