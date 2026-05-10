import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

// 전체 수정 권한 (MC 이지원)
const FULL_EDIT_EMAILS = ['skj45691234@gmail.com', 'jhp6413@gmail.com', 'dlwldnjs7138@gmail.com'];

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const userEmail = (session.user as any)?.email ?? '';
  const canFullEdit = FULL_EDIT_EMAILS.includes(userEmail);

  const updateData: Record<string, any> = {};

  // 기존 필드 (모든 관리자)
  if ('room_number' in body) updateData.room_number = body.room_number ?? null;
  if ('room_note' in body) updateData.room_note = body.room_note ?? null;
  if ('admin_deposit_confirm' in body) {
    updateData.admin_deposit_confirm = body.admin_deposit_confirm;
    updateData.admin_deposit_confirmed_at = body.admin_deposit_confirm ? new Date().toISOString() : null;
  }

  // 전체 수정 필드 (MC 이지원만)
  if (canFullEdit) {
    const fullEditFields = [
      'name', 'gender', 'phone', 'birthdate', 'community',
      'group_name', 'leader_name',
      'departure_slot', 'return_slot',
      'elective_lecture', 'volunteer_team', 'intercessor_team',
      'deposit_confirm',
    ];
    for (const field of fullEditFields) {
      if (field in body) updateData[field] = body[field];
    }
  }

  // 자차 정보 (모든 관리자 수정 가능)
  const carFields = [
    'car_role', 'car_passenger_count', 'car_passenger_names',
    'car_plate_number', 'car_arrival_time', 'car_departure_time',
  ];
  for (const field of carFields) {
    if (field in body) updateData[field] = body[field] ?? null;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: '수정할 내용이 없습니다.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('hub_up_registrations')
    .update(updateData)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { id } = await ctx.params;

  const { error } = await supabaseAdmin
    .from('hub_up_registrations')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
