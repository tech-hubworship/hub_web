"use client"

import { useState, useEffect, useMemo } from 'react';
import styled from '@emotion/styled';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart, Cell, ComposedChart, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartConfig, ChartTooltipContent } from '@src/components/ui/chart';

const Container = styled.div`
  padding: 24px;
  background: #f8fafc;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
`;

const PeriodInfo = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #64748b;
  margin-top: 12px;
`;

const FilterSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FilterLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #475569;
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  min-width: 150px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
`;

const StatSubtext = styled.div`
  font-size: 12px;
  color: #94a3b8;
`;

const Section = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
`;

const SectionDescription = styled.p`
  font-size: 13px;
  color: #64748b;
  margin: 0 0 20px 0;
`;

const ChartWrapper = styled.div`
  width: 100%;
  min-height: 350px;
  height: 350px;
  margin-top: 20px;
  position: relative;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
`;

const TableHeader = styled.thead`
  background: #f8fafc;
`;

const TableHead = styled.th`
  padding: 12px 14px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
`;

const TableRow = styled.tr`
  &:hover {
    background: #f8fafc;
  }
`;

const TableData = styled.td`
  padding: 12px 14px;
  font-size: 13px;
  color: #334155;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
`;

const Badge = styled.span<{ variant?: 'success' | 'info' }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: ${props => props.variant === 'success' ? '#d1fae5' : '#dbeafe'};
  color: ${props => props.variant === 'success' ? '#065f46' : '#1e40af'};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px;
  color: #64748b;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 60px;
  color: #ef4444;
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

// 날짜 유틸리티 함수
const formatDateForInput = (dateStr: string): string => {
  // YYYYMMDD -> YYYY-MM-DD
  if (dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }
  return dateStr;
};

const parseDateInput = (dateInput: string): string => {
  // YYYY-MM-DD -> YYYYMMDD
  return dateInput.replace(/-/g, '');
};

const getDateString = (year: number, month: number, day: number): string => {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}${m}${d}`;
};

