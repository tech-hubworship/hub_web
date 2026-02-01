import { NextResponse } from "next/server";
import { supabaseAdmin } from "@src/lib/supabase";
import {
  clampDateParam,
  toSeoulEndOfDayISO,
  toSeoulStartOfDayISO,
} from "@src/lib/calendar/dateRange";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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
      .eq("is_public", true)
      .lte("start_at", toISO)
      .or(`end_at.gte.${fromISO},end_at.is.null`)
      .order("start_at", { ascending: true });

    if (error) {
      console.error("public calendar-events 조회 오류:", error);
      return NextResponse.json(
        { error: "일정 조회 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (e) {
    console.error("public calendar-events API Error:", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
