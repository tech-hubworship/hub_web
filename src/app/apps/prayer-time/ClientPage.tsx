"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "@emotion/styled";
import { motion, type MotionProps } from "framer-motion";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Header } from "@src/components/Header";

const Footer = dynamic(() => import("@src/components/Footer"), { ssr: true });

// ==================== Styled Components ====================

const Container = styled.div`
  min-height: 100vh;
  background: #1a1a1a;
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
`;

const ContentWrapper = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 80px 20px 100px;
  width: 100%;

  @media (max-width: 768px) {
    padding: 60px 16px 80px;
  }
`;

const CrossIcon = styled.div`
  width: 100%;
  height: 200px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;

  &::before {
    content: "";
    position: absolute;
    width: 2px;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
  }

  &::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 2px;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const TimerDisplay = styled.div`
  font-size: 72px;
  font-weight: 300;
  color: #ffffff;
  text-align: center;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  margin-bottom: 40px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  @media (max-width: 768px) {
    font-size: 56px;
    margin-bottom: 32px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    gap: 10px;
    margin-bottom: 32px;
  }
`;

const Button = styled(motion.button)<
  React.ComponentPropsWithoutRef<"button"> & MotionProps & { variant?: "primary" | "secondary" }
>`
  padding: 16px 32px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  color: #ffffff;
  transition: all 0.2s;

  ${(props) =>
    props.variant === "primary"
      ? `
      background: #8B4513;
      &:hover {
        background: #A0522D;
      }
    `
      : `
      background: transparent;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    `}

  @media (max-width: 768px) {
    padding: 14px 24px;
    font-size: 14px;
  }
`;

const LiveSection = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    padding: 14px;
    margin-bottom: 20px;
  }
`;

const LiveText = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const LiveBadge = styled.span`
  background: #ff0000;
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    gap: 12px;
    margin-bottom: 20px;
  }
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  color: #ffffff;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const StatTitle = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 12px;
    margin-bottom: 6px;
  }
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const CommunityCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  color: #ffffff;

  @media (max-width: 768px) {
    padding: 16px;
    margin-bottom: 20px;
  }
`;

const CalendarSection = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  color: #ffffff;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    margin-bottom: 12px;
  }
`;

const CalendarTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const CalendarDays = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
`;

const CalendarDay = styled.div<{ active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 60px;
  padding: 12px 8px;

  @media (max-width: 768px) {
    min-width: 50px;
    padding: 10px 6px;
    gap: 6px;
  }
`;

const DayCircle = styled.div<{ active?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  background: ${(props) => (props.active ? "#8B4513" : "rgba(255, 255, 255, 0.1)")};
  color: #ffffff;

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
`;

const DayTime = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;

  @media (max-width: 768px) {
    font-size: 11px;
  }
`;

// ==================== Utility Functions ====================

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const formatMinutes = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}분`;
};

const formatHoursMinutes = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}시간 ${minutes}분`;
};

// ==================== Main Component ====================

