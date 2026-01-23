import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonError("Unauthorized: No session found", 401);
  }

  const userId = session.user.id;

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(
        `
        name, email, birth_date, gender, community, status,
        hub_groups!fk_group_id ( id, name ),
        hub_cells!fk_cell_id ( id, name )
      `
      )
      .eq("user_id", userId)
      .single();

    if (profileError && (profileError as any).code !== "PGRST116") {
      throw profileError;
    }

    if (!profile) return jsonError("Profile not found", 404);

    const { data: roles } = await supabaseAdmin
      .from("admin_roles")
      .select("roles ( name )")
      .eq("user_id", userId);

    const { data: responsibleGroup } = await supabaseAdmin
      .from("hub_groups")
      .select("id, name")
      .or(`pastor_id.eq.${userId},group_leader_id.eq.${userId}`)
      .maybeSingle();

    const { data: responsibleCell } = await supabaseAdmin
      .from("hub_cells")
      .select("id, name, hub_groups ( id, name )")
      .eq("cell_leader_id", userId)
      .maybeSingle();

    const responseData = {
      name: (profile as any).name,
      email: (profile as any).email,
      birth_date: (profile as any).birth_date,
      gender: (profile as any).gender,
      community: (profile as any).community,
      status: (profile as any).status,

      group_id: ((profile as any).hub_groups as any)?.id || null,
      group_name: ((profile as any).hub_groups as any)?.name || null,

      cell_id: ((profile as any).hub_cells as any)?.id || null,
      cell_name: ((profile as any).hub_cells as any)?.name || null,

      roles: roles?.map((r: any) => (r.roles as any).name) || [],

      responsible_group_id: responsibleGroup?.id || null,
      responsible_group_name: responsibleGroup?.name || null,

      responsible_cell_id: responsibleCell?.id || null,
      responsible_cell_info: responsibleCell
        ? `${(responsibleCell.hub_groups as any)?.name} / ${responsibleCell.name}`
        : null,
    };

    return jsonOk(responseData, 200);
  } catch (error: any) {
    console.error("Error in /api/user/profile:", error);
    return jsonError("Internal Server Error", 500, { details: error?.message });
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

