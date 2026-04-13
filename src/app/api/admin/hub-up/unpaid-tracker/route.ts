import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

// 접근 허용 이메일 목록 (환경변수로 관리)
const ALLOWED_EMAILS = (process.env.UNPAID_TRACKER_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);

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
      .select('phone'),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 신청서 작성 여부: registrations에 같은 연락처가 있으면 true
  const registeredPhones = new Set((regsData ?? []).map((r: any) => r.phone?.replace(/\D/g, '')));
  const result = (trackerData ?? []).map((entry: any) => ({
    ...entry,
    registered: registeredPhones.has(entry.phone?.replace(/\D/g, '')),
  }));

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