export default function PrayerTimeClientPage() {
  const { data: session } = useSession();
  const [isPraying, setIsPraying] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [myStats, setMyStats] = useState<{
    today_seconds: number;
    total_seconds: number;
    active_session: any;
  } | null>(null);
  const [communityStats, setCommunityStats] = useState<{
    total_seconds: number;
    user_stats: Array<{ user_id: string; name: string; total_seconds: number }>;
  } | null>(null);
  const [activeUsers, setActiveUsers] = useState<
    Array<{
      user_id: string;
      name: string;
      duration_seconds: number;
    }>
  >([]);
  const [dailyStats, setDailyStats] = useState<
    Array<{
      date: string;
      total_seconds: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  // 타이머 업데이트
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPraying && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setTimerSeconds(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPraying, startTime]);

  // 데이터 로드
  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // 내 통계
      const myStatsRes = await fetch("/api/prayer-time/my-stats");
      if (myStatsRes.ok) {
        const myStatsData = await myStatsRes.json();
        setMyStats(myStatsData.data);

        // 진행 중인 세션이 있으면 타이머 시작
        if (myStatsData.data.active_session) {
          setIsPraying(true);
          setStartTime(new Date(myStatsData.data.active_session.start_time));
          const now = new Date();
          const elapsed = Math.floor(
            (now.getTime() - new Date(myStatsData.data.active_session.start_time).getTime()) / 1000
          );
          setTimerSeconds(elapsed);
        }
      }

      // 공동체 통계
      const communityRes = await fetch("/api/prayer-time/community");
      if (communityRes.ok) {
        const communityData = await communityRes.json();
        setCommunityStats(communityData.data);
      }

      // 기도 중인 사람 목록
      const activeRes = await fetch("/api/prayer-time/active");
      if (activeRes.ok) {
        const activeData = await activeRes.json();
        setActiveUsers(activeData.data.users);
      }

      // 날짜별 통계
      const dailyRes = await fetch("/api/prayer-time/daily");
      if (dailyRes.ok) {
        const dailyData = await dailyRes.json();
        setDailyStats(dailyData.data.daily_stats);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadData();

    // 주기적으로 데이터 갱신
    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30초마다 갱신

    return () => clearInterval(interval);
  }, [loadData]);

  // 기도 시작
  const handleStart = async () => {
    if (!session?.user?.id) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const res = await fetch("/api/prayer-time/start", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setIsPraying(true);
        setStartTime(new Date(data.data.start_time));
        setTimerSeconds(0);
        await loadData();
      } else {
        const error = await res.json();
        alert(error.error || "기도 시작에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error starting prayer:", error);
      alert("기도 시작에 실패했습니다.");
    }
  };

  // 기도 종료
  const handleStop = async () => {
    if (!session?.user?.id) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const res = await fetch("/api/prayer-time/stop", {
        method: "POST",
      });

      if (res.ok) {
        setIsPraying(false);
        setStartTime(null);
        setTimerSeconds(0);
        await loadData();
      } else {
        const error = await res.json();
        alert(error.error || "기도 종료에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error stopping prayer:", error);
      alert("기도 종료에 실패했습니다.");
    }
  };

  // 초기화
  const handleReset = () => {
    if (isPraying) {
      if (!confirm("기도를 종료하시겠습니까?")) return;
      handleStop();
    } else {
      setTimerSeconds(0);
    }
  };

  // 현재 월의 날짜들 생성
  const getCurrentMonthDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const days: Array<{ date: Date; day: number }> = [];

    // 이번 달 1일부터 오늘까지
    for (let day = 1; day <= lastDay.getDate() && day <= now.getDate(); day++) {
      days.push({
        date: new Date(year, month, day),
        day,
      });
    }

    return days;
  };

  const monthDays = getCurrentMonthDays();
  const currentMonth = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long" });

  // 날짜별 통계 맵 생성
  const dailyStatsMap = new Map(dailyStats.map((stat) => [stat.date, stat.total_seconds]));

  if (loading) {
    return (
      <>
        <Header />
        <Container>
          <ContentWrapper>
            <div style={{ color: "#ffffff", textAlign: "center", padding: "40px" }}>로딩 중...</div>
          </ContentWrapper>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <Container>
        <ContentWrapper>
          <CrossIcon />

          <TimerDisplay>{formatTime(timerSeconds)}</TimerDisplay>

          <ButtonContainer>
            <Button variant="secondary" onClick={handleReset} whileTap={{ scale: 0.95 }}>
              초기화
            </Button>
            <Button variant="primary" onClick={isPraying ? handleStop : handleStart} whileTap={{ scale: 0.95 }}>
              {isPraying ? "중지" : "기도 시작"}
            </Button>
          </ButtonContainer>

          {activeUsers.length > 0 && (
            <LiveSection initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }}>
              <LiveText>
                <LiveBadge>LIVE</LiveBadge>
                {activeUsers.length}명 기도 중
              </LiveText>
              <div style={{ color: "rgba(255, 255, 255, 0.7)" }}>→</div>
            </LiveSection>
          )}

          <StatsGrid>
            <StatCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <StatTitle>오늘 나의 기도 시간</StatTitle>
              <StatValue>{formatMinutes(myStats?.today_seconds || 0)}</StatValue>
            </StatCard>
            <StatCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <StatTitle>나의 총 기도 시간</StatTitle>
              <StatValue>{formatMinutes(myStats?.total_seconds || 0)}</StatValue>
            </StatCard>
          </StatsGrid>

          <CommunityCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <StatTitle>허브 총 기도 시간</StatTitle>
            <StatValue>{formatHoursMinutes(communityStats?.total_seconds || 0)}</StatValue>
          </CommunityCard>

          <CalendarSection initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <CalendarHeader>
              <CalendarTitle>{currentMonth}</CalendarTitle>
              <div style={{ color: "rgba(255, 255, 255, 0.7)" }}>→</div>
            </CalendarHeader>
            <CalendarDays>
              {monthDays.map(({ date, day }) => {
                const dateKey = date.toISOString().split("T")[0];
                const seconds = dailyStatsMap.get(dateKey) || 0;
                const hasPrayer = seconds > 0;

                return (
                  <CalendarDay key={day} active={hasPrayer}>
                    <DayCircle active={hasPrayer}>{day}</DayCircle>
                    <DayTime>{hasPrayer ? formatMinutes(seconds) : "0"}</DayTime>
                  </CalendarDay>
                );
              })}
            </CalendarDays>
          </CalendarSection>
        </ContentWrapper>
      </Container>

      <Footer />
    </>
  );
}

