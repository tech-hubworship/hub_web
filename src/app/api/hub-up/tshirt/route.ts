import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

// GET: 내 티셔츠 주문 조회
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { data } = await supabaseAdmin
    .from('hub_up_tshirt_orders')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const { data: config } = await supabaseAdmin
    .from('hub_up_config')
    .select('key, value')
    .in('key', ['tshirt_sale_open', 'tshirt_sale_deadline', 'tshirt_change_deadline',
                 'tshirt_distribute_start', 'tshirt_bank_name', 'tshirt_bank_account',
                 'tshirt_bank_holder', 'tshirt_price_black', 'tshirt_price_white']);

  const configMap: Record<string, string> = {};
  (config || []).forEach((r: any) => { configMap[r.key] = r.value; });

  return NextResponse.json({ order: data, config: configMap });
}

// POST: 티셔츠 주문 생성/수정
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { items } = await req.json();
  if (!items?.length) return NextResponse.json({ error: '주문 항목을 선택해주세요.' }, { status: 400 });

  // 판매 기간 체크
  const { data: saleOpen } = await supabaseAdmin
    .from('hub_up_config').select('value').eq('key', 'tshirt_sale_open').maybeSingle();
  if (saleOpen?.value !== 'true') {
    return NextResponse.json({ error: '현재 티셔츠 판매 기간이 아닙니다.' }, { status: 403 });
  }

  const { data: existing } = await supabaseAdmin
    .from('hub_up_tshirt_orders')
    .select('id, status')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (existing) {
    // 변경 가능 기간 체크
    const { data: deadline } = await supabaseAdmin
      .from('hub_up_config').select('value').eq('key', 'tshirt_change_deadline').maybeSingle();
    if (deadline?.value && new Date() > new Date(deadline.value)) {
      return NextResponse.json({ error: '티셔츠 변경 기간이 종료되었습니다.' }, { status: 403 });
    }
    await supabaseAdmin
      .from('hub_up_tshirt_orders')
      .update({ items, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabaseAdmin.from('hub_up_tshirt_orders').insert({
      user_id: session.user.id,
      items,
    });
  }

  return NextResponse.json({ success: true });
}
