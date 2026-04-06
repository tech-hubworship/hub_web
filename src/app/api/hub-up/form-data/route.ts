import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@src/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // slot counts는 실시간 필요

/**
 * GET /api/hub-up/form-data
 * - slots/config: 자주 안 바뀜 → s-maxage로 CDN 캐싱
 * - slotCounts: 실시간 필요하지만 stale-while-revalidate로 부하 완화
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

  const counts: Record<string, number> = {};
  (slotCounts || []).forEach((row: { departure_slot: string }) => {
    counts[row.departure_slot] = (counts[row.departure_slot] || 0) + 1;
  });

  const configMap: Record<string, string> = {};
  (config || []).forEach((row: { key: string; value: string }) => {
    configMap[row.key] = row.value;
  });

  return NextResponse.json(
    {
      departureSlots: departureSlots || [],
      returnSlots: returnSlots || [],
      electives: electives || [],
      config: configMap,
      slotCounts: counts,
    },
    {
      headers: {
        // slots/config는 30초 CDN 캐시, 최대 2분 stale 허용
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    }
  );
}
