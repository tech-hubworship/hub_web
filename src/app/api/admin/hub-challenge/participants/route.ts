import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@src/lib/auth";
import { supabaseAdmin } from "@src/lib/supabase";
import { HUB_CHALLENGE } from "@src/lib/hub-challenge/constants";

/**
 * GET /api/admin/hub-challenge/participants
 * 챌린지 참여자 목록 — 누가 몇 일 참여했는지
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  // 전체 나눔 기록 조회
  const { data: shares, error } = await supabaseAdmin
    .from(HUB_CHALLENGE.TABLE_SHARES)
    .select("share_id, reg_id, day, reg_dt, content")
    .eq("slug", HUB_CHALLENGE.SLUG)
    .order("reg_dt", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // reg_id별로 그룹핑
  const userMap = new Map<string, { days: Set<number>; shares: any[] }>();
  for (const s of shares || []) {
    if (!userMap.has(s.reg_id)) {
      userMap.set(s.reg_id, { days: new Set(), shares: [] });
    }
    const u = userMap.get(s.reg_id)!;
    u.days.add(s.day);
    u.shares.push(s);
  }

  const userIds = Array.from(userMap.keys());
  if (userIds.length === 0) {
    return NextResponse.json({ participants: [], totalShares: 0 });
  }

  // 프로필 조회
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select(
      "user_id, name, community, group_id, cell_id, hub_groups!fk_group_id(name), hub_cells!fk_cell_id(name)"
    )
    .in("user_id", userIds);

  const excludeGroupIds = [7, 99];
  const excludeCellIds = [26, 99];
  const profileMap = new Map<string, { name: string; affiliation: string }>();
  profiles?.forEach((p: any) => {
    const community = p.community || "";
    const groupName = excludeGroupIds.includes(p.group_id)
      ? ""
      : p.hub_groups?.name || "";
    const cellName = excludeCellIds.includes(p.cell_id)
      ? ""
      : p.hub_cells?.name || "";
    profileMap.set(p.user_id, {
      name: p.name || "알수없음",
      affiliation: [community, groupName, cellName].filter(Boolean).join(" / "),
    });
  });

  const participants = Array.from(userMap.entries())
    .map(([userId, data]) => {
      const profile = profileMap.get(userId);
      return {
        user_id: userId,
        name: profile?.name || "알수없음",
        affiliation: profile?.affiliation || "",
        completed_days: Array.from(data.days).sort((a, b) => a - b),
        completed_count: data.days.size,
        total_shares: data.shares.length,
        last_share_dt: data.shares[data.shares.length - 1]?.reg_dt || "",
      };
    })
    .sort((a, b) => b.completed_count - a.completed_count);

  return NextResponse.json({
    participants,
    totalShares: (shares || []).length,
    totalParticipants: participants.length,
  });
}
