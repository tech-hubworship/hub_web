import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/darakbang/sunjangs?cell_id=<number>
 * 현재 다락방(cell_id)에 소속된 순장 목록을 attendance_od_targets 기반으로 반환.
 * attendance_od_targets는 RLS가 있어 anon key로 접근 불가 → supabaseAdmin 사용.
 */
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const url = new URL(req.url);
    const cellIdStr = url.searchParams.get("cell_id");
    if (!cellIdStr) {
        return Response.json({ error: "cell_id가 필요합니다." }, { status: 400 });
    }
    const cellId = parseInt(cellIdStr, 10);
    if (isNaN(cellId)) {
        return Response.json({ error: "유효하지 않은 cell_id입니다." }, { status: 400 });
    }

    try {
        // 1) 해당 다락방(cell_id)의 프로필 목록 조회 (정확한 user_id 기준)
        const { data: cellProfiles, error: profilesError } = await supabaseAdmin
            .from("profiles")
            .select("user_id, name")
            .eq("cell_id", cellId);

        if (profilesError) throw profilesError;

        const cellUserIds = (cellProfiles || []).map((p: any) => p.user_id).filter(Boolean);
        if (cellUserIds.length === 0) {
            return Response.json({ sunjangs: [] }, { status: 200 });
        }

        // 2) attendance_od_targets에서 해당 user_id들만 추출 (OD 카테고리)
        // - 이름을 기반으로 필터링하지 않고 오직 user_id로 매핑
        const { data: odData, error: odError } = await supabaseAdmin
            .from("attendance_od_targets")
            .select("user_id, is_cell_leader, is_group_leader")
            .eq("category", "OD")
            .in("user_id", cellUserIds);

        if (odError) throw odError;

        const odTargetMap = new Map();
        (odData || []).forEach((od: any) => {
            odTargetMap.set(od.user_id, od);
        });

        // 3) 다시 profiles 기준으로 순장 목록 생성
        const finalSunjangs = (cellProfiles || [])
            .filter((p: any) => odTargetMap.has(p.user_id))
            .map((p: any) => {
                const odInfo = odTargetMap.get(p.user_id);
                return {
                    user_id: p.user_id,
                    name: p.name, // profiles 테이블에 등록된 이름 우선
                    is_cell_leader: odInfo?.is_cell_leader || false,
                    is_group_leader: odInfo?.is_group_leader || false
                };
            });

        // 4) 이름(가나다) 순 정렬
        finalSunjangs.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

        return Response.json({ sunjangs: finalSunjangs }, { status: 200 });
    } catch (err) {
        console.error("[/api/darakbang/sunjangs] error:", err);
        return Response.json({ error: "순장 목록 조회에 실패했습니다." }, { status: 500 });
    }
}
