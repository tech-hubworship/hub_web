import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { getKoreanTimestamp } from '@src/lib/utils/date';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const userId = session.user.id || session.user.email;

  if (req.method === 'POST') {
    try {
      const { post_dt, day_number } = req.body;

      if (!post_dt || !day_number) {
        return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
      }

      if (typeof post_dt !== 'string' || post_dt.length !== 8) {
        return res.status(400).json({ error: '올바른 날짜 형식이 아닙니다. (YYYYMMDD)' });
      }

      // 이미 출석했는지 확인
      const { data: existing } = await supabaseAdmin
        .from('advent_attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('post_dt', post_dt)
        .single();

      if (existing) {
        return res.status(200).json({ 
          message: '이미 출석하셨습니다.',
          attendance: existing 
        });
      }

      // 출석 기록 생성 (한국 시간)
      const now = getKoreanTimestamp();
      const { data, error } = await supabaseAdmin
        .from('advent_attendance')
        .insert({
          user_id: userId,
          post_dt,
          day_number,
          reg_dt: now,
          mod_dt: now,
        })
        .select()
        .single();

      if (error) {
        console.error('출석 기록 오류:', error);
        return res.status(500).json({ error: '출석 기록에 실패했습니다.' });
      }

      return res.status(201).json({ attendance: data });
    } catch (error) {
      console.error('출석 기록 오류:', error);
      return res.status(500).json({ error: '출석 기록 중 오류가 발생했습니다.' });
    }
  }

  if (req.method === 'GET') {
    try {
      const { post_dt } = req.query;

      if (!post_dt || typeof post_dt !== 'string' || post_dt.length !== 8) {
        return res.status(400).json({ error: '올바른 날짜 형식이 아닙니다. (YYYYMMDD)' });
      }

      // 해당 날짜의 출석 여부 확인
      const { data: attendance, error } = await supabaseAdmin
        .from('advent_attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('post_dt', post_dt)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('출석 조회 오류:', error);
        return res.status(500).json({ error: '출석 조회에 실패했습니다.' });
      }

      return res.status(200).json({ attendance: attendance || null });
    } catch (error) {
      console.error('출석 조회 오류:', error);
      return res.status(500).json({ error: '출석 조회 중 오류가 발생했습니다.' });
    }
  }

  return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
}
