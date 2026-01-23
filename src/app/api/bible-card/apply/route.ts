import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => null);
    const { name, birth_date, gender, community, group_id, cell_id, prayer_request } = body ?? {};

    if (!name || !prayer_request) {
      return Response.json({ error: "이름과 기도제목은 필수입니다." }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("bible_card_applications")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      return Response.json({ error: "이미 말씀카드를 신청하셨습니다." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("bible_card_applications")
      .insert({
        user_id: userId,
        name,
        community: community || null,
        group_id: group_id || null,
        cell_id: cell_id || null,
        prayer_request,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating application:", error);
      return Response.json({ error: "신청 중 오류가 발생했습니다." }, { status: 500 });
    }

    const profileUpdate: Record<string, any> = {};
    if (name) profileUpdate.name = name;
    if (birth_date) profileUpdate.birth_date = birth_date;
    if (gender) profileUpdate.gender = gender;
    if (community) profileUpdate.community = community;
    if (group_id) profileUpdate.group_id = group_id;
    if (cell_id) profileUpdate.cell_id = cell_id;

    if (Object.keys(profileUpdate).length > 0) {
      await supabaseAdmin.from("profiles").update(profileUpdate).eq("user_id", userId);
    }

    return Response.json(
      { message: "말씀카드 신청이 완료되었습니다.", data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in apply API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}

