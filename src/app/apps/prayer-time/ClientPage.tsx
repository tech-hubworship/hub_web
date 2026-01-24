"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "@emotion/styled";
import { motion, type MotionProps, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { supabase } from "@src/lib/supabase";
import { Header } from "@src/components/Header";

// 서버에서 받은 UTC 시간을 클라이언트 로컬 시간대로 정확히 파싱
// 서버는 UTC로 저장하지만, 클라이언트는 로컬 시간대(한국: UTC+9)를 사용
const parseServerDate = (dateString: string): Date => {
  // ISO 문자열을 Date로 파싱 (자동으로 로컬 시간대로 변환됨)
  return new Date(dateString);
};

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

// Live Modal 스타일
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  
  @media (min-width: 768px) {
    align-items: center;
    padding: 20px;
  }
`;

const ModalContent = styled(motion.div)`
  background: #1a1a1a;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  border-radius: 24px 24px 0 0;
  padding: 24px;
  overflow-y: auto;
  position: relative;
  
  @media (min-width: 768px) {
    border-radius: 24px;
    max-height: 70vh;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h2`
  color: #ffffff;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
`;

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UserItem = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const UserName = styled.div`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

const UserTime = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-family: 'Courier New', monospace;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
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
      start_time?: string; // 클라이언트에서 duration 계산용
    }>
  >([]);
  const [dailyStats, setDailyStats] = useState<
    Array<{
      date: string;
      total_seconds: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  // 타이머 업데이트
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPraying && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000));
        setTimerSeconds(elapsed);
      }, 1000);
    } else {
      // 기도 중이 아니면 타이머를 0으로 설정
      setTimerSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPraying, startTime]);

  // 초기 기도 중인 사람 목록 로드 (한 번만)
  const { data: initialActiveUsers } = useQuery<{
    success: boolean;
    data: {
      count: number;
      users: Array<{
        user_id: string;
        name: string;
        duration_seconds: number;
      }>;
    };
  }>({
    queryKey: ["prayer-time-active-initial"],
    queryFn: async () => {
      const res = await fetch("/api/prayer-time/active");
      if (!res.ok) throw new Error("Failed to fetch active users");
      return res.json();
    },
    enabled: !!session?.user?.id,
    staleTime: Infinity, // 초기 로드만, 이후 Realtime으로 업데이트
  });

  // 사용자 이름 캐시 (Edge request 최소화)
  const [userNameCache, setUserNameCache] = React.useState<Map<string, string>>(new Map());

  // 초기 데이터에서 사용자 이름 캐시 생성 및 start_time 저장
  useEffect(() => {
    if (initialActiveUsers?.data?.users) {
      // API에서 start_time을 포함하여 반환하므로 그대로 사용
      setActiveUsers(initialActiveUsers.data.users as any);
      
      const cache = new Map<string, string>();
      initialActiveUsers.data.users.forEach((user) => {
        cache.set(user.user_id, user.name);
      });
      setUserNameCache(cache);
    }
  }, [initialActiveUsers]);

  // 기도 중인 사람들의 duration_seconds 실시간 업데이트 (클라이언트에서 계산)
  useEffect(() => {
    if (activeUsers.length === 0) return;

    const interval = setInterval(() => {
      setActiveUsers((prev) =>
        prev.map((user) => {
          // start_time이 있으면 클라이언트에서 계산
          const startTime = (user as any).start_time
            ? parseServerDate((user as any).start_time)
            : null;
          if (startTime) {
            const now = new Date();
            const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            return { ...user, duration_seconds: durationSeconds };
          }
          return user;
        })
      );
    }, 1000); // 1초마다 업데이트

    return () => clearInterval(interval);
  }, [activeUsers.length]);

  // Supabase Realtime 구독 (Edge request 없이 실시간 업데이트)
  useEffect(() => {
    if (!session?.user?.id) return;

    // Realtime 구독 설정
    const channel = supabase
      .channel("prayer-sessions-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "prayer_sessions",
        },
        async (payload) => {
          // 새 세션이 추가됨
          const newSession = payload.new as { user_id: string; start_time: string };
          const now = new Date();
          // 서버에서 받은 UTC 시간을 로컬 시간대로 파싱
          const startTime = parseServerDate(newSession.start_time);
          const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

          // 사용자 이름 가져오기 (캐시에 없으면 API 호출, 있으면 캐시 사용)
          let userName = userNameCache.get(newSession.user_id);
          if (!userName) {
            try {
              const res = await fetch(`/api/prayer-time/user-name?user_id=${newSession.user_id}`);
              if (res.ok) {
                const data = await res.json();
                userName = data.name || "알 수 없음";
                setUserNameCache((prev) => new Map(prev).set(newSession.user_id, userName!));
              } else {
                userName = "알 수 없음";
              }
            } catch (error) {
              console.error("Error fetching user name:", error);
              userName = "알 수 없음";
            }
          }

          // 상태 업데이트 (기존 목록에 추가)
          setActiveUsers((prev) => {
            // 이미 존재하는지 확인
            if (prev.some((u) => u.user_id === newSession.user_id)) {
              return prev;
            }
            return [
              ...prev,
              {
                user_id: newSession.user_id,
                name: userName!,
                duration_seconds: durationSeconds,
                start_time: newSession.start_time, // 클라이언트에서 계산하기 위해 저장
              } as any,
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "prayer_sessions",
        },
        (payload) => {
          // 세션이 삭제됨 (기도 종료)
          const oldSession = payload.old as { user_id: string };
          if (oldSession?.user_id) {
            setActiveUsers((prev) => prev.filter((u) => u.user_id !== oldSession.user_id));
          } else {
            // payload.old가 없을 경우 전체 목록 다시 로드
            fetch("/api/prayer-time/active")
              .then((res) => res.json())
              .then((data) => {
                if (data.data?.users) {
                  setActiveUsers(data.data.users);
                }
              })
              .catch((error) => console.error("Error refreshing active users:", error));
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime subscription active");
        } else if (status === "CHANNEL_ERROR") {
          console.error("Realtime subscription error");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, userNameCache]);

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
          // 서버에서 받은 UTC 시간을 로컬 시간대로 파싱
          const sessionStartTime = parseServerDate(myStatsData.data.active_session.start_time);
          setStartTime(sessionStartTime);
          // 클라이언트의 현재 시간 (한국 시간대)
          const now = new Date();
          // 음수 방지 및 정확한 계산
          const elapsed = Math.max(0, Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000));
          setTimerSeconds(elapsed);
        } else {
          // 진행 중인 세션이 없으면 타이머 초기화
          setIsPraying(false);
          setStartTime(null);
          setTimerSeconds(0);
        }
      }

      // 공동체 통계
      const communityRes = await fetch("/api/prayer-time/community");
      if (communityRes.ok) {
        const communityData = await communityRes.json();
        setCommunityStats(communityData.data);
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

    // 주기적으로 데이터 갱신 (SSE로 activeUsers는 실시간 업데이트되므로 제외)
    const interval = setInterval(() => {
      loadData();
    }, 60000); // 1분마다 갱신

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
        // 서버에서 받은 UTC 시간을 로컬 시간대로 파싱
        const startTimeDate = parseServerDate(data.data.start_time);
        setIsPraying(true);
        setStartTime(startTimeDate);
        // 시작 시점이므로 0초부터 시작
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

    const userId = session.user.id;

    try {
      const res = await fetch("/api/prayer-time/stop", {
        method: "POST",
      });

      if (res.ok) {
        setIsPraying(false);
        setStartTime(null);
        setTimerSeconds(0);
        
        // LIVE 목록에서 즉시 제거 (Realtime 이벤트 대기 전에)
        setActiveUsers((prev) => prev.filter((u) => u.user_id !== userId));
        
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
            <LiveSection
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              onTap={() => setIsLiveModalOpen(true)}
            >
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

      {/* Live Modal */}
      <AnimatePresence>
        {isLiveModalOpen && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              style={{ position: "absolute", inset: 0 }}
              onClick={() => setIsLiveModalOpen(false)}
            />
            <ModalContent
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
            <ModalHeader>
              <ModalTitle>
                <LiveBadge>LIVE</LiveBadge>
                기도 중인 사람들
              </ModalTitle>
              <CloseButton onClick={() => setIsLiveModalOpen(false)}>×</CloseButton>
            </ModalHeader>

            {activeUsers.length > 0 ? (
              <UserList>
                {activeUsers
                  .sort((a, b) => (b.duration_seconds || 0) - (a.duration_seconds || 0))
                  .map((user, index) => (
                    <UserItem
                      key={user.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                    >
                      <UserInfo>
                        <UserName>{user.name}</UserName>
                        <UserTime>{formatTime(user.duration_seconds || 0)}</UserTime>
                      </UserInfo>
                    </UserItem>
                  ))}
              </UserList>
            ) : (
              <EmptyState>현재 기도 중인 사람이 없습니다.</EmptyState>
            )}
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}

