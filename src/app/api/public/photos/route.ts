import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function convertGoogleDriveUrl(url: string) {
  if (!url) return url;
  if (url.includes("drive.google.com/file/d/")) {
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  return url;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const folder_id = url.searchParams.get("folder_id");
  const page = url.searchParams.get("page") ?? "1";
  const limit = url.searchParams.get("limit") ?? "50";

  try {
    let query = supabaseAdmin
      .from("photos")
      .select(
        `
        id,
        title,
        description,
        image_url,
        thumbnail_url,
        file_size,
        width,
        height,
        file_format,
        created_at,
        photo_folders!inner(id, name, is_public)
      `
      )
      .eq("is_active", true)
      .eq("photo_folders.is_public", true);

    if (folder_id) {
      query = query.eq("folder_id", folder_id);
    }

    const offset = (Number(page) - 1) * Number(limit);
    query = query.order("created_at", { ascending: false }).range(offset, offset + Number(limit) - 1);

    const { data, error } = await query;

    if (error) {
      console.error("사진 조회 오류:", error);
      return Response.json({ error: "사진 조회 실패" }, { status: 500 });
    }

    const photosWithConvertedUrls = (data || []).map((photo: any) => ({
      ...photo,
      image_url: convertGoogleDriveUrl(photo.image_url),
      thumbnail_url: photo.thumbnail_url ? convertGoogleDriveUrl(photo.thumbnail_url) : null,
    }));

    return Response.json(
      {
        photos: photosWithConvertedUrls,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: photosWithConvertedUrls.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

