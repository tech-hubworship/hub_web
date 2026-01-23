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
        id,
        name,
        bible_verse,
        bible_verse_reference,
        pastor_message,
        drive_link_1,
        drive_link_2,
        status,
        completed_at,
        links_added_at,
        pastor:assigned_pastor_id(name)
      `
      )
      .eq("user_id", userId)
      .single();

    if (error && (error as any).code !== "PGRST116") {
      console.error("Error fetching download info:", error);
      return Response.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!data) {
      return Response.json({ error: "신청 내역이 없습니다.", hasApplication: false }, { status: 404 });
    }

    if (!(data as any).drive_link_1 && !(data as any).drive_link_2) {
      return Response.json(
        {
          hasApplication: true,
          hasLinks: false,
          status: (data as any).status,
          message: "아직 말씀카드가 준비되지 않았습니다.",
        },
        { status: 200 }
      );
    }

    const pastorData = (data as any).pastor;

    return Response.json(
      {
        hasApplication: true,
        hasLinks: true,
        data: {
          name: (data as any).name,
          bible_verse: (data as any).bible_verse,
          bible_verse_reference: (data as any).bible_verse_reference,
          pastor_message: (data as any).pastor_message,
          pastor_name: pastorData?.name,
          drive_link_1: (data as any).drive_link_1,
          drive_link_2: (data as any).drive_link_2,
          completed_at: (data as any).completed_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in download API:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}

