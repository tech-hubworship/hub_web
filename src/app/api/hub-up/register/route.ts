import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

/**
 * POST /api/hub-up/register
 * 신청서 제출
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // 중복 신청 체크
  const { data: existing } = await supabaseAdmin
    .from('hub_up_registrations')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: '이미 신청하셨습니다.' }, { status: 409 });
  }

  const body = await req.json();

  const { error } = await supabaseAdmin.from('hub_up_registrations').insert({
    user_id:             session.user.id,
    community:           body.community,
    group_name:          body.group,
    leader_name:         body.leaderName,
    name:                body.name,
    gender:              body.gender,
    birthdate:           body.birthdate,
    phone:               body.phone,
    privacy_consent:     body.privacyConsent,
    departure_slot:      body.departureBusTime,
    return_slot:         body.returnBusTime,
    car_role:            body.carRole || null,
    car_passenger_count: body.carPassengerCount || null,
    car_passenger_names: body.carPassengerNames || null,
    car_plate_number:    body.carPlateNumber || null,
    car_arrival_time:    body.carArrivalTime || null,
    car_departure_time:  body.carDepartureTime || null,
    elective_lecture:    body.electiveLecture,
    deposit_confirm:     body.depositConfirm,
    intercessor_team:    body.intercessorTeam,
    volunteer_team:      body.volunteerTeam,
  });

  if (error) {
    console.error('hub_up register error:', error);
    return NextResponse.json({ error: '제출 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
