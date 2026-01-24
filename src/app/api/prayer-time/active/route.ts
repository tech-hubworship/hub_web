import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 현재 기도 중인 사람 목록 API
 * GET /api/prayer-time/active
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 현재 기도 중인 세션 조회
    const { data: activeSessions, error: sessionsError } = await supabaseAdmin
      .from("prayer_sessions")
      .select("user_id, start_time")
      .order("start_time", { ascending: false });

    if (sessionsError) {
      console.error("Error fetching active sessions:", sessionsError);
      return Response.json(
        { error: "기도 중인 사람 목록 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 사용자 이름 조회
    const userIds = (activeSessions || []).map((s: any) => s.user_id);
    let profiles: any[] | null = null;

    if (userIds.length > 0) {
      const { data, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);

      profiles = data;
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }
    }

    // 프로필 맵 생성
    const profileMap = new Map<string, string>();
    profiles?.forEach((profile: any) => {
      profileMap.set(profile.user_id, profile.name);
    });

    const now = new Date();
    const activeUsers = (activeSessions || []).map((s: any) => {
      const startTime = new Date(s.start_time);
      const durationSeconds = Math.floor(
        (now.getTime() - startTime.getTime()) / 1000
      );

      return {
        user_id: s.user_id,
        name: profileMap.get(s.user_id) || "알 수 없음",
        start_time: s.start_time,
        duration_seconds: durationSeconds,
      };
    });

    // 캐시 헤더 설정 (짧은 캐시로 실시간성 유지하면서 Edge request 감소)
    const headers = new Headers();
    headers.set(
      "Cache-Control",
      "public, s-maxage=3, stale-while-revalidate=5"
    );

    return Response.json(
      {
        success: true,
        data: {
          count: activeUsers.length,
          users: activeUsers,
        },
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Prayer time active API error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

