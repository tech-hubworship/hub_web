import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanTimestamp } from "@src/lib/utils/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function hasAdminAccess(session: any) {
  if (!session?.user?.id) return false;
  if ((session.user as any)?.isAdmin) return true;

  const roles = session.user.roles || [];

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("user_id, status")
    .eq("user_id", session.user.id)
    .eq("status", "관리자")
    .single();

  const isAdmin = !!profile;

  let hasRole = false;
  if (Array.isArray(roles) && roles.length > 0) {
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
    hasRole = !!(adminRoles && adminRoles.length > 0);
  }

  return isAdmin || hasRole;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const ok = await hasAdminAccess(session);
  if (!ok) {
    return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const user_id = url.searchParams.get("user_id");
  const photo_id = url.searchParams.get("photo_id");

  try {
    let query = supabaseAdmin
      .from("photo_reservations")
      .select(
        `
        id,
        photo_id,
        user_id,
        user_name,
        user_email,
        status,
        reservation_date,
        message,
        created_at,
        updated_at,
        photos!inner (
          id,
          title,
          image_url,
          photo_folders!inner (
            id,
            name
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (user_id) query = query.eq("user_id", user_id);
    if (photo_id) query = query.eq("photo_id", photo_id);

    const { data, error } = await query;

    if (error) {
      console.error("예약 조회 오류:", error);
      return Response.json({ error: "예약 조회 실패" }, { status: 500 });
    }

    const rows = data || [];
    const stats = {
      total: rows.length,
      pending: rows.filter((r: any) => r.status === "예약중").length,
      completed: rows.filter((r: any) => r.status === "예약완료").length,
      received: rows.filter((r: any) => r.status === "수령완료").length,
      cancelled: rows.filter((r: any) => r.status === "취소됨").length,
    };

    return Response.json({ reservations: rows, stats }, { status: 200 });
  } catch (error) {
    console.error("예약 조회 오류:", error);
    return Response.json({ error: "예약 조회 실패" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const ok = await hasAdminAccess(session);
  if (!ok) {
    return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { id, status, message } = body ?? {};

  if (!id || !status) {
    return Response.json({ error: "id와 status는 필수입니다." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("photo_reservations")
      .update({ status, message: message || null })
      .eq("id", id)
      .select(
        `
        id,
        photo_id,
        user_id,
        user_name,
        user_email,
        status,
        reservation_date,
        message,
        created_at,
        updated_at,
        photos!inner (
          id,
          title,
          image_url,
          photo_folders!inner (
            id,
            name
          )
        )
      `
      )
      .single();

    if (error) {
      console.error("예약 수정 오류:", error);
      return Response.json({ error: "예약 수정 실패" }, { status: 500 });
    }

    return Response.json(
      { message: "예약 상태가 수정되었습니다.", reservation: data },
      { status: 200 }
    );
  } catch (error) {
    console.error("예약 수정 오류:", error);
    return Response.json({ error: "예약 수정 실패" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const ok = await hasAdminAccess(session);
  if (!ok) {
    return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { reservationIds, status, message } = body ?? {};

  if (!reservationIds || !Array.isArray(reservationIds) || reservationIds.length === 0) {
    return Response.json(
      { error: "reservationIds는 필수이며 배열이어야 합니다." },
      { status: 400 }
    );
  }

  if (!status) {
    return Response.json({ error: "status는 필수입니다." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("photo_reservations")
      .update({
        status,
        message: message || null,
        updated_at: getKoreanTimestamp(),
      })
      .in("id", reservationIds)
      .select(
        `
        id,
        photo_id,
        user_id,
        user_name,
        user_email,
        status,
        reservation_date,
        message,
        created_at,
        updated_at,
        photos!inner (
          id,
          title,
          image_url,
          photo_folders!inner (
            id,
            name
          )
        )
      `
      );

    if (error) {
      console.error("일괄 예약 수정 오류:", error);
      return Response.json({ error: "일괄 예약 수정 실패" }, { status: 500 });
    }

    return Response.json(
      {
        message: `${(data || []).length}개의 예약 상태가 수정되었습니다.`,
        reservations: data || [],
        updatedCount: (data || []).length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("일괄 예약 수정 오류:", error);
    return Response.json({ error: "일괄 예약 수정 실패" }, { status: 500 });
  }
}

