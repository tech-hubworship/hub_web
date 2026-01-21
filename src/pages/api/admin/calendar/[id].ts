import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
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

  return { ok: true as const, session };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = await requireCalendarPermission(req, res);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

    const id = Number(req.query.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: '유효하지 않은 id입니다.' });
    }

    switch (req.method) {
      case 'PUT':
        return await handlePut(req, res, id);
      case 'DELETE':
        return await handleDelete(req, res, id);
      default:
        return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
    }
  } catch (e) {
    console.error('admin calendar-events/[id] API Error:', e);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, id: number) {
  const {
    title,
    start_at,
    end_at,
    all_day,
    location,
    description,
    is_public,
  } = req.body || {};

  const updates: any = {};
  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title 형식이 올바르지 않습니다.' });
    }
    updates.title = title.trim();
  }
  if (start_at !== undefined) {
    if (typeof start_at !== 'string') return res.status(400).json({ error: 'start_at 형식이 올바르지 않습니다.' });
    updates.start_at = start_at;
  }
  if (end_at !== undefined) {
    if (end_at !== null && typeof end_at !== 'string') return res.status(400).json({ error: 'end_at 형식이 올바르지 않습니다.' });
    updates.end_at = end_at ?? null;
  }
  if (all_day !== undefined) updates.all_day = Boolean(all_day);
  if (location !== undefined) updates.location = typeof location === 'string' ? location.trim() : null;
  if (description !== undefined) updates.description = typeof description === 'string' ? description.trim() : null;
  if (is_public !== undefined) updates.is_public = Boolean(is_public);

  const { data, error } = await supabaseClient
    .from('calendar_events')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('admin calendar-events 수정 오류:', error);
    return res.status(500).json({ error: '일정 수정 실패' });
  }

  return res.status(200).json({ success: true, data });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, id: number) {
  const { error } = await supabaseClient
    .from('calendar_events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('admin calendar-events 삭제 오류:', error);
    return res.status(500).json({ error: '일정 삭제 실패' });
  }

  return res.status(200).json({ success: true });
}

