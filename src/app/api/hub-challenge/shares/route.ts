import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { getKoreanTimestamp } from "@src/lib/utils/date";
import { revalidateTag } from "next/cache";
import { HUB_CHALLENGE } from "@src/lib/hub-challenge/constants";

/** GET: 특정 day의 나눔 목록 조회 (익명, 내 나눔엔 is_mine 플래그) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const day = searchParams.get("day");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    if (!day) {
      return Response.json({ error: "day 파라미터가 필요합니다." }, { status: 400 });
    }

    const dayNum = parseInt(day, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > HUB_CHALLENGE.TOTAL_DAYS) {
      return Response.json({ error: "올바른 day 값이 아닙니다. (1~19)" }, { status: 400 });
    }

    // 로그인 유저 확인은 클라이언트에서 is_mine 처리하므로 서버에서 불필요
    // → 응답을 공개 캐시 가능하게 유지

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { count } = await supabaseAdmin
      .from(HUB_CHALLENGE.TABLE_SHARES)
      .select("*", { count: "exact", head: true })
      .eq("slug", HUB_CHALLENGE.SLUG)
      .eq("day", dayNum);

    const { data, error } = await supabaseAdmin
      .from(HUB_CHALLENGE.TABLE_SHARES)
      .select("*")
      .eq("slug", HUB_CHALLENGE.SLUG)
      .eq("day", dayNum)
      .order("reg_dt", { ascending: false })
      .range(from, to);

    if (error) throw error;

    // 익명 처리
    const userIds = Array.from(new Set((data || []).map((s: any) => s.reg_id)));
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, community, group_id, cell_id, hub_groups!fk_group_id(name), hub_cells!fk_cell_id(name)")
      .in("user_id", userIds);

    const maskName = (name: string): string => {
      if (!name || name.length < 2) return "익명";
      if (name.length === 2) return name[0] + "0";
      return name[0] + "0" + name[name.length - 1];
    };
    const excludeGroupIds = [7, 99];
    const excludeCellIds = [26, 99];
    const profileMap = new Map();
    profiles?.forEach((p: any) => {
      const community = p.community || "";
      const groupName = excludeGroupIds.includes(p.group_id) ? "" : (p.hub_groups?.name || "");
      const cellName = excludeCellIds.includes(p.cell_id) ? "" : (p.hub_cells?.name || "");
      profileMap.set(p.user_id, {
        name: maskName(p.name),
        affiliation: [community, groupName, cellName].filter(Boolean).join("/"),
      });
    });

    const sharesWithNames = (data || []).map((share: any, index: number) => {
      const userInfo = profileMap.get(share.reg_id);
      return {
        share_id: share.share_id,
        day: share.day,
        content: share.content,
        reg_dt: share.reg_dt,
        user_name: userInfo?.name || "익명",
        user_affiliation: userInfo?.affiliation || "",
        seq: (count || 0) - from - index,
        reg_id: share.reg_id, // 클라이언트에서 is_mine 판단용 (익명 처리된 이름과 별개)
      };
    });

    return Response.json({
      shares: sharesWithNames,
      total: count || 0,
      page,
      limit,
    }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("나눔 조회 오류:", error);
    return Response.json({ error: "나눔을 불러오는데 실패했습니다." }, { status: 500 });
  }
}

/** POST: 나눔 작성 (하루 1개 제한) */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { day, content } = body;

    if (!day || !content) {
      return Response.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }
    if (typeof day !== "number" || day < 1 || day > HUB_CHALLENGE.TOTAL_DAYS) {
      return Response.json({ error: "올바른 day 값이 아닙니다." }, { status: 400 });
    }
    if (content.length > 300) {
      return Response.json({ error: "나눔은 300자 이하여야 합니다." }, { status: 400 });
    }

    let userId = (session.user as any).id || session.user.email || "anonymous";
    if (userId.length > 100) userId = userId.substring(0, 100);

    // 하루 1개 제한: 이미 해당 day에 나눔이 있으면 거부
    const { count: existingCount } = await supabaseAdmin
      .from(HUB_CHALLENGE.TABLE_SHARES)
      .select("*", { count: "exact", head: true })
      .eq("slug", HUB_CHALLENGE.SLUG)
      .eq("day", day)
      .eq("reg_id", userId);

    if ((existingCount ?? 0) > 0) {
      return Response.json(
        { error: "이미 오늘의 나눔을 작성했습니다. 수정하려면 수정 버튼을 이용해주세요." },
        { status: 409 }
      );
    }

    const now = getKoreanTimestamp();

    const { data, error } = await supabaseAdmin
      .from(HUB_CHALLENGE.TABLE_SHARES)
      .insert({
        slug: HUB_CHALLENGE.SLUG,
        day,
        content: content.trim(),
        reg_id: userId,
        reg_dt: now,
        mod_id: userId,
        mod_dt: now,
      })
      .select()
      .single();

    if (error) {
      console.error("나눔 작성 오류:", error);
      return Response.json({ error: "나눔 작성에 실패했습니다." }, { status: 500 });
    }

    try { revalidateTag(HUB_CHALLENGE.CACHE_TAG_SHARES); } catch {}

    return Response.json({ share: data }, { status: 201 });
  } catch (error) {
    console.error("나눔 작성 오류:", error);
    return Response.json({ error: "나눔 작성에 실패했습니다." }, { status: 500 });
  }
}

/** PATCH: 내 나눔 수정 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { share_id, content } = body;

    if (!share_id || !content) {
      return Response.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }
    if (content.length > 300) {
      return Response.json({ error: "나눔은 300자 이하여야 합니다." }, { status: 400 });
    }

    let userId = (session.user as any).id || session.user.email || "anonymous";
    if (userId.length > 100) userId = userId.substring(0, 100);

    // 본인 나눔인지 확인
    const { data: existing } = await supabaseAdmin
      .from(HUB_CHALLENGE.TABLE_SHARES)
      .select("share_id, reg_id")
      .eq("share_id", share_id)
      .single();

    if (!existing) {
      return Response.json({ error: "나눔을 찾을 수 없습니다." }, { status: 404 });
    }
    if (existing.reg_id !== userId) {
      return Response.json({ error: "본인의 나눔만 수정할 수 있습니다." }, { status: 403 });
    }

    const now = getKoreanTimestamp();

    const { data, error } = await supabaseAdmin
      .from(HUB_CHALLENGE.TABLE_SHARES)
      .update({ content: content.trim(), mod_id: userId, mod_dt: now })
      .eq("share_id", share_id)
      .select()
      .single();

    if (error) {
      console.error("나눔 수정 오류:", error);
      return Response.json({ error: "나눔 수정에 실패했습니다." }, { status: 500 });
    }

    try { revalidateTag(HUB_CHALLENGE.CACHE_TAG_SHARES); } catch {}

    return Response.json({ share: data });
  } catch (error) {
    console.error("나눔 수정 오류:", error);
    return Response.json({ error: "나눔 수정에 실패했습니다." }, { status: 500 });
  }
}
