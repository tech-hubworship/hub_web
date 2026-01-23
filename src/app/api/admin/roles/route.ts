import { supabaseAdmin } from "@src/lib/supabase";
import { requireAdminSession } from "@src/lib/api/auth";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return jsonError("권한이 없습니다.", 403);

  try {
    const { data: roles, error } = await supabaseAdmin
      .from("roles")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching roles:", error);
      return jsonError("권한 목록을 가져오는 데 실패했습니다.", 500);
    }

    return jsonOk((roles as any[]) || [], 200);
  } catch (error) {
    console.error("Error in roles API:", error);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return jsonError("권한이 없습니다.", 403);

  try {
    const body = await req.json().catch(() => ({}));
    const { name, description } = body as Record<string, any>;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return jsonError("권한 이름은 필수입니다.", 400);
    }

    const { data: role, error } = await supabaseAdmin
      .from("roles")
      .insert({
        name: name.trim(),
        description: typeof description === "string" ? description.trim() || null : null,
      })
      .select()
      .single();

    if (error) {
      if ((error as any).code === "23505") {
        return jsonError("이미 존재하는 권한 이름입니다.", 400);
      }
      console.error("Error creating role:", error);
      return jsonError("권한 생성에 실패했습니다.", 500);
    }

    return jsonOk(role as any, 201);
  } catch (error) {
    console.error("Error in roles API:", error);
    return jsonError("서버 오류가 발생했습니다.", 500);
  }
}

export async function PUT() {
  return methodNotAllowed(["GET", "POST"]);
}

export async function PATCH() {
  return methodNotAllowed(["GET", "POST"]);
}

export async function DELETE() {
  return methodNotAllowed(["GET", "POST"]);
}

