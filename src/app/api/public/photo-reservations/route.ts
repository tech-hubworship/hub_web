import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const photo_id = url.searchParams.get("photo_id");
  const user_id = url.searchParams.get("user_id");

  try {
    let query: any;

    if (photo_id) {
      query = supabaseAdmin
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
          updated_at
        `
        )
        .eq("photo_id", photo_id)
        .in("status", ["예약중", "예약완료", "수령완료"])
        .order("created_at", { ascending: false })
        .maybeSingle();
    } else if (user_id) {
      query = supabaseAdmin
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
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });
    } else {
      return Response.json({ error: "photo_id 또는 user_id가 필요합니다." }, { status: 400 });
    }

    const { data, error } = await query;

    if (error) {
      console.error("예약 조회 오류:", error);
      return Response.json({ error: "예약 조회 실패" }, { status: 500 });
    }

    const responseData = photo_id ? (data ? [data] : []) : data || [];
    return Response.json({ reservations: responseData }, { status: 200 });
  } catch (error) {
    console.error("예약 조회 오류:", error);
    return Response.json({ error: "예약 조회 실패" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { photo_id, user_id, user_name, user_email, message } = body ?? {};

  if (!photo_id || !user_id) {
    return Response.json({ error: "photo_id와 user_id는 필수입니다." }, { status: 400 });
  }

  try {
    const { data: existingUserReservation } = await supabaseAdmin
      .from("photo_reservations")
      .select("id, status")
      .eq("photo_id", photo_id)
      .eq("user_id", user_id)
      .eq("status", "예약중")
      .single();

    if (existingUserReservation) {
      return Response.json(
        { error: "이미 예약이 완료되어있습니다.", reservation: existingUserReservation },
        { status: 400 }
      );
    }

    const { data: existingPhotoReservation } = await supabaseAdmin
      .from("photo_reservations")
      .select("id, status, user_id, user_name")
      .eq("photo_id", photo_id)
      .in("status", ["예약중", "예약완료", "수령완료"])
      .single();

    if (existingPhotoReservation) {
      return Response.json(
        {
          error: `해당 사진은 이미 ${existingPhotoReservation.user_name || "다른 사용자"}에게 예약되어 있습니다.`,
          reservation: existingPhotoReservation,
        },
        { status: 400 }
      );
    }

    const { data: photo } = await supabaseAdmin
      .from("photos")
      .select("id, title")
      .eq("id", photo_id)
      .eq("is_active", true)
      .single();

    if (!photo) {
      return Response.json({ error: "사진을 찾을 수 없습니다." }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("photo_reservations")
      .insert({
        photo_id,
        user_id,
        user_name: user_name || null,
        user_email: user_email || null,
        message: message || null,
        status: "예약중",
      })
      .select()
      .single();

    if (error) {
      console.error("예약 생성 오류:", error);
      return Response.json({ error: "예약 생성 실패" }, { status: 500 });
    }

    return Response.json({ message: "예약완료", reservation: data }, { status: 201 });
  } catch (error) {
    console.error("예약 생성 오류:", error);
    return Response.json({ error: "예약 생성 실패" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
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
      .select()
      .single();

    if (error) {
      console.error("예약 수정 오류:", error);
      return Response.json({ error: "예약 수정 실패" }, { status: 500 });
    }

    return Response.json({ reservation: data }, { status: 200 });
  } catch (error) {
    console.error("예약 수정 오류:", error);
    return Response.json({ error: "예약 수정 실패" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return Response.json({ error: "예약 ID가 필요합니다." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("photo_reservations")
      .update({ status: "취소됨" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("예약 취소 오류:", error);
      return Response.json({ error: "예약 취소 실패" }, { status: 500 });
    }

    return Response.json(
      { message: "예약이 취소되었습니다.", reservation: data },
      { status: 200 }
    );
  } catch (error) {
    console.error("예약 취소 오류:", error);
    return Response.json({ error: "예약 취소 실패" }, { status: 500 });
  }
}

