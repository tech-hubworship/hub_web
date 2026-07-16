import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // birth_date를 null로 초기화 → 다음 로그인 시 isNewUser = true → /signup 플로우
    // (name은 NOT NULL 제약이 있어 null 불가)
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        birth_date: null,
        gender: null,
        community: null,
        group_id: null,
        cell_id: null,
        status: null,
        info_last_updated_at: null,
      })
      .eq("user_id", userId);

    if (error) {
      console.error("계정 초기화 오류:", error);
      return Response.json(
        { message: "탈퇴 처리 중 오류가 발생했습니다.", details: error.message },
        { status: 500 }
      );
    }

    // admin_roles도 제거 (권한 초기화)
    await supabaseAdmin
      .from("admin_roles")
      .delete()
      .eq("user_id", userId);

    return Response.json({ message: "탈퇴가 완료되었습니다." }, { status: 200 });
  } catch (error: any) {
    console.error("탈퇴 처리 예외:", error);
    return Response.json(
      { message: "탈퇴 처리 중 오류가 발생했습니다.", details: error?.message },
      { status: 500 }
    );
  }
}
