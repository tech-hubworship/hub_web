import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return Response.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const { groupId, pastorId } = body ?? {};

    if (!groupId) {
      return Response.json({ error: "그룹 ID가 필요합니다." }, { status: 400 });
    }

    if (pastorId) {
      const { data: pastorRoles } = await supabaseAdmin
        .from("admin_roles")
        .select(
          `
          user_id,
          roles!inner(name)
        `
        )
        .eq("user_id", pastorId)
        .eq("roles.name", "목회자");

      if (!pastorRoles || (pastorRoles as any[]).length === 0) {
        return Response.json(
          { error: "목회자 권한이 있는 사용자만 지정할 수 있습니다." },
          { status: 400 }
        );
      }
    }

    const { error } = await supabaseAdmin
      .from("hub_groups")
      .update({ pastor_id: pastorId || null })
      .eq("id", groupId);

    if (error) {
      console.error("Error updating group pastor:", error);
      return Response.json({ error: "목회자 지정 중 오류가 발생했습니다." }, { status: 500 });
    }

    return Response.json(
      { message: pastorId ? "담당 목회자가 지정되었습니다." : "담당 목회자가 해제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in group-pastor API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["PUT"]);
}

