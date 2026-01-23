import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = session.user.id;

    const { data, error } = await supabaseAdmin
      .from("bible_card_applications")
      .select(
        `
        *,
        hub_groups:group_id(id, name),
        hub_cells:cell_id(id, name),
        pastor:assigned_pastor_id(name, email)
      `
      )
      .eq("user_id", userId)
      .single();

    if (error && (error as any).code !== "PGRST116") {
      console.error("Error fetching application:", error);
      return Response.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!data) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select(
          `
          name,
          community,
          group_id,
          cell_id,
          hub_groups:group_id(id, name),
          hub_cells:cell_id(id, name)
        `
        )
        .eq("user_id", userId)
        .single();

      const profileGroups = (profile as any)?.hub_groups;
      const profileCells = (profile as any)?.hub_cells;

      return Response.json(
        {
          hasApplication: false,
          profile: profile
            ? {
                name: (profile as any).name,
                community: (profile as any).community,
                group_id: (profile as any).group_id,
                cell_id: (profile as any).cell_id,
                group_name: profileGroups?.name,
                cell_name: profileCells?.name,
              }
            : null,
        },
        { status: 200 }
      );
    }

    const dataGroups = (data as any).hub_groups;
    const dataCells = (data as any).hub_cells;
    const dataPastor = (data as any).pastor;

    return Response.json(
      {
        hasApplication: true,
        application: {
          ...(data as any),
          group_name: dataGroups?.name,
          cell_name: dataCells?.name,
          pastor_name: dataPastor?.name,
          hub_groups: undefined,
          hub_cells: undefined,
          pastor: undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in my-application API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

