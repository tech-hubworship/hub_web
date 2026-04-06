import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { data: regs, error } = await supabaseAdmin
    .from('hub_up_registrations')
    .select('*');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = regs || [];
  const total = rows.length;
  const male = rows.filter((r) => r.gender === '남' || r.gender === '남자').length;
  const female = rows.filter((r) => r.gender === '여' || r.gender === '여자').length;
  const other = total - male - female;
  const deposited = rows.filter((r) => r.admin_deposit_confirm).length;

  // 출발 슬롯별
  const departureCounts: Record<string, number> = {};
  rows.forEach((r) => {
    departureCounts[r.departure_slot] = (departureCounts[r.departure_slot] || 0) + 1;
  });

  // 복귀 슬롯별
  const returnCounts: Record<string, number> = {};
  rows.forEach((r) => {
    returnCounts[r.return_slot] = (returnCounts[r.return_slot] || 0) + 1;
  });

  // 자차 세부
  const carRoleCounts: Record<string, number> = {};
  rows.filter((r) => r.departure_slot === 'car' || r.return_slot === 'car').forEach((r) => {
    if (r.car_role) carRoleCounts[r.car_role] = (carRoleCounts[r.car_role] || 0) + 1;
  });

  // 그룹별 (group_name 앞부분 기준)
  const groupCounts: Record<string, { male: number; female: number; total: number }> = {};
  rows.forEach((r) => {
    const groupKey = r.group_name?.split('-')[0] || '기타';
    if (!groupCounts[groupKey]) groupCounts[groupKey] = { male: 0, female: 0, total: 0 };
    groupCounts[groupKey].total++;
    if (r.gender === '남' || r.gender === '남자') groupCounts[groupKey].male++;
    else if (r.gender === '여' || r.gender === '여자') groupCounts[groupKey].female++;
  });

  // 팀 섬김
  const intercessorCount = rows.filter((r) => r.intercessor_team === '신청').length;
  const volunteerCount = rows.filter((r) => r.volunteer_team === '신청').length;

  // 선택강의
  const electiveCounts: Record<string, number> = {};
  rows.forEach((r) => {
    if (r.elective_lecture) {
      electiveCounts[r.elective_lecture] = (electiveCounts[r.elective_lecture] || 0) + 1;
    }
  });

  // 공동체별
  const communityCounts: Record<string, number> = {};
  rows.forEach((r) => {
    communityCounts[r.community] = (communityCounts[r.community] || 0) + 1;
  });

  return NextResponse.json({
    total,
    gender: { male, female, other },
    deposited,
    depositRate: total > 0 ? Math.round((deposited / total) * 100) : 0,
    departureCounts,
    returnCounts,
    carRoleCounts,
    groupCounts,
    intercessorCount,
    volunteerCount,
    electiveCounts,
    communityCounts,
  });
}
