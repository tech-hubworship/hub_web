import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// verify-leadership: 직분 구분 없이 "OD 출석 대상(리더십)"으로 명단에 등록하는 단순 흐름.
// (그룹장/다락방장 등 직분/담당 연결·암호 인증은 /update·/myinfo 의 update-profile 에서 처리)
export async function POST(_req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("로그인이 필요합니다.", 401);

  try {
    const userId = session.user.id;

    // 1) 소속(그룹)이 채워져 있는지 확인.
    //    그룹장/교역자처럼 담당 그룹/다락방이 연결돼 있거나 역할이 있는 리더십은
    //    다락방(cell_id)이 없어도 등록을 허용한다. (리더십은 다락방이 없는 게 정상)
    const [
      { data: profile, error: profileError },
      { data: ledGroup },
      { data: ledCell },
      { data: adminRoles },
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("group_id, cell_id")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("hub_groups")
        .select("id")
        .or(`pastor_id.eq.${userId},group_leader_id.eq.${userId}`)
        .maybeSingle(),
      supabaseAdmin
        .from("hub_cells")
        .select("id")
        .eq("cell_leader_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("admin_roles")
        .select("id")
        .eq("user_id", userId)
        .limit(1),
    ]);

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      return jsonError("프로필 조회에 실패했습니다. 관리자에게 문의하세요.", 500);
    }

    const isLeadership =
      !!ledGroup || !!ledCell || (Array.isArray(adminRoles) && adminRoles.length > 0);

    // 그룹은 반드시 있어야 하고, 다락방은 리더십이 아닌 경우에만 필수
    if (!profile?.group_id || (!profile?.cell_id && !isLeadership)) {
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

    // 3) 신규 등록 (직분 플래그는 설정하지 않음 → 관리자/직분 인증에서 별도 처리)
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