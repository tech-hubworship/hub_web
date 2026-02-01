import { NextResponse } from "next/server";
import { supabaseAdmin } from "@src/lib/supabase";
import { requireAdminSession } from "@src/lib/api/auth";
import {
  clampDateParam,
  toSeoulEndOfDayISO,
  toSeoulStartOfDayISO,
} from "@src/lib/calendar/dateRange";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const from = clampDateParam(url.searchParams.get("from"));
    const to = clampDateParam(url.searchParams.get("to"));

    if (!from || !to) {
      return NextResponse.json(
        { error: "from/to(YYYY-MM-DD) 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    const fromISO = toSeoulStartOfDayISO(from);
    const toISO = toSeoulEndOfDayISO(to);

    const { data, error } = await supabaseAdmin
      .from("calendar_events")
      .select("*")
      .lte("start_at", toISO)
      .or(`end_at.gte.${fromISO},end_at.is.null`)
      .order("start_at", { ascending: true });

    if (error) {
      console.error("admin calendar 조회 오류:", error);
      return NextResponse.json(
        { error: "일정 조회 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (e) {
    console.error("admin calendar API Error:", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      title,
      start_at,
      end_at,
      all_day = false,
      location = null,
      description = null,
      is_public = true,
    } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "title은 필수입니다." },
        { status: 400 }
      );
    }
    if (!start_at || typeof start_at !== "string") {
      return NextResponse.json(
        { error: "start_at은 필수입니다." },
        { status: 400 }
      );
    }
    if (
      end_at !== null &&
      end_at !== undefined &&
      typeof end_at !== "string"
    ) {
      return NextResponse.json(
        { error: "end_at 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const insertPayload = {
      title: title.trim(),
      start_at,
      end_at: end_at ?? null,
      all_day: Boolean(all_day),
      location: typeof location === "string" ? location.trim() : null,
      description: typeof description === "string" ? description.trim() : null,
      is_public: Boolean(is_public),
      created_by: session.user.id,
    };

    const { data, error } = await supabaseAdmin
      .from("calendar_events")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      console.error("admin calendar 생성 오류:", error);
      return NextResponse.json(
        { error: "일정 생성 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e) {
    console.error("admin calendar POST API Error:", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
