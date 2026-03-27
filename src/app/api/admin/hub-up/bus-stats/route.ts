import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

/**
 * GET /api/admin/hub-up/bus-stats
 * 버스 슬롯별 신청자 목록 + 집계
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const slot = searchParams.get('slot'); // 특정 슬롯 필터

  // 슬롯 정의 조회
  const { data: slots } = await supabaseAdmin
    .from('hub_up_departure_slots')
    .select('value, label, max_count')
    .order('sort_order');

  // 신청자 조회
  let query = supabaseAdmin
    .from('hub_up_registrations')
    .select('id, name, group_name, phone, departure_slot, return_slot, deposit_confirm')
    .order('created_at', { ascending: true });

  if (slot) query = query.eq('departure_slot', slot);

  const { data: registrations } = await query;

  // 슬롯별 카운트 집계
  const counts: Record<string, number> = {};
  (registrations || []).forEach((r: any) => {
    counts[r.departure_slot] = (counts[r.departure_slot] || 0) + 1;
  });

  const slotStats = (slots || []).map((s: any) => ({
    value: s.value,
    label: s.label,
    max_count: s.max_count,
    current_count: counts[s.value] || 0,
    is_full: s.max_count > 0 && (counts[s.value] || 0) >= s.max_count,
  }));

  return NextResponse.json({
    slotStats,
    registrations: registrations || [],
  });
}
