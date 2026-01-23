import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanTimestamp } from "@src/lib/utils/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.email) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { group_id, cell_id, community, name, birth_date, gender } = body ?? {};

  try {
    // 프로필 정보 업데이트 (그룹/셀/커뮤니티)
    const profileDataToUpdate: Record<string, any> = {
      info_last_updated_at: getKoreanTimestamp(),
    };

    if (group_id !== undefined) {
      profileDataToUpdate.group_id = group_id ? parseInt(group_id, 10) : null;
    }
    if (cell_id !== undefined) {
      profileDataToUpdate.cell_id = cell_id ? parseInt(cell_id, 10) : null;
    }
    if (community !== undefined) {
      profileDataToUpdate.community = community || null;
    }
    if (name !== undefined) {
      profileDataToUpdate.name = name || null;
    }
    if (birth_date !== undefined) {
      profileDataToUpdate.birth_date = birth_date || null;
    }
    if (gender !== undefined) {
      profileDataToUpdate.gender = gender || null;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(profileDataToUpdate)
      .eq("user_id", userId)
      .select()
      .single();

    if (profileError) throw profileError;

    return Response.json(
      {
        message: "그룹/다락방 정보가 성공적으로 업데이트되었습니다.",
        profile,
      },
      { status: 200 }
    );
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("프로필 업데이트 오류:", error);
    return Response.json(
      { message: "정보 업데이트 중 오류가 발생했습니다.", details: error?.message },
      { status: 500 }
    );
  }
}

