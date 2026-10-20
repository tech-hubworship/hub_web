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
    const userId = session.user.id;

    // 1) 그룹/다락방 소속이 채워져 있는지 확인 (안 B: 소속이 있어야 리더십 등록 허용)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("group_id, cell_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      return jsonError("프로필 조회에 실패했습니다. 관리자에게 문의하세요.", 500);
    }

    if (!profile?.group_id || !profile?.cell_id) {
      // 소속이 비어있으면 먼저 그룹/다락방을 입력받아야 함
      return jsonError("그룹/다락방 정보를 먼저 입력해주세요.", 400, {
        code: "NO_GROUP_CELL",
      });
    }

    // 2) 이미 OD 명단에 등록되어 있는지 확인
    const { data: existing } = await supabaseAdmin
      .from("attendance_od_targets")
      .select("id")
      .eq("user_id", userId)
      .eq("category", "OD")
      .maybeSingle();

    if (existing) {
      return jsonOk(
        { alreadyRegistered: true, message: "이미 리더십으로 등록되어 있습니다." },
        200
      );
    }

    // 3) 신규 등록
    const { error: targetError } = await supabaseAdmin
      .from("attendance_od_targets")
      .upsert(
        {
          category: "OD",
          user_id: userId,
          name: session.user.name || "이름 없음",
          created_by: userId,
        },
        { onConflict: "user_id,category" }
      );

    if (targetError) {
      console.error("OD Target Add Error:", targetError);
      return jsonError("명단 등록에 실패했습니다. 관리자에게 문의하세요.", 500);
    }

    return jsonOk(
      { alreadyRegistered: false, message: "리더십(OD 명단) 등록이 완료되었습니다." },
      200
    );
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