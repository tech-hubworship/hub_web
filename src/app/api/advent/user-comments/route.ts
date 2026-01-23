import { supabaseAdmin } from "@src/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 사용자 ID 처리 (기존 pages 동작 유지)
    let userId: string = (session.user as any).id || session.user.email || "anonymous";
    if (userId.length > 100) userId = userId.substring(0, 100);

    const url = new URL(req.url);
    const post_dt = url.searchParams.get("post_dt");
    const checkOnly = url.searchParams.get("checkOnly");
    const pageStr = url.searchParams.get("page") ?? "1";
    const limitStr = url.searchParams.get("limit") ?? "10";

    // 특정 날짜의 묵상 존재 여부만 확인하는 경우
    if (checkOnly === "true" && post_dt) {
      const { data: existingComments, error: checkError } = await supabaseAdmin
        .from("advent_comments")
        .select("comment_id")
        .eq("reg_id", userId)
        .eq("post_dt", post_dt)
        .limit(1);

      if (checkError) {
        console.error("묵상 확인 오류:", checkError);
        return Response.json({ error: "묵상 확인에 실패했습니다." }, { status: 500 });
      }

      return Response.json(
        { hasMeditation: !!(existingComments && existingComments.length > 0) },
        { status: 200 }
      );
    }

    // 페이징 파라미터 처리
    const pageNum = parseInt(pageStr, 10);
    const limitNum = parseInt(limitStr, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    // 전체 개수 조회
    const { count, error: countError } = await supabaseAdmin
      .from("advent_comments")
      .select("*", { count: "exact", head: true })
      .eq("reg_id", userId);

    if (countError) {
      console.error("사용자 묵상 개수 조회 오류:", countError);
    }

    const { data: comments, error: commentsError } = await supabaseAdmin
      .from("advent_comments")
      .select("*")
      .eq("reg_id", userId)
      .order("post_dt", { ascending: false })
      .order("reg_dt", { ascending: false })
      .range(from, to);

    if (commentsError) {
      console.error("사용자 묵상 조회 오류:", commentsError);
      return Response.json({ error: "묵상을 불러오는데 실패했습니다." }, { status: 500 });
    }

    if (!comments || comments.length === 0) {
      return Response.json({ comments: [] }, { status: 200 });
    }

    // profiles 테이블에서 사용자 정보 조회 (공동체, 그룹, 셀, 이름)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select(
        "name, community, group_id, cell_id, hub_groups!fk_group_id(name), hub_cells!fk_cell_id(name)"
      )
      .eq("user_id", userId)
      .single();

    // 이름 마스킹 함수
    const maskName = (name: string): string => {
      if (!name || name.length < 2) return name || "익명";
      if (name.length === 2) return name[0] + "0";
      return name[0] + "0" + name[name.length - 1];
    };

    // 제외할 그룹/셀 ID 목록
    const excludeGroupIds = [7, 99];
    const excludeCellIds = [26, 99];

    // 이름과 소속 분리
    let maskedName = "익명";
    let affiliation = "";
    if (profile) {
      const community = (profile as any).community || "";
      const groupName = excludeGroupIds.includes((profile as any).group_id)
        ? ""
        : ((profile as any).hub_groups?.name || "");
      const cellName = excludeCellIds.includes((profile as any).cell_id)
        ? ""
        : ((profile as any).hub_cells?.name || "");
      maskedName = maskName((profile as any).name);

      const parts = [community, groupName, cellName].filter(Boolean);
      affiliation = parts.join("/");
    }

    const commentsWithNames = (comments as any[]).map((comment) => ({
      ...comment,
      user_name: maskedName,
      user_affiliation: affiliation,
    }));

    return Response.json(
      {
        comments: commentsWithNames,
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        hasMore: (count || 0) > to + 1,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("사용자 묵상 조회 오류:", error);
    return Response.json({ error: "묵상을 불러오는데 실패했습니다." }, { status: 500 });
  }
}

export async function POST() {
  return Response.json({ error: "허용되지 않는 메서드입니다." }, { status: 405 });
}

