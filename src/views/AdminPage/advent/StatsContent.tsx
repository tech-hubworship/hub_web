import { useState, useEffect } from 'react';
import styled from '@emotion/styled';

const Container = styled.div`
  padding: 24px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
`;

const Section = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 20px;
`;

const PeriodInfo = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #724886;
`;

const ChartContainer = styled.div`
  position: relative;
  height: 300px;
  margin-top: 20px;
`;

const ChartBar = styled.div<{ height: number; maxHeight: number }>`
  position: relative;
  width: 100%;
  height: ${props => (props.height / props.maxHeight) * 100}%;
  background: linear-gradient(180deg, #724886 0%, #9d6fb8 100%);
  border-radius: 4px 4px 0 0;
  min-height: ${props => props.height > 0 ? '4px' : '0'};
  transition: height 0.3s ease;
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  gap: 8px;
  height: 300px;
  align-items: flex-end;
`;

const ChartLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  margin-top: 8px;
  transform: rotate(-45deg);
  transform-origin: center;
  white-space: nowrap;
`;

const ChartValue = styled.div`
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableHead = styled.th`
  padding: 12px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
`;

const TableRow = styled.tr`
  &:hover {
    background: #f9fafb;
  }
`;

const TableData = styled.td`
  padding: 12px;
  font-size: 14px;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 16px;
`;

const ErrorText = styled.div`
  text-align: center;
  padding: 40px;
  color: #ef4444;
  font-size: 16px;
`;

interface TodayStats {
  completed: number;
  commentOnly: number;
  attendanceOnly: number;
  commentCount: number;
  attendanceCount: number;
}

interface DailyStat {
  date: string;
  dayNumber: number;
  completed: number;
  commentOnly: number;
  attendanceOnly: number;
  commentCount: number;
  attendanceCount: number;
}

interface CumulativeStat {
  date: string;
  dayNumber: number;
  cumulativeCompleted: number;
}

interface StatsData {
  today: TodayStats;
  daily: DailyStat[];
  streaks: Record<number, number>;
  cumulative: CumulativeStat[];
}

export default function AdventStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/advent/stats');
      const data = await response.json();

      if (response.ok) {
        setStats(data);
      } else {
        setError(data.error || '통계를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingText>통계를 불러오는 중...</LoadingText>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorText>{error}</ErrorText>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container>
        <ErrorText>통계 데이터가 없습니다.</ErrorText>
      </Container>
    );
  }

  const maxDailyCompleted = Math.max(...stats.daily.filter(d => d.dayNumber >= 1).map(d => d.completed), 1);
  const maxCumulative = Math.max(...stats.cumulative.filter(c => c.dayNumber >= 1).map(c => c.cumulativeCompleted), 1);

  const formatDate = (dateStr: string) => {
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${month}/${day}`;
  };

  return (
    <Container>
      {/* 기간 정보 */}
      <PeriodInfo>
        📅 통계 기간: 2025년 11월 30일 ~ 2025년 12월 25일 (총 26일)
      </PeriodInfo>

      {/* 오늘 통계 카드 */}
      <StatsGrid>
        <StatCard>
          <StatLabel>오늘 완료 (묵상+출석)</StatLabel>
          <StatValue>{stats.today.completed}명</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>오늘 묵상만</StatLabel>
          <StatValue>{stats.today.commentOnly}명</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>오늘 출석만</StatLabel>
          <StatValue>{stats.today.attendanceOnly}명</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>오늘 묵상 총</StatLabel>
          <StatValue>{stats.today.commentCount}명</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>오늘 출석 총</StatLabel>
          <StatValue>{stats.today.attendanceCount}명</StatValue>
        </StatCard>
      </StatsGrid>

      {/* 일별 완료 통계 */}
      <Section>
        <SectionTitle>일별 완료 통계 (묵상+출석)</SectionTitle>
        <ChartContainer>
          <ChartGrid>
            {stats.daily
              .filter(day => day.dayNumber >= 1)
              .map((day) => (
                <div key={day.date} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <ChartBar height={day.completed} maxHeight={maxDailyCompleted}>
                      {day.completed > 0 && (
                        <ChartValue>{day.completed}</ChartValue>
                      )}
                    </ChartBar>
                  </div>
                  <ChartLabel>{day.dayNumber}일</ChartLabel>
                </div>
              ))}
          </ChartGrid>
        </ChartContainer>
      </Section>

      {/* 누적 완료 통계 */}
      <Section>
        <SectionTitle>누적 완료 통계 (1일차부터 연속 완료)</SectionTitle>
        <ChartContainer>
          <ChartGrid>
            {stats.cumulative
              .filter(cum => cum.dayNumber >= 1)
              .map((cum) => (
                <div key={cum.date} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <ChartBar height={cum.cumulativeCompleted} maxHeight={maxCumulative}>
                      {cum.cumulativeCompleted > 0 && (
                        <ChartValue>{cum.cumulativeCompleted}</ChartValue>
                      )}
                    </ChartBar>
                  </div>
                  <ChartLabel>{cum.dayNumber}일</ChartLabel>
                </div>
              ))}
          </ChartGrid>
        </ChartContainer>
      </Section>

      {/* 연속 완료 일수 통계 */}
      <Section>
        <SectionTitle>연속 완료 일수별 통계</SectionTitle>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>연속 완료 일수</TableHead>
              <TableHead>인원 수</TableHead>
            </tr>
          </TableHeader>
          <tbody>
            {Object.entries(stats.streaks)
              .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
              .map(([days, count]) => (
                <TableRow key={days}>
                  <TableData>{days}일</TableData>
                  <TableData>{count}명</TableData>
                </TableRow>
              ))}
          </tbody>
        </Table>
      </Section>

      {/* 일별 상세 통계 테이블 */}
      <Section>
        <SectionTitle>일별 상세 통계</SectionTitle>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>일차</TableHead>
              <TableHead>날짜</TableHead>
              <TableHead>완료 (묵상+출석)</TableHead>
              <TableHead>묵상만</TableHead>
              <TableHead>출석만</TableHead>
              <TableHead>묵상 총</TableHead>
              <TableHead>출석 총</TableHead>
            </tr>
          </TableHeader>
          <tbody>
            {stats.daily
              .filter(day => day.dayNumber >= 1)
              .map((day) => (
                <TableRow key={day.date}>
                  <TableData>{day.dayNumber}일차</TableData>
                  <TableData>{formatDate(day.date)}</TableData>
                  <TableData>{day.completed}명</TableData>
                  <TableData>{day.commentOnly}명</TableData>
                  <TableData>{day.attendanceOnly}명</TableData>
                  <TableData>{day.commentCount}명</TableData>
                  <TableData>{day.attendanceCount}명</TableData>
                </TableRow>
              ))}
          </tbody>
        </Table>
      </Section>
    </Container>
  );
}

