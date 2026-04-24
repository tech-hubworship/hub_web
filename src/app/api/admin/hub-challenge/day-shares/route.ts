import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { HUB_CHALLENGE } from "@src/lib/hub-challenge/constants";

/**
 * GET /api/admin/hub-challenge/day-shares?day=1
 * 특정 day의 나눔 목록 (실명 포함)
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const day = parseInt(searchParams.get("day") || "0", 10);

  if (!day || day < 1 || day > HUB_CHALLENGE.TOTAL_DAYS) {
    return NextResponse.json({ error: "올바른 day 값이 아닙니다." }, { status: 400 });
  }

  const { data: shares, error } = await supabaseAdmin
    .from(HUB_CHALLENGE.TABLE_SHARES)
    .select("share_id, reg_id, day, content, reg_dt")
    .eq("slug", HUB_CHALLENGE.SLUG)
    .eq("day", day)
    .order("reg_dt", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = Array.from(new Set((shares || []).map((s: any) => s.reg_id)));

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("user_id, name, community, group_id, cell_id, hub_groups!fk_group_id(name), hub_cells!fk_cell_id(name)")
    .in("user_id", userIds);

  const excludeGroupIds = [7, 99];
  const excludeCellIds = [26, 99];
  const profileMap = new Map<string, { name: string; affiliation: string }>();
  profiles?.forEach((p: any) => {
    const community = p.community || "";
    const groupName = excludeGroupIds.includes(p.group_id) ? "" : p.hub_groups?.name || "";
    const cellName = excludeCellIds.includes(p.cell_id) ? "" : p.hub_cells?.name || "";
    profileMap.set(p.user_id, {
      name: p.name || "알수없음",
      affiliation: [community, groupName, cellName].filter(Boolean).join(" / "),
    });
  });

  const result = (shares || []).map((s: any, i: number) => ({
    share_id: s.share_id,
    seq: i + 1,
    name: profileMap.get(s.reg_id)?.name || "알수없음",
    affiliation: profileMap.get(s.reg_id)?.affiliation || "",
    content: s.content,
    reg_dt: s.reg_dt,
  }));

  return NextResponse.json({ shares: result, total: result.length });
}
