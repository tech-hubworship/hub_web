import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id || !session.user?.email || !session.user?.name) {
    return Response.json({ message: "You must be logged in." }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. DB에서 현재 유저의 프로필을 조회합니다.
    // ⭐️ 더 이상 존재하지 않는 'phone_number' 대신, 'birth_date'를 조회합니다.
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("birth_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    let isNewUser = false;

    // 2. 프로필이 없다면, 이 사용자는 최초 로그인입니다.
    if (!profile) {
      const { error: insertError } = await supabaseAdmin.from("profiles").insert({
        user_id: userId,
        name: session.user.name,
        email: session.user.email,
      });
      if (insertError) throw insertError;
      isNewUser = true;
    } else {
      // 'birth_date'가 있는지 여부로 신규 유저를 판단합니다.
      isNewUser = !profile.birth_date;
    }

    // 3. 최종 세션 정보에 isNewUser를 포함하여 반환합니다.
    return Response.json(
      { ...session, user: { ...session.user, isNewUser } },
      { status: 200 }
    );
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("Error in custom session endpoint:", e);
    return Response.json(
      { message: "Internal Server Error", error: e?.message },
      { status: 500 }
    );
  }
}

