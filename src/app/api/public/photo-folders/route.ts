import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parent_id = url.searchParams.get("parent_id");

    let query = supabaseAdmin
      .from("photo_folders")
      .select(
        `
        id,
        name,
        description,
        is_public,
        order_index,
        parent_id,
        created_at
      `
      )
      .eq("is_public", true)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (parent_id === "null" || parent_id === null) {
      query = query.is("parent_id", null);
    } else if (parent_id) {
      query = query.eq("parent_id", parseInt(parent_id, 10));
    }

    const { data, error } = await query;

    if (error) {
      console.error("폴더 조회 오류:", error);
      return Response.json({ error: "폴더 조회 실패" }, { status: 500 });
    }

    const foldersWithCount = await Promise.all(
      (data || []).map(async (folder: any) => {
        const { count: photoCount } = await supabaseAdmin
          .from("photos")
          .select("*", { count: "exact", head: true })
          .eq("folder_id", folder.id)
          .eq("is_active", true);

        const { count: subfolderCount } = await supabaseAdmin
          .from("photo_folders")
          .select("*", { count: "exact", head: true })
          .eq("parent_id", folder.id)
          .eq("is_public", true);

        return {
          ...folder,
          photo_count: photoCount || 0,
          subfolder_count: subfolderCount || 0,
        };
      })
    );

    return Response.json({ folders: foldersWithCount }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

