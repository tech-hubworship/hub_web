import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import dayjs from 'dayjs';
import crypto from 'crypto';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  // MC 권한 체크 (간단 버전)
  if (!session?.user?.isAdmin && !session?.user?.roles?.includes('MC')) {
     return res.status(403).json({ error: '권한이 없습니다.' });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { category } = req.body;
  const now = dayjs().tz('Asia/Seoul');

  // 1. 카테고리별 시간 제한 (OD는 토요일 10시 이후 등)
  if (category === 'OD') {
    // 테스트 중이라면 이 부분 주석 처리
    // if (now.day() === 6 && now.hour() < 10) {
    //     return res.status(400).json({ error: 'OD QR은 토요일 10시부터 생성 가능합니다.' });
    // }
  }

  // 2. 랜덤 토큰 생성 (16진수)
  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = now.add(1, 'minute').toISOString(); // 1분 유효

  // 3. DB 저장
  const { error } = await supabaseAdmin
    .from('qr_tokens')
    .insert({
      token,
      category,
      created_by: session?.user?.id,
      expires_at: expiresAt
    });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'QR 생성 실패' });
  }

  return res.status(200).json({ token, expiresAt });
}