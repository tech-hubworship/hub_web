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
    const { applicationIds, pastorId } = body ?? {};

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return Response.json({ error: "신청 ID가 필요합니다." }, { status: 400 });
    }

    if (!pastorId) {
      return Response.json({ error: "목회자 ID가 필요합니다." }, { status: 400 });
    }

    const { data: pastorRoles } = await supabaseAdmin
      .from("admin_roles")
      .select("roles(name)")
      .eq("user_id", pastorId);

    const hasRole = (pastorRoles as any[])?.some((r: any) => r.roles?.name === "목회자");
    if (!hasRole) {
      return Response.json(
        { error: "목회자 권한이 있는 사용자만 배정할 수 있습니다." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("bible_card_applications")
      .update({
        assigned_pastor_id: pastorId,
        assigned_at: new Date().toISOString(),
        status: "assigned",
      })
      .in("id", applicationIds);

    if (error) {
      console.error("Error assigning pastor:", error);
      return Response.json({ error: "배정 중 오류가 발생했습니다." }, { status: 500 });
    }

    return Response.json(
      { message: `${applicationIds.length}명에게 목회자가 배정되었습니다.` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in assign API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["PUT"]);
}

