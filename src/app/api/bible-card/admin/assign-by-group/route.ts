import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return Response.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { data: groups, error: groupsError } = await supabaseAdmin
      .from("hub_groups")
      .select("id, name, pastor_id")
      .eq("is_active", true)
      .not("pastor_id", "is", null);

    if (groupsError) {
      console.error("Error fetching groups:", groupsError);
      return Response.json({ error: "그룹 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    let totalAssigned = 0;

    for (const group of groups as any[]) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("bible_card_applications")
        .update({
          assigned_pastor_id: group.pastor_id,
          status: "assigned",
          assigned_at: new Date().toISOString(),
        })
        .eq("group_id", group.id)
        .eq("status", "pending")
        .select("id");

      if (updateError) {
        console.error(`Error assigning group ${group.name}:`, updateError);
        continue;
      }

      totalAssigned += (updated as any[])?.length || 0;
    }

    return Response.json(
      {
        success: true,
        message: `${totalAssigned}명이 그룹 담당 목회자에게 배정되었습니다.`,
        assignedCount: totalAssigned,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in assign-by-group API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["PUT"]);
}