export default function AdventStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 기간 필터 상태 (기본값: 현재 날짜 기준 과거 7일, 기준 날짜는 11월 30일)
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const currentDate = new Date(koreanTime.getFullYear(), koreanTime.getMonth(), koreanTime.getDate());
    
    // 기준 날짜: 2025년 11월 30일
    const baseDate = new Date(2025, 10, 30); // 11월은 10 (0-indexed)
    
    // 현재 날짜가 기준 날짜보다 이전이면 기준 날짜부터 시작
    const startDateObj = currentDate < baseDate ? baseDate : currentDate;
    
    // 과거 7일 계산
    const sevenDaysAgo = new Date(startDateObj);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7일 전 (현재 포함)
    
    return formatDateForInput(getDateString(
      sevenDaysAgo.getFullYear(),
      sevenDaysAgo.getMonth() + 1,
      sevenDaysAgo.getDate()
    ));
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const currentDate = new Date(koreanTime.getFullYear(), koreanTime.getMonth(), koreanTime.getDate());
    
    // 기준 날짜: 2025년 11월 30일
    const baseDate = new Date(2025, 10, 30);
    
    // 현재 날짜가 기준 날짜보다 이전이면 기준 날짜 사용
    const endDateObj = currentDate < baseDate ? baseDate : currentDate;
    
    return formatDateForInput(getDateString(
      endDateObj.getFullYear(),
      endDateObj.getMonth() + 1,
      endDateObj.getDate()
    ));
  });

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

  // 기간 필터링된 통합 차트 데이터
  const mixedChartData = useMemo(() => {
    if (!stats) return [];
    
    const startDateNum = parseInt(parseDateInput(startDate));
    const endDateNum = parseInt(parseDateInput(endDate));
    
    // daily와 cumulative 데이터를 날짜 기준으로 병합
    const dailyMap = new Map<string, DailyStat>();
    stats.daily
      .filter(day => day.dayNumber >= 1)
      .forEach(day => {
        const dateNum = parseInt(day.date);
        if (dateNum >= startDateNum && dateNum <= endDateNum) {
          dailyMap.set(day.date, day);
        }
      });
    
    const cumulativeMap = new Map<string, CumulativeStat>();
    stats.cumulative
      .filter(cum => cum.dayNumber >= 1)
      .forEach(cum => {
        const dateNum = parseInt(cum.date);
        if (dateNum >= startDateNum && dateNum <= endDateNum) {
          cumulativeMap.set(cum.date, cum);
        }
      });
    
    // 모든 날짜 수집 및 정렬 (일차 기준)
    const allDates = Array.from(new Set([
      ...Array.from(dailyMap.keys()),
      ...Array.from(cumulativeMap.keys())
    ]));
    
    // 일차 기준으로 정렬
    const sortedData = allDates.map(date => {
      const daily = dailyMap.get(date);
      const cumulative = cumulativeMap.get(date);
      const dayNumber = daily?.dayNumber || cumulative?.dayNumber || 0;
      
      return {
        date,
        dayNumber,
        day: dayNumber > 0 ? `${dayNumber}일` : '',
        completed: daily?.completed || 0,
        cumulative: cumulative?.cumulativeCompleted || 0,
      };
    }).sort((a, b) => a.dayNumber - b.dayNumber);
    
    return sortedData;
  }, [stats, startDate, endDate]);

  const mixedChartConfig: ChartConfig = {
    completed: {
      label: '일별 완료',
      color: '#724886',
    },
    cumulative: {
      label: '누적 완료',
      color: '#10b981',
    },
  } satisfies ChartConfig;

  const chartStyle = {
    '--color-completed': '#724886',
    '--color-cumulative': '#10b981',
    '--color-count': '#3b82f6',
  } as React.CSSProperties;

  if (loading) {
    return (
      <Container>
        <LoadingState>통계를 불러오는 중...</LoadingState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorState>{error}</ErrorState>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container>
        <ErrorState>통계 데이터가 없습니다.</ErrorState>
      </Container>
    );
  }

  const formatDate = (dateStr: string) => {
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${year}.${month}.${day}`;
  };

  const totalDays = mixedChartData.length;
  const maxCumulative = Math.max(...mixedChartData.map(d => d.cumulative), 0);

  // 차트 색상 배열
  const COLORS = {
    completed: '#724886',
    commentOnly: '#3b82f6',
    attendanceOnly: '#f59e0b',
    cumulative: '#10b981',
    count: '#3b82f6',
  };

  return (
    <Container style={chartStyle}>
      <Header>
        <Title>대림절 통계</Title>
        <Subtitle>대림절 기간 동안의 통계 데이터를 확인하세요</Subtitle>
        <PeriodInfo>
          📅 2025년 11월 30일 ~ 2025년 12월 25일 (총 26일)
        </PeriodInfo>
      </Header>

      {/* 오늘 통계 카드 */}
      <StatsGrid>
        <StatCard>
          <StatLabel>오늘 완료</StatLabel>
          <StatValue>{stats.today.completed}</StatValue>
          <StatSubtext>묵상+출석 완료</StatSubtext>
        </StatCard>
        <StatCard>
          <StatLabel>묵상만</StatLabel>
          <StatValue>{stats.today.commentOnly}</StatValue>
          <StatSubtext>출석 대기 중</StatSubtext>
        </StatCard>
        <StatCard>
          <StatLabel>출석만</StatLabel>
          <StatValue>{stats.today.attendanceOnly}</StatValue>
          <StatSubtext>묵상 미완료</StatSubtext>
        </StatCard>
        <StatCard>
          <StatLabel>묵상 총계</StatLabel>
          <StatValue>{stats.today.commentCount}</StatValue>
          <StatSubtext>전체 묵상 수</StatSubtext>
        </StatCard>
        <StatCard>
          <StatLabel>출석 총계</StatLabel>
          <StatValue>{stats.today.attendanceCount}</StatValue>
          <StatSubtext>전체 출석 수</StatSubtext>
        </StatCard>
      </StatsGrid>

      {/* 일별 완료 & 누적 완료 통합 차트 (Mixed Chart) */}
      <Section>
        <SectionTitle>일별 완료 & 누적 완료 통계</SectionTitle>
        <SectionDescription>일별 완료 인원(바)과 누적 완료 인원(선)을 함께 확인하세요</SectionDescription>
        
        {/* 기간 필터 */}
        <FilterSection>
          <FilterGroup>
            <FilterLabel>시작일</FilterLabel>
            <FilterInput
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FilterGroup>
          <FilterGroup>
            <FilterLabel>종료일</FilterLabel>
            <FilterInput
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </FilterGroup>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <button
              onClick={() => {
                const now = new Date();
                const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
                const currentDate = new Date(koreanTime.getFullYear(), koreanTime.getMonth(), koreanTime.getDate());
                
                // 기준 날짜: 2025년 11월 30일
                const baseDate = new Date(2025, 10, 30);
                
                // 현재 날짜가 기준 날짜보다 이전이면 기준 날짜부터 시작
                const startDateObj = currentDate < baseDate ? baseDate : currentDate;
                
                // 과거 7일 계산
                const sevenDaysAgo = new Date(startDateObj);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
                
                const endDateObj = currentDate < baseDate ? baseDate : currentDate;
                
                setStartDate(formatDateForInput(getDateString(
                  sevenDaysAgo.getFullYear(),
                  sevenDaysAgo.getMonth() + 1,
                  sevenDaysAgo.getDate()
                )));
                setEndDate(formatDateForInput(getDateString(
                  endDateObj.getFullYear(),
                  endDateObj.getMonth() + 1,
                  endDateObj.getDate()
                )));
              }}
              style={{
                padding: '8px 16px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              기본값으로 (최근 7일)
            </button>
          </div>
        </FilterSection>
        
        <ChartWrapper>
          {mixedChartData.length > 0 ? (
            <ChartContainer config={mixedChartConfig}>
              <ResponsiveContainer width="100%" height={350} minHeight={350}>
                <ComposedChart
                  data={mixedChartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                  barCategoryGap="10%"
                >
                  <CartesianGrid stroke="#f5f5f5" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="completed"
                    barSize={60}
                    fill="#724886"
                    name="일별 완료"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    name="누적 완료"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
              선택한 기간에 데이터가 없습니다.
            </div>
          )}
        </ChartWrapper>
        <div style={{ marginTop: '2px', fontSize: '12px', color: '#64748b' }}>
          표시 기간: {formatDate(parseDateInput(startDate))} ~ {formatDate(parseDateInput(endDate))} ({totalDays}일)
          {maxCumulative > 0 && (
            <> | 최대 누적 완료: <strong style={{ color: COLORS.cumulative }}>{maxCumulative}명</strong></>
          )}
        </div>
      </Section>

      {/* 일별 상세 통계 테이블 */}
      <Section style={{ padding: 0 }}>
        <div style={{ padding: '24px 24px 16px 24px' }}>
          <SectionTitle>일별 상세 통계</SectionTitle>
          <SectionDescription>각 일차별 상세 통계 정보</SectionDescription>
        </div>
        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>일차</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead>완료</TableHead>
                <TableHead>묵상만</TableHead>
                <TableHead>출석만</TableHead>
                <TableHead>묵상 총</TableHead>
                <TableHead>출석 총</TableHead>
              </tr>
            </TableHeader>
            <tbody>
              {stats.daily
                .filter(day => {
                  const dayDateNum = parseInt(day.date);
                  const startDateNum = parseInt(parseDateInput(startDate));
                  const endDateNum = parseInt(parseDateInput(endDate));
                  return day.dayNumber >= 1 && dayDateNum >= startDateNum && dayDateNum <= endDateNum;
                })
                .sort((a, b) => a.dayNumber - b.dayNumber)
                .map((day) => (
                  <TableRow key={day.date}>
                    <TableData>
                      <Badge variant="info">{day.dayNumber}일차</Badge>
                    </TableData>
                    <TableData>{formatDate(day.date)}</TableData>
                    <TableData>
                      <Badge variant="success">{day.completed}명</Badge>
                    </TableData>
                    <TableData>{day.commentOnly}명</TableData>
                    <TableData>{day.attendanceOnly}명</TableData>
                    <TableData>{day.commentCount}명</TableData>
                    <TableData>{day.attendanceCount}명</TableData>
                  </TableRow>
                ))}
            </tbody>
          </Table>
        </TableContainer>
      </Section>
    </Container>
  );
}
