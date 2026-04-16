import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

// GET: 전체 신청자 목록 조회
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const roomFilter = searchParams.get('room') || '';

  let query = supabaseAdmin
    .from('hub_up_registrations')
    .select('id, created_at, name, group_name, community, gender, departure_slot, return_slot, elective_lecture, intercessor_team, volunteer_team, deposit_confirm, admin_deposit_confirm, admin_deposit_confirmed_at, room_number, room_note, phone, leader_name')
    .order('created_at', { ascending: true });

  if (search) {
    query = query.or(`name.ilike.%${search}%,group_name.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  if (roomFilter === 'unassigned') {
    query = query.is('room_number', null);
  } else if (roomFilter) {
    query = query.eq('room_number', roomFilter);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
