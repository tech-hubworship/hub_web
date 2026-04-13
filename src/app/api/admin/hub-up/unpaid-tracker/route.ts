import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

// 접근 허용 이메일 목록
const ALLOWED_EMAILS = ['skj45691234@gmail.com', 'jhp6413@gmail.com', 'dlwldnjs7138@gmail.com'];

function hasAccess(session: any) {
  const email = session?.user?.email ?? '';
  return session?.user?.isAdmin && ALLOWED_EMAILS.includes(email);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!hasAccess(session)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const [{ data: trackerData, error }, { data: regsData }] = await Promise.all([
    supabaseAdmin
      .from('hub_up_unpaid_tracker')
      .select('*')
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('hub_up_registrations')
      .select('phone, admin_deposit_confirm'),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 연락처 기준으로 신청 여부 + 입금확인 여부 자동 매칭
  const regMap = new Map<string, { registered: boolean; deposit_confirmed: boolean }>();
  (regsData ?? []).forEach((r: any) => {
    const normalized = r.phone?.replace(/\D/g, '');
    if (normalized) regMap.set(normalized, {
      registered: true,
      deposit_confirmed: r.admin_deposit_confirm ?? false,
    });
  });

  const result = (trackerData ?? []).map((entry: any) => {
    const normalized = entry.phone?.replace(/\D/g, '');
    const match = regMap.get(normalized ?? '');
    return {
      ...entry,
      registered: match?.registered ?? false,
      deposit_confirmed: match?.deposit_confirmed ?? false,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!hasAccess(session)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { name, phone } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('hub_up_unpaid_tracker')
    .insert({ name: name.trim(), phone: phone?.trim() ?? '' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
