"use client"

import { useState, useEffect, useMemo } from 'react';
import styled from '@emotion/styled';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart, Cell, ComposedChart, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartConfig, ChartTooltipContent } from '@src/components/ui/chart';
import { VIDEO_EVENT, formatEventDateRange } from '@src/lib/video-event/constants';

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

interface HourlyCumulative {
  hour: number;
  cumulative: number;
}

interface HourlyCumulativeByDate {
  date: string;
  dayNumber: number;
  hourlyData: HourlyCumulative[];
}

interface StatsData {
  today: TodayStats;
  daily: DailyStat[];
  streaks: Record<number, number>;
  cumulative: CumulativeStat[];
  hourlyCumulative?: HourlyCumulative[];
  hourlyCumulativeByDate?: HourlyCumulativeByDate[];
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

export default function VideoEventStatsPage() {
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
  }, [startDate, endDate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
      });
      const response = await fetch(`/api/admin/video-event/stats?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data);
        // 디버깅용 로그 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          console.log('통계 데이터:', {
            hasHourlyData: !!data.hourlyCumulativeByDate,
            hourlyDataLength: data.hourlyCumulativeByDate?.length || 0,
            firstDateData: data.hourlyCumulativeByDate?.[0],
          });
        }
      } else {
        setError(data.error || '통계를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 시간대별 누적 추이 차트 데이터 변환
  const hourlyChartData = useMemo(() => {
    if (!stats?.hourlyCumulativeByDate || !Array.isArray(stats.hourlyCumulativeByDate) || stats.hourlyCumulativeByDate.length === 0) {
      return null;
    }

    try {
      const hourMap = new Map<number, Record<string, number>>();
      
      // 0시부터 23시까지 초기화
      for (let hour = 0; hour < 24; hour++) {
        hourMap.set(hour, { hour });
      }
      
      // 각 날짜별 데이터를 시간대별로 추가
      stats.hourlyCumulativeByDate.forEach((dateData) => {
        if (!dateData || !dateData.hourlyData || !Array.isArray(dateData.hourlyData)) {
          return;
        }
        const dateKey = `day${dateData.dayNumber}`;
        dateData.hourlyData.forEach((hourData) => {
          if (hourData && typeof hourData.hour === 'number' && typeof hourData.cumulative === 'number') {
            const hourEntry = hourMap.get(hourData.hour);
            if (hourEntry) {
              hourEntry[dateKey] = hourData.cumulative;
            }
          }
        });
      });
      
      return Array.from(hourMap.values());
    } catch (error) {
      console.error('시간대별 차트 데이터 변환 오류:', error);
      return null;
    }
  }, [stats?.hourlyCumulativeByDate]);

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
    // daily와 cumulative 모두에서 날짜를 수집하여 누락 방지
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
        attendance: daily?.attendanceCount ?? 0,
        meditation: daily?.commentCount ?? 0,
        cumulative: cumulative?.cumulativeCompleted ?? 0,
      };
    }).sort((a, b) => a.dayNumber - b.dayNumber);
    
    return sortedData;
  }, [stats, startDate, endDate]);

  const mixedChartConfig: ChartConfig = {
    attendance: {
      label: '일별 출석',
      color: '#EF0017',
    },
    meditation: {
      label: '일별 묵상',
      color: '#3b82f6',
    },
    cumulative: {
      label: '누적 출석',
      color: '#10b981',
    },
  } satisfies ChartConfig;

  const chartStyle = {
    '--color-attendance': '#EF0017',
    '--color-meditation': '#3b82f6',
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
  const maxAttendance = Math.max(...mixedChartData.map(d => d.attendance), 0);
  const maxMeditation = Math.max(...mixedChartData.map(d => d.meditation), 0);
  const maxValue = Math.max(maxCumulative, maxAttendance, maxMeditation, 1);
  const yAxisDomain = [0, Math.ceil(maxValue * 1.1)]; // 10% 여유 공간

  // 차트 색상 배열
  const COLORS = {
    attendance: '#EF0017',
    commentOnly: '#3b82f6',
    attendanceOnly: '#f59e0b',
    cumulative: '#10b981',
    count: '#3b82f6',
  };

  return (
    <Container style={chartStyle}>
      <Header>
        <Title>{VIDEO_EVENT.DISPLAY_NAME_STATS}</Title>
        <Subtitle>이벤트 기간 동안의 통계 데이터를 확인하세요</Subtitle>
        <PeriodInfo>
          📅 {formatEventDateRange(VIDEO_EVENT.BASE_DATE, VIDEO_EVENT.END_DATE)}
        </PeriodInfo>
      </Header>

      {/* 오늘 통계 카드 - 출석/묵상 분리 */}
      <StatsGrid>
        <StatCard>
          <StatLabel>오늘 출석</StatLabel>
          <StatValue>{stats.today.attendanceCount}</StatValue>
          <StatSubtext>오늘 출석 인원</StatSubtext>
        </StatCard>
        <StatCard>
          <StatLabel>오늘 묵상</StatLabel>
          <StatValue>{stats.today.commentCount}</StatValue>
          <StatSubtext>오늘 묵상 작성 수</StatSubtext>
        </StatCard>
      </StatsGrid>

      {/* 일별 출석 & 묵상 통합 차트 */}
      <Section>
        <SectionTitle>일별 출석 & 묵상 통계</SectionTitle>
        <SectionDescription>일별 출석·묵상(막대)과 누적 출석(선)을 확인하세요. 누적은 출석만 집계합니다.</SectionDescription>
        
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
                    domain={yAxisDomain}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    domain={yAxisDomain}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="attendance"
                    barSize={28}
                    fill="#EF0017"
                    name="일별 출석"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="meditation"
                    barSize={28}
                    fill="#3b82f6"
                    name="일별 묵상"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    name="누적 출석"
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
            <> | 최대 누적 출석: <strong style={{ color: COLORS.cumulative }}>{maxCumulative}명</strong></>
          )}
        </div>
      </Section>

      {/* 시간대별 누적 추이 그래프 */}
      {stats?.hourlyCumulativeByDate && Array.isArray(stats.hourlyCumulativeByDate) && stats.hourlyCumulativeByDate.length > 0 && hourlyChartData && hourlyChartData.length > 0 && (() => {
        // 색상 배열 (각 날짜별로 다른 색상)
        const dateColors = [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
          '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1',
          '#14b8a6', '#f43f5e', '#a855f7', '#22c55e', '#eab308',
          '#06b6d4', '#f472b6', '#34d399', '#fbbf24', '#60a5fa',
          '#a78bfa', '#fb7185', '#4ade80', '#fbbf24', '#38bdf8',
          '#c084fc', '#fb923c', '#2dd4bf'
        ];

        // ChartConfig 생성
        const chartConfig: ChartConfig = {};
        const validDates = stats.hourlyCumulativeByDate.filter(dateData => 
          dateData && dateData.dayNumber && dateData.hourlyData && Array.isArray(dateData.hourlyData)
        );
        
        validDates.forEach((dateData) => {
          const dateKey = `day${dateData.dayNumber}`;
          chartConfig[dateKey] = {
            label: `${dateData.dayNumber}일차`,
            color: dateColors[(dateData.dayNumber - 1) % dateColors.length],
          };
        });

        // 최대값 계산 (안전하게)
        const allValues = hourlyChartData.flatMap(d => 
          validDates.map(dateData => {
            const value = d[`day${dateData.dayNumber}`];
            return typeof value === 'number' ? value : 0;
          })
        );
        const maxValue = allValues.length > 0 ? Math.max(...allValues, 1) : 1;

        if (validDates.length === 0) {
          return null;
        }

        return (
          <Section>
            <SectionTitle>시간대별 누적 추이 (출석)</SectionTitle>
            <SectionDescription>선택한 기간 동안 각 날짜별 시간대별 누적 출석 인원을 확인하세요</SectionDescription>
            
            <ChartWrapper>
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height={350} minHeight={350}>
                  <LineChart
                    data={hourlyChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid stroke="#f5f5f5" />
                    <XAxis
                      dataKey="hour"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(value) => `${value}시`}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      domain={maxValue > 0 ? [0, Math.ceil(maxValue * 1.1)] : [0, 10]}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0 || !label) return null;
                        
                        const hour = typeof label === 'number' ? label : parseInt(String(label), 10);
                        if (isNaN(hour)) return null;
                        
                        const timeString = `${String(hour).padStart(2, '0')}:59:59`;
                        
                        return (
                          <div style={{
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            minWidth: '200px'
                          }}>
                            <div style={{ 
                              fontWeight: 600, 
                              marginBottom: '8px', 
                              color: '#111827',
                              fontSize: '13px'
                            }}>
                              ~ {timeString} 까지
                            </div>
                            {payload.map((entry: any, index: number) => {
                              const dayNumber = entry.name.replace('day', '').replace('일차', '');
                              const color = entry.color || entry.stroke || '#3b82f6';
                              return (
                                <div key={index} style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px',
                                  marginTop: '4px'
                                }}>
                                  <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: color
                                  }} />
                                  <span style={{ fontSize: '12px', color: '#334155' }}>
                                    {dayNumber}일차: <strong>{entry.value}명</strong>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }}
                    />
                    <Legend />
                    {validDates.map((dateData) => {
                      const dateKey = `day${dateData.dayNumber}`;
                      const color = dateColors[(dateData.dayNumber - 1) % dateColors.length];
                      return (
                        <Line
                          key={dateKey}
                          type="monotone"
                          dataKey={dateKey}
                          stroke={color}
                          strokeWidth={2}
                          dot={{ fill: color, r: 3, strokeWidth: 1, stroke: '#fff' }}
                          activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
                          name={dateData.dayNumber.toString()}
                          connectNulls={false}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </ChartWrapper>
            <div style={{ marginTop: '2px', fontSize: '12px', color: '#64748b' }}>
              표시 기간: {formatDate(parseDateInput(startDate))} ~ {formatDate(parseDateInput(endDate))}
              {maxValue > 0 && (
                <> | 최대 누적 출석: <strong style={{ color: COLORS.cumulative }}>{maxValue}명</strong></>
              )}
            </div>
          </Section>
        );
      })()}

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
                <TableHead>출석</TableHead>
                <TableHead>묵상</TableHead>
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
                      <Badge variant="success">{day.attendanceCount}명</Badge>
                    </TableData>
                    <TableData>{day.commentCount}명</TableData>
                  </TableRow>
                ))}
            </tbody>
          </Table>
        </TableContainer>
      </Section>
    </Container>
  );
}
