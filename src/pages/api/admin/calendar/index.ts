import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { clampDateParam, toSeoulEndOfDayISO, toSeoulStartOfDayISO } from '@src/lib/calendar/dateRange';
import { checkMenuPermission } from '@src/lib/utils/menu-permission';

// 서비스 키를 사용한 Supabase 클라이언트 (RLS 우회)
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function requireCalendarPermission(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return { ok: false as const, status: 401, message: '인증이 필요합니다.' };
  }
  if (!session.user.isAdmin) {
    return { ok: false as const, status: 403, message: '관리자 권한이 필요합니다.' };
  }

  const roles = session.user.roles || [];
  const { hasPermission, error } = await checkMenuPermission(roles, 'calendar');
  if (!hasPermission) {
    return { ok: false as const, status: 403, message: error || '권한이 없습니다.' };
  }

  // 이후 로직에서 session.user nullable 이슈를 피하기 위해 필요한 값만 반환
  return { ok: true as const, userId: session.user.id as string };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = await requireCalendarPermission(req, res);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res, auth.userId);
      default:
        return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
    }
  } catch (e) {
    console.error('admin calendar-events API Error:', e);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const from = clampDateParam(req.query.from);
  const to = clampDateParam(req.query.to);

  if (!from || !to) {
    return res.status(400).json({ error: 'from/to(YYYY-MM-DD) 파라미터가 필요합니다.' });
  }

  const fromISO = toSeoulStartOfDayISO(from);
  const toISO = toSeoulEndOfDayISO(to);

  const { data, error } = await supabaseClient
    .from('calendar_events')
    .select('*')
    .lte('start_at', toISO)
    .or(`end_at.gte.${fromISO},end_at.is.null`)
    .order('start_at', { ascending: true });

  if (error) {
    console.error('admin calendar-events 조회 오류:', error);
    return res.status(500).json({ error: '일정 조회 실패' });
  }

  return res.status(200).json({ success: true, data: data || [] });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const {
    title,
    start_at,
    end_at,
    all_day = false,
    location = null,
    description = null,
    is_public = true,
  } = req.body || {};

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title은 필수입니다.' });
  }
  if (!start_at || typeof start_at !== 'string') {
    return res.status(400).json({ error: 'start_at은 필수입니다.' });
  }
  if (end_at !== null && end_at !== undefined && typeof end_at !== 'string') {
    return res.status(400).json({ error: 'end_at 형식이 올바르지 않습니다.' });
  }

  const insertPayload = {
    title: title.trim(),
    start_at,
    end_at: end_at ?? null,
    all_day: Boolean(all_day),
    location: typeof location === 'string' ? location.trim() : null,
    description: typeof description === 'string' ? description.trim() : null,
    is_public: Boolean(is_public),
    created_by: userId,
  };

  const { data, error } = await supabaseClient
    .from('calendar_events')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    console.error('admin calendar-events 생성 오류:', error);
    return res.status(500).json({ error: '일정 생성 실패' });
  }

  return res.status(201).json({ success: true, data });
}

