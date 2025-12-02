import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@src/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: '관리자만 접근할 수 있습니다.' });
    }

    // 쿼리 파라미터에서 시작일과 종료일 가져오기 (선택적)
    const { startDate: startDateParam, endDate: endDateParam } = req.query;

    // 오늘 날짜 (한국 시간 기준)
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const todayStr = koreanTime.toISOString().slice(0, 10).replace(/-/g, '');

    // 오늘 묵상+출석한 사람 수
    const { data: todayComments } = await supabaseAdmin
      .from('advent_comments')
      .select('reg_id, reg_dt')
      .eq('post_dt', todayStr);

    const { data: todayAttendance } = await supabaseAdmin
      .from('advent_attendance')
      .select('user_id, reg_dt')
      .eq('post_dt', todayStr);

    const todayCommentUserIds = new Set(todayComments?.map(c => c.reg_id) || []);
    const todayAttendanceUserIds = new Set(todayAttendance?.map(a => a.user_id) || []);
    
    // 오늘 묵상과 출석을 모두 한 사람
    const todayCompleted = Array.from(todayCommentUserIds).filter(
      userId => todayAttendanceUserIds.has(userId)
    ).length;
    
    // 오늘 묵상만 한 사람 (출석 안함)
    const todayCommentOnly = Array.from(todayCommentUserIds).filter(
      userId => !todayAttendanceUserIds.has(userId)
    ).length;
    
    // 오늘 출석만 한 사람 (묵상 안함)
    const todayAttendanceOnly = Array.from(todayAttendanceUserIds).filter(
      userId => !todayCommentUserIds.has(userId)
    ).length;

    // 기간 설정 (2025-11-30 ~ 2025-12-25, 총 26일)
    // 로컬 시간대를 사용하여 날짜 생성 (시간대 문제 방지)
    const allDates: string[] = [];
    const startDate = new Date(2025, 10, 30, 12, 0, 0); // 정오 시간으로 설정하여 시간대 문제 방지
    const endDate = new Date(2025, 11, 25, 12, 0, 0); // 정오 시간으로 설정
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // 로컬 시간대 기준으로 날짜 문자열 생성
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      allDates.push(dateStr);
      
      // 다음 날로 이동
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 일차 계산 함수
    const getDayNumber = (dateStr: string): number => {
      const year = parseInt(dateStr.slice(0, 4), 10);
      const month = parseInt(dateStr.slice(4, 6), 10) - 1;
      const day = parseInt(dateStr.slice(6, 8), 10);
      const currentDate = new Date(year, month, day);
      const baseDate = new Date(2025, 10, 30);
      const diffTime = currentDate.getTime() - baseDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1;
    };

    // 각 날짜별로 묵상+출석 완료한 사람 수 조회
    const dailyStats = await Promise.all(
      allDates.map(async (dateStr) => {
        const dayNumber = getDayNumber(dateStr);
        
        // 1일차 이상만 포함
        if (dayNumber < 1) {
          return null;
        }

        const { data: comments } = await supabaseAdmin
          .from('advent_comments')
          .select('reg_id')
          .eq('post_dt', dateStr);

        const { data: attendance } = await supabaseAdmin
          .from('advent_attendance')
          .select('user_id')
          .eq('post_dt', dateStr);

        const commentUserIds = new Set(comments?.map(c => c.reg_id) || []);
        const attendanceUserIds = new Set(attendance?.map(a => a.user_id) || []);

        // 묵상과 출석을 모두 한 사람
        const completed = Array.from(commentUserIds).filter(
          userId => attendanceUserIds.has(userId)
        );
        
        // 묵상만 한 사람 (출석 안함)
        const commentOnly = Array.from(commentUserIds).filter(
          userId => !attendanceUserIds.has(userId)
        );
        
        // 출석만 한 사람 (묵상 안함)
        const attendanceOnly = Array.from(attendanceUserIds).filter(
          userId => !commentUserIds.has(userId)
        );

        return {
          date: dateStr,
          dayNumber: dayNumber,
          completed: completed.length,
          commentOnly: commentOnly.length,
          attendanceOnly: attendanceOnly.length,
          commentCount: comments?.length || 0,
          attendanceCount: attendance?.length || 0,
        };
      })
    ).then(results => results.filter((r): r is NonNullable<typeof r> => r !== null));

    // 누적 연속 완료 통계
    // 각 사용자별로 연속 완료 일수 계산
    const { data: allComments } = await supabaseAdmin
      .from('advent_comments')
      .select('reg_id, post_dt')
      .in('post_dt', allDates)
      .order('post_dt', { ascending: true });

    const { data: allAttendance } = await supabaseAdmin
      .from('advent_attendance')
      .select('user_id, post_dt')
      .in('post_dt', allDates)
      .order('post_dt', { ascending: true });

    // 사용자별 완료 날짜 집합 생성 (묵상과 출석을 모두 한 경우만 완료)
    const userCommentDates: Record<string, Set<string>> = {};
    const userAttendanceDates: Record<string, Set<string>> = {};
    
    allComments?.forEach(c => {
      if (!userCommentDates[c.reg_id]) {
        userCommentDates[c.reg_id] = new Set();
      }
      userCommentDates[c.reg_id].add(c.post_dt);
    });

    allAttendance?.forEach(a => {
      if (!userAttendanceDates[a.user_id]) {
        userAttendanceDates[a.user_id] = new Set();
      }
      userAttendanceDates[a.user_id].add(a.post_dt);
    });

    // 묵상과 출석을 모두 한 날짜만 완료로 간주
    const userCompletedDates: Record<string, Set<string>> = {};
    Object.keys(userCommentDates).forEach(userId => {
      if (userAttendanceDates[userId]) {
        userCompletedDates[userId] = new Set();
        userCommentDates[userId].forEach(dateStr => {
          if (userAttendanceDates[userId].has(dateStr)) {
            userCompletedDates[userId].add(dateStr);
          }
        });
      }
    });

    // 각 사용자별로 연속 완료 일수 계산
    const userStreaks: number[] = [];
    Object.entries(userCompletedDates).forEach(([userId, completedDates]) => {
      let maxStreak = 0;
      let currentStreak = 0;

      allDates.forEach(dateStr => {
        if (completedDates.has(dateStr)) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });

      if (maxStreak > 0) {
        userStreaks.push(maxStreak);
      }
    });

    // 연속 완료 일수별 통계
    const streakStats: Record<number, number> = {};
    userStreaks.forEach(streak => {
      streakStats[streak] = (streakStats[streak] || 0) + 1;
    });

    // 누적 완료 통계 (1일차부터 N일차까지 완료한 사람 수)
    const cumulativeStats = allDates
      .map((dateStr, index) => {
        const dayNumber = getDayNumber(dateStr);
        
        // 1일차 이상만 포함
        if (dayNumber < 1) {
          return null;
        }

        const datesUpToToday = allDates.slice(0, index + 1).filter(d => getDayNumber(d) >= 1);
        const usersCompletedAll = Object.entries(userCompletedDates).filter(
          ([userId, completedDates]) => {
            return datesUpToToday.every(d => completedDates.has(d));
          }
        ).length;

        return {
          date: dateStr,
          dayNumber: dayNumber,
          cumulativeCompleted: usersCompletedAll,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    // 시간대별 누적 추이 계산 (날짜별로 분리)
    // 기간 설정 (시작일과 종료일이 제공되면 해당 기간 사용, 아니면 오늘만)
    let targetDates: string[] = [];
    if (startDateParam && endDateParam && typeof startDateParam === 'string' && typeof endDateParam === 'string') {
      // YYYY-MM-DD 형식을 YYYYMMDD로 변환
      const startDateStr = startDateParam.replace(/-/g, '');
      const endDateStr = endDateParam.replace(/-/g, '');
      
      // 날짜 범위 생성
      const start = new Date(
        parseInt(startDateStr.slice(0, 4), 10),
        parseInt(startDateStr.slice(4, 6), 10) - 1,
        parseInt(startDateStr.slice(6, 8), 10)
      );
      const end = new Date(
        parseInt(endDateStr.slice(0, 4), 10),
        parseInt(endDateStr.slice(4, 6), 10) - 1,
        parseInt(endDateStr.slice(6, 8), 10)
      );
      
      const current = new Date(start);
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        targetDates.push(`${year}${month}${day}`);
        current.setDate(current.getDate() + 1);
      }
    } else {
      // 기간이 제공되지 않으면 오늘만
      targetDates = [todayStr];
    }

    // 각 날짜별로 시간대별 누적 추이 계산
    const hourlyCumulativeByDate: Array<{
      date: string;
      dayNumber: number;
      hourlyData: Array<{ hour: number; cumulative: number }>;
    }> = [];

    for (const dateStr of targetDates) {
      const dayNumber = getDayNumber(dateStr);
      if (dayNumber < 1) continue;

      // 해당 날짜의 묵상과 출석 데이터 조회
      const { data: dateComments } = await supabaseAdmin
        .from('advent_comments')
        .select('reg_id, reg_dt')
        .eq('post_dt', dateStr);

      const { data: dateAttendance } = await supabaseAdmin
        .from('advent_attendance')
        .select('user_id, reg_dt')
        .eq('post_dt', dateStr);

      // 0시부터 23시까지 초기화
      const hourlyData: Array<{ hour: number; cumulative: number }> = [];
      for (let hour = 0; hour < 24; hour++) {
        hourlyData.push({ hour, cumulative: 0 });
      }

      const userActivityTimes: Array<{ userId: string; hour: number }> = [];

      // 묵상 데이터 처리
      dateComments?.forEach(comment => {
        if (comment.reg_id && comment.reg_dt) {
          try {
            const regDate = new Date(comment.reg_dt);
            // 한국 시간대 (Asia/Seoul)로 변환하여 시간 추출
            const formatter = new Intl.DateTimeFormat('en-US', {
              timeZone: 'Asia/Seoul',
              hour: 'numeric',
              hour12: false
            });
            const parts = formatter.formatToParts(regDate);
            const hourPart = parts.find(part => part.type === 'hour');
            if (hourPart) {
              const hour = parseInt(hourPart.value, 10);
              if (!isNaN(hour) && hour >= 0 && hour < 24) {
                userActivityTimes.push({ userId: comment.reg_id, hour });
              }
            }
          } catch (e) {
            // 날짜 파싱 실패 시 무시
          }
        }
      });

      // 출석 데이터 처리
      dateAttendance?.forEach(attendance => {
        if (attendance.user_id && attendance.reg_dt) {
          try {
            const regDate = new Date(attendance.reg_dt);
            // 한국 시간대 (Asia/Seoul)로 변환하여 시간 추출
            const formatter = new Intl.DateTimeFormat('en-US', {
              timeZone: 'Asia/Seoul',
              hour: 'numeric',
              hour12: false
            });
            const parts = formatter.formatToParts(regDate);
            const hourPart = parts.find(part => part.type === 'hour');
            if (hourPart) {
              const hour = parseInt(hourPart.value, 10);
              if (!isNaN(hour) && hour >= 0 && hour < 24) {
                userActivityTimes.push({ userId: attendance.user_id, hour });
              }
            }
          } catch (e) {
            // 날짜 파싱 실패 시 무시
          }
        }
      });

      // 각 시간대별로 누적 완료 인원 계산
      const usersByHour = new Map<number, Set<string>>();
      userActivityTimes.forEach(({ userId, hour }) => {
        if (!usersByHour.has(hour)) {
          usersByHour.set(hour, new Set());
        }
        usersByHour.get(hour)!.add(userId);
      });

      // 누적 계산
      const cumulativeUsers = new Set<string>();
      for (let hour = 0; hour < 24; hour++) {
        const usersAtHour = usersByHour.get(hour);
        if (usersAtHour) {
          usersAtHour.forEach(userId => cumulativeUsers.add(userId));
        }
        hourlyData[hour].cumulative = cumulativeUsers.size;
      }

      // 데이터가 있는 경우에만 추가 (모든 시간대가 0이어도 추가)
      hourlyCumulativeByDate.push({
        date: dateStr,
        dayNumber,
        hourlyData,
      });
    }

    // 기존 형식도 유지 (하위 호환성)
    const hourlyCumulative: Array<{ hour: number; cumulative: number }> = [];
    for (let hour = 0; hour < 24; hour++) {
      hourlyCumulative.push({ hour, cumulative: 0 });
    }

    return res.status(200).json({
      today: {
        completed: todayCompleted,
        commentOnly: todayCommentOnly,
        attendanceOnly: todayAttendanceOnly,
        commentCount: todayComments?.length || 0,
        attendanceCount: todayAttendance?.length || 0,
      },
      daily: dailyStats || [],
      streaks: streakStats || {},
      cumulative: cumulativeStats || [],
      hourlyCumulative: hourlyCumulative,
      hourlyCumulativeByDate: hourlyCumulativeByDate || [],
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    return res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
  }
}

