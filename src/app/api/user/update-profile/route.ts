import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanTimestamp } from "@src/lib/utils/date";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PASSWORD_ENV_MAP: { [key: string]: string | undefined } = {
  MC: process.env.MC_SIGNUP_PASSWORD,
  다락방장: process.env.CELL_LEADER_SIGNUP_PASSWORD,
  그룹장: process.env.GROUP_LEADER_SIGNUP_PASSWORD,
  목회자: process.env.PASTOR_SIGNUP_PASSWORD,
};

const ALL_ROLES = Object.keys(PASSWORD_ENV_MAP);
const ADMIN_ROLES_IN_DB = ["MC", "목회자"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const userId = session.user.id;
  const body = await req.json().catch(() => ({}));
  const { role, password, ...formData } = body as Record<string, any>;

  try {
    if (role && ALL_ROLES.includes(role)) {
      const correctPassword = PASSWORD_ENV_MAP[role];
      if (!correctPassword) {
        throw new Error(`서버에 ${role} 역할의 비밀번호가 설정되지 않았습니다.`);
      }
      if (password !== correctPassword) {
        return jsonError("암호가 올바르지 않습니다.", 401);
      }
    }

    await supabaseAdmin.from("hub_groups").update({ pastor_id: null }).eq("pastor_id", userId);
    await supabaseAdmin
      .from("hub_groups")
      .update({ group_leader_id: null })
      .eq("group_leader_id", userId);
    await supabaseAdmin.from("hub_cells").update({ cell_leader_id: null }).eq("cell_leader_id", userId);

    const profileDataToUpdate = {
      status: ADMIN_ROLES_IN_DB.includes(role) ? "관리자" : "활성",
      group_id: parseInt(formData.group_id, 10) || null,
      cell_id: parseInt(formData.cell_id, 10) || null,
      info_last_updated_at: getKoreanTimestamp(),
    };
    await supabaseAdmin.from("profiles").update(profileDataToUpdate).eq("user_id", userId);

    if (role === "목회자" && formData.responsible_group_id) {
      await supabaseAdmin
        .from("hub_groups")
        .update({ pastor_id: userId })
        .eq("id", formData.responsible_group_id);
    }
    if (role === "그룹장" && formData.responsible_group_id) {
      await supabaseAdmin
        .from("hub_groups")
        .update({ group_leader_id: userId })
        .eq("id", formData.responsible_group_id);
    }
    if (role === "다락방장" && formData.responsible_cell_id) {
      await supabaseAdmin
        .from("hub_cells")
        .update({ cell_leader_id: userId })
        .eq("id", formData.responsible_cell_id);
    }

    await supabaseAdmin.from("admin_roles").delete().eq("user_id", userId);
    if (role && ALL_ROLES.includes(role)) {
      const { data: roleData } = await supabaseAdmin
        .from("roles")
        .select("id")
        .eq("name", role)
        .single();
      if (roleData) {
        await supabaseAdmin
          .from("admin_roles")
          .insert({ user_id: userId, role_id: (roleData as any).id });
      }
    }

    // 리더십(그룹장/교역자/다락방장/MC)으로 인증한 경우 OD 명단에 자동 등록한다.
    // - 그룹장  → is_group_leader = true
    // - 다락방장 → is_cell_leader = true
    // - 교역자/MC → 둘 다 false (OD 명단에는 포함하되 그룹장/다락방장은 아님)
    if (role && ALL_ROLES.includes(role)) {
      const { error: odError } = await supabaseAdmin
        .from("attendance_od_targets")
        .upsert(
          {
            category: "OD",
            user_id: userId,
            name: session.user.name || "이름 없음",
            created_by: userId,
            is_group_leader: role === "그룹장",
            is_cell_leader: role === "다락방장",
          },
          { onConflict: "user_id,category" }
        );
      if (odError) {
        console.error("OD 명단 자동 등록 실패:", odError);
        // OD 등록 실패는 프로필 저장을 되돌리지 않고 경고만 남긴다.
      }
    }

    return jsonOk({ message: "정보가 성공적으로 업데이트되었습니다." }, 200);
  } catch (error: any) {
    console.error("Error in /api/user/update-profile:", error);
    return jsonError("정보 업데이트 중 오류가 발생했습니다.", 500, {
      details: error?.message,
    });
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

