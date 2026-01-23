import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("로그인이 필요합니다.", 401);

  const body = await req.json().catch(() => ({}));
  const { phrase } = body as Record<string, any>;

  if (phrase !== "허브 리더십입니다.") {
    return jsonError("인증 문구가 올바르지 않습니다.", 400);
  }

  try {
    const { data: roleData } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", "리더십")
      .single();

    if (!roleData) return jsonError("시스템에 리더십 역할이 없습니다.", 500);

    const { error } = await supabaseAdmin
      .from("admin_roles")
      .insert({ user_id: session.user.id, role_id: (roleData as any).id })
      .select()
      .single();

    if (error && (error as any).code !== "23505") {
      console.error(error);
      return jsonError("권한 부여 실패", 500);
    }

    return jsonOk({ message: "리더십으로 권한이 설정되었습니다." }, 200);
  } catch (err) {
    return jsonError("Server Error", 500);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}

export async function PUT() {
  return methodNotAllowed(["POST"]);
}

export async function PATCH() {
  return methodNotAllowed(["POST"]);
}

export async function DELETE() {
  return methodNotAllowed(["POST"]);
}

