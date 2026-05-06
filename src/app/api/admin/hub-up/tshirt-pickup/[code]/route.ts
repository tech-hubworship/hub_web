import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

// GET: QR 코드로 주문 정보 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { code } = params;

  const { data: order, error } = await supabaseAdmin
    .from('hub_up_tshirt_orders')
    .select('id, items, deposit_confirm, status, qr_code, received_at, user_id')
    .eq('qr_code', code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: '해당 QR 코드를 찾을 수 없습니다.' }, { status: 404 });

  // 사용자 프로필 조회
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('name, hub_groups!fk_group_id(name), hub_cells!fk_cell_id(name)')
    .eq('user_id', order.user_id)
    .maybeSingle();

  // 연락처 조회
  const { data: reg } = await supabaseAdmin
    .from('hub_up_registrations')
    .select('phone, community')
    .eq('user_id', order.user_id)
    .maybeSingle();

  return NextResponse.json({
    id: order.id,
    items: order.items,
    deposit_confirm: order.deposit_confirm,
    status: order.status,
    received_at: order.received_at,
    name: (profile as any)?.name || '알수없음',
    group_name: (profile as any)?.hub_groups?.name || '',
    cell_name: (profile as any)?.hub_cells?.name || '',
    phone: reg?.phone || '',
    community: reg?.community || '',
  });
}

// POST: 수령 완료 처리
export async function POST(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { code } = params;

  // 주문 존재 확인
  const { data: order, error: findError } = await supabaseAdmin
    .from('hub_up_tshirt_orders')
    .select('id, received_at')
    .eq('qr_code', code)
    .maybeSingle();

  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: '해당 QR 코드를 찾을 수 없습니다.' }, { status: 404 });

  if (order.received_at) {
    return NextResponse.json({ error: '이미 수령 처리된 주문입니다.' }, { status: 409 });
  }

  const { error: updateError } = await supabaseAdmin
    .from('hub_up_tshirt_orders')
    .update({
      received_at: new Date().toISOString(),
      status: 'distributed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// DELETE: 수령 취소 (되돌리기)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { code } = params;

  const { data: order, error: findError } = await supabaseAdmin
    .from('hub_up_tshirt_orders')
    .select('id')
    .eq('qr_code', code)
    .maybeSingle();

  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: '해당 QR 코드를 찾을 수 없습니다.' }, { status: 404 });

  const { error: updateError } = await supabaseAdmin
    .from('hub_up_tshirt_orders')
    .update({
      received_at: null,
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
