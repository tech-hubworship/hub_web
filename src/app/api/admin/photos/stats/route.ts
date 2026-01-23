import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const roles = (session?.user as any)?.roles as string[] | undefined;

  if (!session?.user?.id || !roles?.includes("사진팀")) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const { count: photoCount } = await supabaseAdmin
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const { count: folderCount } = await supabaseAdmin
      .from("photo_folders")
      .select("*", { count: "exact", head: true });

    return Response.json(
      {
        photoCount: photoCount || 0,
        folderCount: folderCount || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("콘텐츠 통계 조회 오류:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

