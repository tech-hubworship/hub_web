/**
 * 사용자 이름 조회 API (캐싱 최적화)
 * GET /api/prayer-time/user-name?user_id=xxx
 * 
 * Realtime 이벤트에서 사용자 이름을 가져올 때 사용
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@src/lib/auth';
import { supabaseAdmin } from '@src/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('user_id');

    if (!userId) {
      return Response.json({ error: 'user_id가 필요합니다.' }, { status: 400 });
    }

    // 사용자 이름 조회
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      return Response.json({ name: '알 수 없음' }, { status: 200 });
    }

    // 캐시 헤더 설정
    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

    return Response.json({ name: profile.name || '알 수 없음' }, { headers });
  } catch (error) {
    console.error('User name API error:', error);
    return Response.json({ name: '알 수 없음' }, { status: 200 });
  }
}
