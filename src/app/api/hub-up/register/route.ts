import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

// 총 정원 (config에서 가져오되 기본값 700)
const DEFAULT_MAX_CAPACITY = 700;

/**
 * POST /api/hub-up/register
 * 신청서 제출
 * - 정원(700명) 이하: 정식 명단 (is_waitlist = false)
 * - 정원 초과: 대기자 명단 (is_waitlist = true)
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

  // 정원 확인: 정식 명단 + 대기자 명단 합산 기준
  // 취소로 정식이 줄어도 대기자가 있으면 새 신청자는 대기자로 들어감
  const [{ data: configData }, { count: totalCount }] = await Promise.all([
    supabaseAdmin
      .from('hub_up_config')
      .select('value')
      .eq('key', 'max_capacity')
      .maybeSingle(),
    supabaseAdmin
      .from('hub_up_registrations')
      .select('id', { count: 'exact', head: true }),
  ]);

  const maxCapacity = configData?.value ? parseInt(configData.value, 10) : DEFAULT_MAX_CAPACITY;
  const isWaitlist = (totalCount ?? 0) >= maxCapacity;

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
    is_waitlist:         isWaitlist,
  });

  if (error) {
    console.error('hub_up register error:', error);
    return NextResponse.json({ error: '제출 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, isWaitlist });
}
