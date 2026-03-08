import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_OD = "OD";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = session.user.id;

    const { data: attendanceRows, error: attError } = await supabaseAdmin
      .from("weekly_attendance")
      .select(
        "id, week_date, status, attended_at, late_fee, is_report_required, late_fee_excused, report_excused, note"
      )
      .eq("user_id", userId)
      .eq("category", CATEGORY_OD)
      .order("week_date", { ascending: false });

    if (attError) throw attError;

    const { data: settlements, error: setError } = await supabaseAdmin
      .from("late_fee_settlements")
      .select("id, amount, note, settled_at")
      .eq("user_id", userId)
      .eq("category", CATEGORY_OD)
      .order("settled_at", { ascending: false });

    if (setError) throw setError;

    const totalLateFee = (attendanceRows || []).reduce(
      (sum, r) => sum + (r.late_fee || 0),
      0
    );
    const totalSettled = (settlements || []).reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    );
    const remaining = Math.max(0, totalLateFee - totalSettled);

    return Response.json(
      {
        attendance: attendanceRows || [],
        lateFeeSummary: {
          totalLateFee,
          totalSettled,
          remaining,
        },
        settlements: settlements || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "데이터 조회 실패" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}
