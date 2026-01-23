import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const userId = session.user.id;

  try {
    const { data: groupCreationTime, error: groupError } = await supabaseAdmin
      .from("hub_groups")
      .select("created_at")
      .order("id", { ascending: true })
      .limit(1)
      .single();

    if (groupError || !groupCreationTime) {
      return jsonOk({ needsUpdate: false }, 200);
    }
    const groupsLastResetAt = new Date((groupCreationTime as any).created_at);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("info_last_updated_at")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return jsonOk({ needsUpdate: false }, 200);
    }

    const userInfoLastUpdatedAt = new Date((profile as any).info_last_updated_at);
    const needsUpdate = userInfoLastUpdatedAt < groupsLastResetAt;

    return jsonOk({ needsUpdate }, 200);
  } catch (error: any) {
    console.error("Error in /api/user/status:", error);
    return jsonError("사용자 상태 확인 중 오류 발생", 500, { details: error?.message });
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

