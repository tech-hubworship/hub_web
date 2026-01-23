import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ folderId: string }> }) {
  const { folderId } = await ctx.params;

  if (!folderId || typeof folderId !== "string") {
    return Response.json({ error: "폴더 ID가 필요합니다." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("photo_folders")
      .select(
        `
        id,
        name,
        description,
        is_public,
        order_index,
        created_at
      `
      )
      .eq("id", folderId)
      .eq("is_public", true)
      .single();

    if (error) {
      console.error("폴더 조회 오류:", error);
      return Response.json({ error: "폴더를 찾을 수 없습니다." }, { status: 404 });
    }

    return Response.json({ folder: data }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

