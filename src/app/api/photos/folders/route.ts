import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function hasAdminRole(session: any) {
  const roles = session?.user?.roles || [];
  if (!session?.user?.id || !Array.isArray(roles) || roles.length === 0) return false;

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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("photo_folders")
    .select(
      `
      id,
      name,
      description,
      is_public,
      order_index,
      created_at,
      photos(count)
    `
    )
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: "폴더 조회 실패" }, { status: 500 });
  }

  const foldersWithCount =
    (data as any[])?.map((folder: any) => ({
      ...folder,
      photo_count: folder.photos?.[0]?.count || 0,
    })) || [];

  return Response.json({ folders: foldersWithCount }, { status: 200 });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { name, description, is_public = true, order_index = 0 } = body ?? {};

  if (!name || String(name).trim() === "") {
    return Response.json({ error: "폴더명은 필수입니다." }, { status: 400 });
  }

  const ok = await hasAdminRole(session);
  if (!ok) {
    return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("photo_folders")
    .insert({
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      is_public,
      order_index,
      created_by: session.user.id,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: "폴더 생성 실패" }, { status: 500 });
  }

  return Response.json({ folder: data }, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { id, name, description, is_public, order_index } = body ?? {};

  if (!id) {
    return Response.json({ error: "폴더 ID는 필수입니다." }, { status: 400 });
  }
  if (!name || String(name).trim() === "") {
    return Response.json({ error: "폴더명은 필수입니다." }, { status: 400 });
  }

  const ok = await hasAdminRole(session);
  if (!ok) {
    return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("photo_folders")
    .update({
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      is_public,
      order_index,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: "폴더 수정 실패" }, { status: 500 });
  }

  return Response.json({ folder: data }, { status: 200 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return Response.json({ error: "폴더 ID는 필수입니다." }, { status: 400 });
  }

  const ok = await hasAdminRole(session);
  if (!ok) {
    return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { count } = await supabaseAdmin
    .from("photos")
    .select("*", { count: "exact", head: true })
    .eq("folder_id", id);

  if (count && count > 0) {
    return Response.json(
      { error: `폴더에 ${count}개의 사진이 있습니다. 먼저 사진을 삭제해주세요.` },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("photo_folders").delete().eq("id", id);

  if (error) {
    return Response.json({ error: "폴더 삭제 실패" }, { status: 500 });
  }

  return Response.json({ message: "폴더가 삭제되었습니다." }, { status: 200 });
}

