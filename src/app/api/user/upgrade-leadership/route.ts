import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("로그인이 필요합니다.", 401);

  try {
    const { error: targetError } = await supabaseAdmin
      .from("attendance_od_targets")
      .upsert(
        {
          category: "OD",
          user_id: session.user.id,
          name: session.user.name || "이름 없음",
          created_by: session.user.id,
        },
        { onConflict: "user_id,category" }
      );

    if (targetError) {
      console.error("OD Target Add Error:", targetError);
      return jsonError("명단 등록에 실패했습니다. 관리자에게 문의하세요.", 500);
    }

    return jsonOk({ message: "리더십(OD 명단) 등록이 완료되었습니다." }, 200);
  } catch (err) {
    console.error(err);
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