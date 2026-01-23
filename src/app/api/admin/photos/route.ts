import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function hasAdminRoles(session: any) {
  if (!session?.user?.id) return false;
  if ((session.user as any)?.isAdmin) return true;

  const roles = session.user.roles || [];
  if (!Array.isArray(roles) || roles.length === 0) return false;

  const { data: adminRoles } = await supabaseAdmin
    .from("admin_roles")
    .select(
      `
      user_id,
      role_id,
      roles!inner (
        id,
        name,
        description
      )
    `
    )
    .eq("user_id", session.user.id)
    .in("roles.name", roles);

  return !!(adminRoles && adminRoles.length > 0);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const folder_id = url.searchParams.get("folder_id");
    const page = url.searchParams.get("page") ?? "1";
    const limit = url.searchParams.get("limit") ?? "20";

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
        is_active,
        created_at,
        photo_folders!inner(id, name)
      `
      )
      .eq("is_active", true);

    if (folder_id) {
      query = query.eq("folder_id", folder_id);
    }

    const offset = (Number(page) - 1) * Number(limit);
    query = query.order("created_at", { ascending: false }).range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      return Response.json({ error: "사진 조회 실패" }, { status: 500 });
    }

    return Response.json(
      {
        photos: data || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          pages: Math.ceil(((count as any) || 0) / Number(limit)),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const ok = await hasAdminRoles(session);
  if (!ok) {
    return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const {
    folder_id,
    title,
    description,
    image_url,
    thumbnail_url,
    file_size,
    width,
    height,
    file_format,
  } = body ?? {};

  if (!folder_id) {
    return Response.json({ error: "폴더 ID는 필수입니다." }, { status: 400 });
  }

  if (!image_url || String(image_url).trim() === "") {
    return Response.json({ error: "사진 링크는 필수입니다." }, { status: 400 });
  }

  try {
    new URL(String(image_url));
  } catch {
    return Response.json({ error: "유효하지 않은 사진 링크입니다." }, { status: 400 });
  }

  const { data: folder } = await supabaseAdmin
    .from("photo_folders")
    .select("id")
    .eq("id", folder_id)
    .single();

  if (!folder) {
    return Response.json({ error: "폴더를 찾을 수 없습니다." }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from("photos")
    .insert({
      folder_id,
      title: title ? String(title).trim() : null,
      description: description ? String(description).trim() : null,
      image_url: String(image_url).trim(),
      thumbnail_url: thumbnail_url ? String(thumbnail_url).trim() : null,
      file_size,
      width,
      height,
      file_format,
      uploaded_by: session.user.id,
    })
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
      is_active,
      created_at,
      photo_folders!inner(id, name)
    `
    )
    .single();

  if (error) {
    return Response.json({ error: "사진 업로드 실패" }, { status: 500 });
  }

  return Response.json({ photo: data }, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const ok = await hasAdminRoles(session);
  if (!ok) {
    return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const {
    id,
    title,
    description,
    image_url,
    thumbnail_url,
    file_size,
    width,
    height,
    file_format,
  } = body ?? {};

  if (!id) {
    return Response.json({ error: "사진 ID는 필수입니다." }, { status: 400 });
  }

  const updateData: any = {};
  if (title !== undefined) updateData.title = title ? String(title).trim() : null;
  if (description !== undefined) updateData.description = description ? String(description).trim() : null;
  if (image_url !== undefined) updateData.image_url = image_url ? String(image_url).trim() : null;
  if (thumbnail_url !== undefined)
    updateData.thumbnail_url = thumbnail_url ? String(thumbnail_url).trim() : null;
  if (file_size !== undefined) updateData.file_size = file_size;
  if (width !== undefined) updateData.width = width;
  if (height !== undefined) updateData.height = height;
  if (file_format !== undefined) updateData.file_format = file_format;

  const { data, error } = await supabaseAdmin
    .from("photos")
    .update(updateData)
    .eq("id", id)
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
      is_active,
      created_at,
      photo_folders!inner(id, name)
    `
    )
    .single();

  if (error) {
    return Response.json({ error: "사진 수정 실패" }, { status: 500 });
  }

  return Response.json({ photo: data }, { status: 200 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const ok = await hasAdminRoles(session);
  if (!ok) {
    return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const ids = body?.ids;

  if (ids && Array.isArray(ids) && ids.length > 0) {
    const { error } = await supabaseAdmin.from("photos").update({ is_active: false }).in("id", ids);

    if (error) {
      console.error("다중 사진 삭제 오류:", error);
      return Response.json({ error: "선택된 사진 삭제에 실패했습니다." }, { status: 500 });
    }

    return Response.json({ message: `${ids.length}개의 사진이 삭제되었습니다.` }, { status: 200 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (id) {
    const { error } = await supabaseAdmin.from("photos").update({ is_active: false }).eq("id", id);

    if (error) {
      console.error("단일 사진 삭제 오류:", error);
      return Response.json({ error: "사진 삭제에 실패했습니다." }, { status: 500 });
    }

    return Response.json({ message: "사진이 삭제되었습니다." }, { status: 200 });
  }

  return Response.json({ error: "허용되지 않는 요청입니다." }, { status: 400 });
}

