import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

/**
 * GET /api/hub-up/myinfo
 * 로그인한 사용자의 신청 내역 조회
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('hub_up_registrations')
    .select(`
      id,
      created_at,
      name,
      group_name,
      departure_slot,
      return_slot,
      elective_lecture,
      intercessor_team,
      volunteer_team,
      admin_deposit_confirm,
      room_number,
      room_note
    `)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ registration: null });
  }

  // bus_change_url, contact_phone config 조회
  const { data: configRows } = await supabaseAdmin
    .from('hub_up_config')
    .select('key, value')
    .in('key', ['bus_change_url', 'contact_phone', 'contact_name']);

  const configMap: Record<string, string> = {};
  (configRows || []).forEach((row: { key: string; value: string }) => {
    configMap[row.key] = row.value;
  });

  return NextResponse.json({
    registration: data,
    contactPhone: configMap['contact_phone'] || null,
    contactName: configMap['contact_name'] || null,
  }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
