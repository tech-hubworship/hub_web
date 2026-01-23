import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const folderId = url.searchParams.get("folderId");

  if (!folderId) {
    return Response.json({ error: "폴더 ID가 필요합니다." }, { status: 400 });
  }

  try {
    type FolderRow = { id: number; name: string; parent_id: number | null };
    const path: Array<{ id: number; name: string; parent_id: number | null }> = [];
    let currentId: number | null = parseInt(folderId, 10);

    for (let i = 0; i < 10 && currentId !== null; i++) {
      const { data: folder, error } = await supabaseAdmin
        .from("photo_folders")
        .select("id, name, parent_id")
        .eq("id", currentId)
        .single();

      if (error || !folder) break;
      const row = folder as unknown as FolderRow;

      path.unshift(row);
      currentId = row.parent_id;
    }

    return Response.json({ path }, { status: 200 });
  } catch (error) {
    console.error("Error fetching folder path:", error);
    return Response.json({ error: "폴더 경로 조회 실패" }, { status: 500 });
  }
}

