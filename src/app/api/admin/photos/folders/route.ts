import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function hasProfileAdmin(session: any) {
  if (!session?.user?.id) return false;
  if ((session.user as any)?.isAdmin) return true;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("user_id, status")
    .eq("user_id", session.user.id)
    .eq("status", "관리자")
    .single();

  return !!profile;
}

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

  const url = new URL(req.url);
  const parent_id = url.searchParams.get("parent_id");

  try {
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
        created_by,
        created_at,
        updated_at
      `
      )
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (parent_id === "null" || parent_id === null) {
      query = query.is("parent_id", null);
    } else if (parent_id) {
      query = query.eq("parent_id", parseInt(parent_id, 10));
    }

    const { data, error } = await query;

    if (error) {
      console.error("폴더 조회 실패:", error);
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
          .eq("parent_id", folder.id);

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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { name, description, is_public = true, order_index = 0, parent_id = null } = body ?? {};

  if (!name || String(name).trim() === "") {
    return Response.json({ error: "폴더명은 필수입니다." }, { status: 400 });
  }

  const admin = (await hasProfileAdmin(session)) || (await hasAdminRoles(session));
  if (!admin) {
    return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  if (parent_id) {
    const { data: parentFolder } = await supabaseAdmin
      .from("photo_folders")
      .select("id, parent_id")
      .eq("id", parent_id)
      .single();

    if (!parentFolder) {
      return Response.json({ error: "상위 폴더를 찾을 수 없습니다." }, { status: 400 });
    }

    if ((parentFolder as any).parent_id !== null) {
      return Response.json(
        { error: "폴더는 최대 2뎁스까지만 생성할 수 있습니다." },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from("photo_folders")
    .insert({
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      is_public,
      order_index,
      parent_id,
      created_by: session.user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("폴더 생성 에러:", error);
    return Response.json({ error: "폴더 생성 실패", details: (error as any).message }, { status: 500 });
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

  const admin = await hasAdminRoles(session);
  if (!admin) {
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

  const admin = await hasAdminRoles(session);
  if (!admin) {
    return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { count: photoCount } = await supabaseAdmin
    .from("photos")
    .select("*", { count: "exact", head: true })
    .eq("folder_id", id)
    .eq("is_active", true);

  if (photoCount && photoCount > 0) {
    return Response.json(
      { error: `폴더에 ${photoCount}개의 사진이 있어 삭제할 수 없습니다.` },
      { status: 400 }
    );
  }

  const { count: subfolderCount } = await supabaseAdmin
    .from("photo_folders")
    .select("*", { count: "exact", head: true })
    .eq("parent_id", id);

  if (subfolderCount && subfolderCount > 0) {
    return Response.json(
      { error: `폴더에 ${subfolderCount}개의 하위 폴더가 있어 삭제할 수 없습니다.` },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("photo_folders").delete().eq("id", id);

  if (error) {
    return Response.json({ error: "폴더 삭제에 실패했습니다." }, { status: 500 });
  }

  return Response.json({ message: "폴더가 삭제되었습니다." }, { status: 200 });
}

