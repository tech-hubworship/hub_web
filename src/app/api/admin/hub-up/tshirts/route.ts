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

  const { data, error } = await supabaseAdmin
    .from('hub_up_tshirt_orders')
    .select('id, created_at, updated_at, items, deposit_confirm, status, qr_code, user_id')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data.length === 0) return NextResponse.json([]);

  const userIds = data.map(d => d.user_id);

  // profiles: 그룹 + 다락방 조인
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('user_id, name, hub_groups!fk_group_id(name), hub_cells!fk_cell_id(name)')
    .in('user_id', userIds);

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  // 연락처
  const { data: regs } = await supabaseAdmin
    .from('hub_up_registrations')
    .select('user_id, phone, community')
    .in('user_id', userIds);

  const regMap = new Map<string, { phone: string; community: string }>();
  regs?.forEach(r => regMap.set(r.user_id, { phone: r.phone, community: r.community || '' }));

  const profileMap = new Map<string, { name: string; phone: string; community: string; group_name: string; cell_name: string }>();
  profiles?.forEach((p: any) => {
    const reg = regMap.get(p.user_id) || { phone: '', community: '' };
    profileMap.set(p.user_id, {
      name: p.name,
      phone: reg.phone,
      community: reg.community,
      group_name: p.hub_groups?.name || '알수없음',
      cell_name: p.hub_cells?.name || '',
    });
  });

  const formattedData = data.map(d => {
    const prof = profileMap.get(d.user_id) || { name: '알수없음', phone: '', community: '', group_name: '', cell_name: '' };
    return { ...d, name: prof.name, phone: prof.phone, community: prof.community, group_name: prof.group_name, cell_name: prof.cell_name };
  });

  return NextResponse.json(formattedData);
}

// DELETE: 티셔츠 주문 취소 (삭제)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { ids } = await req.json();
  if (!ids?.length) return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('hub_up_tshirt_orders')
    .delete()
    .in('id', ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH: 여러 티셔츠 주문 상태 업데이트 (bulk)
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
