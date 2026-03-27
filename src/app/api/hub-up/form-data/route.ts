import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@src/lib/supabase';

export const revalidate = 60; // 1분 ISR 캐싱

/**
 * GET /api/hub-up/form-data
 * 신청 폼 렌더링에 필요한 정적 데이터를 한 번에 반환
 * - 출발 슬롯 목록 + 현재 신청 인원
 * - 복귀 슬롯 목록
 * - 선택강의 목록
 * - 행사 설정 (config)
 */
export async function GET() {
  const [
    { data: departureSlots },
    { data: returnSlots },
    { data: electives },
    { data: config },
    { data: slotCounts },
  ] = await Promise.all([
    supabaseAdmin
      .from('hub_up_departure_slots')
      .select('value, label, max_count, is_active')
      .eq('is_active', true)
      .order('sort_order'),

    supabaseAdmin
      .from('hub_up_return_slots')
      .select('value, label, max_count, is_active')
      .eq('is_active', true)
      .order('sort_order'),

    supabaseAdmin
      .from('hub_up_elective_lectures')
      .select('value, label')
      .eq('is_active', true)
      .order('sort_order'),

    supabaseAdmin
      .from('hub_up_config')
      .select('key, value'),

    supabaseAdmin
      .from('hub_up_registrations')
      .select('departure_slot'),
  ]);

  // 슬롯별 현재 신청 인원 집계
  const counts: Record<string, number> = {};
  (slotCounts || []).forEach((row: { departure_slot: string }) => {
    counts[row.departure_slot] = (counts[row.departure_slot] || 0) + 1;
  });

  // config 배열 → 객체로 변환
  const configMap: Record<string, string> = {};
  (config || []).forEach((row: { key: string; value: string }) => {
    configMap[row.key] = row.value;
  });

  return NextResponse.json({
    departureSlots: departureSlots || [],
    returnSlots: returnSlots || [],
    electives: electives || [],
    config: configMap,
    slotCounts: counts,
  });
}
