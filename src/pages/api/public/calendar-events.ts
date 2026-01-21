import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { clampDateParam, toSeoulEndOfDayISO, toSeoulStartOfDayISO } from '@src/lib/calendar/dateRange';

// 서비스 키를 사용한 Supabase 클라이언트 (RLS 우회)
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }

  const from = clampDateParam(req.query.from);
  const to = clampDateParam(req.query.to);

  if (!from || !to) {
    return res.status(400).json({ error: 'from/to(YYYY-MM-DD) 파라미터가 필요합니다.' });
  }

  try {
    const fromISO = toSeoulStartOfDayISO(from);
    const toISO = toSeoulEndOfDayISO(to);

    // 기간 겹침 조건:
    // start_at <= to && (end_at >= from || end_at is null)
    const { data, error } = await supabaseClient
      .from('calendar_events')
      .select('*')
      .eq('is_public', true)
      .lte('start_at', toISO)
      .or(`end_at.gte.${fromISO},end_at.is.null`)
      .order('start_at', { ascending: true });

    if (error) {
      console.error('calendar-events 조회 오류:', error);
      return res.status(500).json({ error: '일정 조회 실패' });
    }

    return res.status(200).json({ success: true, data: data || [] });
  } catch (e) {
    console.error('calendar-events API Error:', e);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

