import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

/**
 * POST /api/admin/hub-up/waitlist
 * 대기자를 정식 명단으로 승인
 * body: { id: string }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('hub_up_registrations')
    .update({
      is_waitlist: false,
      waitlist_approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('is_waitlist', true); // 이미 정식 명단인 경우 방지

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
