import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ_KR = 'Asia/Seoul';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: '로그인 필요' });

  const { token, category } = req.body;
  const now = dayjs().tz(TZ_KR);

  // 1. 토큰 유효성 검사
  const { data: validToken } = await supabaseAdmin
    .from('qr_tokens')
    .select('*')
    .eq('token', token)
    .gt('expires_at', now.toISOString())
    .single();

  if (!validToken) {
    return res.status(400).json({ error: '만료되었거나 유효하지 않은 QR입니다.' });
  }

  // 2. 권한 체크 (OD인 경우)
  if (category === 'OD') {
    const { data: userRoles } = await supabaseAdmin
      .from('admin_roles')
      .select('roles(name)')
      .eq('user_id', session.user.id);
    
    // 리더십 관련 권한이 하나라도 있는지 확인
    const hasLeadership = userRoles?.some((r: any) => 
        ['리더십', 'MC', '목회자', '그룹장', '다락방장'].includes(r.roles?.name)
    );

    if (!hasLeadership) {
      return res.status(403).json({ error: '리더십 권한이 필요합니다.', code: 'REQUIRE_LEADERSHIP' });
    }
  }

  // 3. 지각비 계산 로직 (토요일 10:00 기준)
  // 오늘 날짜의 10:00 설정
  const baseDate = now.format('YYYY-MM-DD');
  const startTime = dayjs(`${baseDate} 10:00:00`).tz(TZ_KR);
  
  let status = 'present';
  let lateFee = 0;
  let isReportRequired = false;

  // 10시 이전: 정상
  if (now.isBefore(startTime)) {
    status = 'present';
  } else {
    const diffSeconds = now.diff(startTime, 'second');
    
    // ~ 10:39:59 (정상)
    if (diffSeconds < 2400) {
        status = 'present';
        lateFee = 0;
    }
    // 10:40 ~ 10:49:59 (1000원)
    else if (diffSeconds < 3000) {
        status = 'late';
        lateFee = 1000;
    }
    // 10:50 ~ 10:59:59 (2000원)
    else if (diffSeconds < 3600) {
        status = 'late';
        lateFee = 2000;
    }
    // 11:00 ~ 11:09:59 (3000원)
    else if (diffSeconds < 4200) {
        status = 'late';
        lateFee = 3000;
    }
    // 11:10 ~ 11:19:59 (4000원 + 보고서)
    else if (diffSeconds < 4800) {
        status = 'late';
        lateFee = 4000;
        isReportRequired = true;
    }
    // 11:20 이후 (5000원 + 보고서)
    else {
        status = 'unexcused_absence';
        lateFee = 5000;
        isReportRequired = true;
    }
  }

  // 4. 출석 저장 (중복 방지)
  const { error: insertError } = await supabaseAdmin
    .from('weekly_attendance')
    .insert({
        user_id: session.user.id,
        category,
        status,
        late_fee: lateFee,
        is_report_required: isReportRequired,
        week_date: baseDate, // 오늘 날짜를 주간 날짜로 사용
        attended_at: now.toISOString()
    });

  if (insertError) {
    if (insertError.code === '23505') { // Unique Key Violation
        return res.status(200).json({ message: '이미 출석했습니다.', alreadyChecked: true });
    }
    return res.status(500).json({ error: '출석 저장 실패' });
  }

  return res.status(200).json({ 
    message: '출석 완료', 
    result: { status, lateFee, isReportRequired } 
  });
}