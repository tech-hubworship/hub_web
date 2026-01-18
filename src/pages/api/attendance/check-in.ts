import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@src/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from'../auth/[...nextauth]';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ_KR = 'Asia/Seoul';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: '로그인이 필요합니다.' });

  const { token, category } = req.body;
  const now = dayjs().tz(TZ_KR);

  try {
    // 1. 토큰 유효성 검사
    const { data: validToken, error: tokenError } = await supabaseAdmin
      .from('qr_tokens')
      .select('*')
      .eq('token', token)
      .gt('expires_at', now.toISOString())
      .single();

    if (tokenError || !validToken) {
      return res.status(400).json({ error: '유효하지 않거나 만료된 QR 코드입니다.' });
    }

    // 2. 권한 체크 (OD인 경우)
    if (category === 'OD') {
      const { data: userRoles } = await supabaseAdmin
        .from('admin_roles')
        .select('roles(name)')
        .eq('user_id', session.user.id);
      
      const hasLeadership = userRoles?.some((r: any) => 
          ['리더십', 'MC', '목회자', '그룹장', '다락방장'].includes(r.roles?.name)
      );

      if (!hasLeadership) {
        return res.status(403).json({ 
          error: '리더십 권한이 필요합니다.', 
          code: 'REQUIRE_LEADERSHIP' 
        });
      }
    }

    // 3. 지각 여부 계산
    const baseDate = now.format('YYYY-MM-DD');
    const startTime = dayjs(`${baseDate} 10:00:00`).tz(TZ_KR);
    
    let status = 'present';
    let lateFee = 0;
    let isReportRequired = false;

    if (now.isAfter(startTime)) {
      const diffSeconds = now.diff(startTime, 'second');
      if (diffSeconds < 2400) { status = 'present'; }
      else if (diffSeconds < 3000) { status = 'late'; lateFee = 1000; }
      else if (diffSeconds < 3600) { status = 'late'; lateFee = 2000; }
      else if (diffSeconds < 4200) { status = 'late'; lateFee = 3000; }
      else if (diffSeconds < 4800) { status = 'late'; lateFee = 4000; isReportRequired = true; }
      else { status = 'unexcused_absence'; lateFee = 5000; isReportRequired = true; }
    }

    // 4. 출석 데이터 저장 시도
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('weekly_attendance')
      .insert({
          user_id: session.user.id,
          category,
          status,
          late_fee: lateFee,
          is_report_required: isReportRequired,
          week_date: baseDate,
          attended_at: now.toISOString()
      })
      .select()
      .single();

    // 5. [중요] 이미 출석한 경우 (Duplicate Error) 처리
    if (insertError) {
      if (insertError.code === '23505') { 
          // 이미 존재하는 기록을 조회해서 반환해야 함 (그래야 프론트가 안 죽음)
          const { data: existingData } = await supabaseAdmin
            .from('weekly_attendance')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('category', category)
            .eq('week_date', baseDate)
            .single();

          return res.status(200).json({ 
            message: '이미 출석이 완료되었습니다.', 
            alreadyChecked: true, 
            result: existingData // ⭐️ 기존 데이터 반환 필수
          });
      }
      return res.status(500).json({ error: '출석 저장 중 오류가 발생했습니다.' });
    }

    // 정상 출석 성공
    return res.status(200).json({ 
      message: '출석이 완료되었습니다.', 
      result: insertedData 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}