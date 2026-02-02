import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { jsonError, jsonOk, methodNotAllowed } from "@src/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  // 관리자(Admin) 또는 MC 권한 체크
  if (!(session?.user as any)?.isAdmin && !(session?.user as any)?.roles?.includes("MC")) {
    return jsonError("권한이 없습니다.", 403);
  }

  const body = await req.json().catch(() => ({}));
  const { userId, weekDate, status, category = "OD" } = body;

  if (!userId || !weekDate || !status) {
    return jsonError("필수 정보가 누락되었습니다.", 400);
  }

  try {
    let updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };

    // 상태에 따른 처리 로직
    if (status === "excused") {
      // 사유 인정: 지각비 0원, 보고서 불필요
      updateData.late_fee = 0;
      updateData.is_report_required = false;
      // 아직 출석 row가 없을 수도 있으므로 attended_at이 없으면 현재 시간으로 채우거나 
      // 혹은 '면제'는 출석 시간 의미가 없으므로 null로 둘 수도 있으나,
      // 기존 로직 호환성을 위해 attended_at이 없다면 오늘 날짜 00:00 등으로 처리하거나 insert시 주의 필요
    } else if (status === "absent") {
       // 결석 처리 (필요시 로직 추가)
    }

    // weekly_attendance 테이블에 upsert (없으면 생성, 있으면 수정)
    // 주의: 만약 아예 기록이 없는 유저를 '사유 인정' 하려면 insert가 되어야 함.
    
    // 1. 기존 기록 확인
    const { data: existing } = await supabaseAdmin
      .from("weekly_attendance")
      .select("id")
      .eq("user_id", userId)
      .eq("week_date", weekDate)
      .eq("category", category)
      .maybeSingle();

    let result;
    
    if (existing) {
      // 업데이트
      const { data, error } = await supabaseAdmin
        .from("weekly_attendance")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();
        
      if(error) throw error;
      result = data;
    } else {
      // 신규 생성 (아예 출석 안한 사람을 사유 인정 처리할 때)
      const { data, error } = await supabaseAdmin
        .from("weekly_attendance")
        .insert({
          user_id: userId,
          week_date: weekDate,
          category,
          attended_at: status === "excused" ? new Date().toISOString() : null, // 사유 인정 시 출석 시간은 기록해둠(통계용) 혹은 null
          ...updateData
        })
        .select()
        .single();
        
      if(error) throw error;
      result = data;
    }

    return jsonOk({ message: "상태가 변경되었습니다.", result }, 200);

  } catch (error) {
    console.error(error);
    return jsonError("상태 변경 실패", 500);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}