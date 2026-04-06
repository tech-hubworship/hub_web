import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@src/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/hub-up/config
 * 공개 config 조회 (인증 불필요)
 * 티셔츠 가격, 판매 여부, 행사 정보 등 자주 안 바뀌는 데이터
 * CDN에서 5분 캐싱
 */
export async function GET() {
  const { data: config } = await supabaseAdmin
    .from('hub_up_config')
    .select('key, value');

  const configMap: Record<string, string> = {};
  (config || []).forEach((row: { key: string; value: string }) => {
    configMap[row.key] = row.value;
  });

  return NextResponse.json(configMap, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
