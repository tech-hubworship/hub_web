import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

// GET: 티셔츠 주문 목록 반환
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  // user_id로 profiles와 조인하여 신청자 정보 가져오기
  const { data, error } = await supabaseAdmin
    .from('hub_up_tshirt_orders')
    .select(`
      id, created_at, updated_at, items, deposit_confirm, status, qr_code, user_id
    `)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // profiles 정보 추가 조회
  const userIds = data.map(d => d.user_id);
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('user_id, name, call_number, hub_groups!fk_group_id(name)')
    .in('user_id', userIds);

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const profileMap = new Map();
  profiles?.forEach(p => {
    profileMap.set(p.user_id, {
      name: p.name,
      phone: p.call_number,
      group_name: (p.hub_groups as any)?.name || '알수없음'
    });
  });

  const formattedData = data.map(d => {
    const prof = profileMap.get(d.user_id) || { name: '알수없음', phone: '', group_name: '' };
    return {
      ...d,
      name: prof.name,
      phone: prof.phone,
      group_name: prof.group_name
    };
  });

  return NextResponse.json(formattedData);
}

// PATCH: 여러 티셔츠 주문 상태/입금 확인 업데이트 (bulk)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { ids, status } = await req.json();
  if (!ids || !status) return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('hub_up_tshirt_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
