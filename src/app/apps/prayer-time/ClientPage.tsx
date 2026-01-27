"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "@emotion/styled";
import { motion, type MotionProps, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import toast, { Toaster } from "react-hot-toast";
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
  background: #121212;
  background-image: url('/images/apps/notk/background.svg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
  
  /* 배경 이미지 위에 반투명 레이어 추가 (Figma 디자인: #1e1e1e 톤) */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(30, 30, 30, 0.8);
    z-index: 0;
  }
  
  /* 컨텐츠가 레이어 위에 오도록 */
  > * {
    position: relative;
    z-index: 1;
  }
`;

const ContentWrapper = styled.div`
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const InitialScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - clamp(80px, 19.7vw, 160px));
  padding: 60px clamp(16px, 5.33vw, 20px) clamp(20px, 5.2vw, 40px) clamp(16px, 5.33vw, 20px);
`;

const ScrollIndicatorWrapper = styled.div`
  margin-top: clamp(16px, 3.94vw, 32px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ScrollIndicator = styled(motion.div)`
  color: rgba(255, 255, 255, 0.6);
  font-size: clamp(16px, 4.27vw, 24px);
  animation: bounce 2s infinite;

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }
`;

const StatsSection = styled(motion.div)`
  width: 100%;
`;

const CrossIcon = styled.div`
  width: 100%;
  height: 60vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: clamp(10px, 2.46vw, 20px);
  
  img {
    width: auto;
    height: 60vh;
    aspect-ratio: 220 / 366;
    object-fit: contain;
    opacity: 0.25; /* Figma 디자인: 더 낮은 opacity (0.2-0.4 범위) */
  }
`;

const TimerDisplay = styled.div`
  color: #FFF;
  text-align: center;
  font-family: 'SUIT', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: clamp(56px, 13.33vw, 300px);
  font-style: normal;
  font-weight: 100;
  line-height: 140%;
  margin-bottom: clamp(20px, 4.93vw, 40px);
  font-variant-numeric: tabular-nums;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: clamp(8px, 2.13vw, 16px);
  justify-content: center;
  margin-bottom: clamp(24px, 5.91vw, 48px);
  align-items: center;
`;

const Button = styled(motion.button)<
  React.ComponentPropsWithoutRef<"button"> & MotionProps & { variant?: "primary" | "secondary" }
>`
  display: flex;
  padding: clamp(8px, 1.6vw, 12px) clamp(16px, 3.2vw, 24px);
  justify-content: center;
  align-items: center;
  border-radius: clamp(12px, 2.13vw, 16px);
  border: none;
  cursor: pointer;
  color: #ffffff;
  transition: all 0.2s ease;
  font-size: clamp(14px, 2.67vw, 16px);
  font-weight: 600;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  ${(props) =>
    props.variant === "primary"
      ? `
      /* 실제 적용된 스타일: 반투명 흰색 배경 */
      background: rgba(255, 255, 255, 0.30);
      &:hover {
        background: rgba(255, 255, 255, 0.40);
      }
      &:active {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(0.98);
      }
    `
      : `
      /* Secondary 버튼: 투명 배경에 테두리 */
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      &:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.3);
      }
      &:active {
        background: rgba(255, 255, 255, 0.05);
        transform: scale(0.98);
      }
    `}
`;

const LiveSection = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05); /* Figma 디자인: 더 어두운 배경 */
  border: 1px solid rgba(255, 255, 255, 0.1); /* Figma 디자인: 더 얇은 테두리 */
  border-radius: clamp(10px, 1.6vw, 12px);
  padding: clamp(12px, 2.13vw, 16px);
  margin-bottom: clamp(16px, 2.96vw, 24px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const LiveText = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(6px, 1.07vw, 8px);
  color: #ffffff;
  font-size: clamp(14px, 2.67vw, 16px);
  font-weight: 500;
`;

const LiveBadge = styled.span`
  background: #ff3b30; /* Figma 디자인: iOS 스타일 빨간색 */
  color: #ffffff;
  padding: clamp(3px, 0.53vw, 4px) clamp(6px, 1.07vw, 8px);
  border-radius: clamp(4px, 0.8vw, 6px);
  font-size: clamp(9px, 1.6vw, 11px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  background: #1e1e1e; /* Figma 디자인: #1e1e1e */
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
  background: rgba(255, 255, 255, 0.03); /* Figma 디자인: 더 어두운 배경 */
  border: 1px solid rgba(255, 255, 255, 0.08); /* Figma 디자인: subtle border */
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
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
  gap: clamp(10px, 2.13vw, 16px);
  margin-bottom: clamp(16px, 2.96vw, 24px);
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03); /* Figma 디자인: 더 어두운 배경 */
  border: 1px solid rgba(255, 255, 255, 0.08); /* Figma 디자인: subtle border */
  border-radius: clamp(10px, 1.6vw, 12px);
  padding: clamp(14px, 2.67vw, 20px);
  color: #ffffff;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
  }
`;

const StatTitle = styled.div`
  font-size: clamp(12px, 2.13vw, 14px);
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: clamp(6px, 1.07vw, 8px);
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: clamp(20px, 4.27vw, 32px);
  font-weight: 700;
  color: #ffffff;
`;

const CommunityCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03); /* Figma 디자인: 더 어두운 배경 */
  border: 1px solid rgba(255, 255, 255, 0.08); /* Figma 디자인: subtle border */
  border-radius: clamp(10px, 1.6vw, 12px);
  padding: clamp(14px, 2.67vw, 20px);
  margin-bottom: clamp(16px, 2.96vw, 24px);
  color: #ffffff;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
  }
`;

const CalendarSection = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03); /* Figma 디자인: 더 어두운 배경 */
  border: 1px solid rgba(255, 255, 255, 0.08); /* Figma 디자인: subtle border */
  border-radius: clamp(10px, 1.6vw, 12px);
  padding: clamp(14px, 2.67vw, 20px);
  color: #ffffff;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: clamp(10px, 1.97vw, 16px);
`;

const CalendarTitle = styled.div`
  font-size: clamp(14px, 2.67vw, 16px);
  font-weight: 600;
  color: #ffffff;
`;

const CalendarDays = styled.div`
  display: flex;
  gap: clamp(6px, 1.07vw, 8px);
  overflow-x: auto;
  padding-bottom: clamp(6px, 1.07vw, 8px);
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
`;

const CalendarDay = styled.div<{ active?: boolean; hasPrayer?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(6px, 1.07vw, 8px);
  min-width: clamp(45px, 8vw, 60px);
  padding: clamp(8px, 1.6vw, 12px) clamp(6px, 1.07vw, 8px);
  opacity: ${(props) => (props.hasPrayer ? 1 : 0.4)}; /* Figma 디자인: 기도하지 않은 날 Opacity 4PXL */
`;

const DayCircle = styled.div<{ active?: boolean }>`
  width: clamp(32px, 5.33vw, 40px);
  height: clamp(32px, 5.33vw, 40px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(14px, 2.13vw, 16px);
  font-weight: 600;
  /* Figma 디자인: active일 때 더 밝은 색상, 아닐 때는 어두운 배경 */
  background: ${(props) => (props.active ? "#4a4a4c" : "rgba(255, 255, 255, 0.08)")};
  color: #ffffff;
  transition: all 0.2s;

  ${(props) =>
    props.active &&
    `
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  `}
`;

const DayTime = styled.div`
  font-size: clamp(10px, 1.6vw, 12px);
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
`;

// ==================== Utility Functions ====================

// 타이머 포맷: 00:00.00 (분:초.밀리초)
const formatTime = (totalSeconds: number, includeMilliseconds: boolean = false): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  
  if (includeMilliseconds) {
    // 밀리초 계산 (소수점 2자리)
    const milliseconds = Math.floor((totalSeconds % 1) * 100);
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
  const [isPaused, setIsPaused] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [pausedSeconds, setPausedSeconds] = useState(0); // 일시정지 시 누적된 시간
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
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
  const [showStats, setShowStats] = useState(false); // 초기 화면에서는 통계 숨김
  const calendarDaysRef = React.useRef<HTMLDivElement>(null);
  const todayDayRef = React.useRef<HTMLDivElement>(null);
  const contentWrapperRef = React.useRef<HTMLDivElement>(null);
  const statsSectionRef = React.useRef<HTMLDivElement>(null);

  // 스크롤 감지하여 통계 섹션 표시
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 200) {
        setShowStats(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 스크롤 인디케이터 클릭 시 통계 섹션으로 스크롤
  const handleScrollToStats = () => {
    setShowStats(true);
    setTimeout(() => {
      if (statsSectionRef.current) {
        statsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // statsSectionRef가 아직 없으면 window 스크롤
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
      }
    }, 100);
  };

  // 타이머 업데이트 (밀리초 포함)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPraying && startTime && !isPaused) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.max(0, (now.getTime() - startTime.getTime()) / 1000 - pausedSeconds);
        setTimerSeconds(elapsed);
      }, 10); // 10ms마다 업데이트 (밀리초 표시용)
    } else {
      // 기도 중이 아니거나 일시정지 중이면 타이머 업데이트 중지
      // 일시정지 중에는 현재 timerSeconds 값 유지
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPraying, isPaused, startTime, pausedSeconds]);

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
          setIsPaused(false);
          // 서버에서 받은 UTC 시간을 로컬 시간대로 파싱
          const sessionStartTime = parseServerDate(myStatsData.data.active_session.start_time);
          setStartTime(sessionStartTime);
          setPauseStartTime(null);
          setPausedSeconds(0);
          // 클라이언트의 현재 시간 (한국 시간대)
          const now = new Date();
          // 음수 방지 및 정확한 계산
          const elapsed = Math.max(0, (now.getTime() - sessionStartTime.getTime()) / 1000);
          setTimerSeconds(elapsed);
        } else {
          // 진행 중인 세션이 없으면 타이머 초기화
          setIsPraying(false);
          setIsPaused(false);
          setStartTime(null);
          setPauseStartTime(null);
          setTimerSeconds(0);
          setPausedSeconds(0);
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
        setIsPaused(false);
        setStartTime(startTimeDate);
        setPauseStartTime(null);
        setPausedSeconds(0);
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

  // 일시정지
  const handlePause = () => {
    if (!isPraying || isPaused) return;
    
    const now = new Date();
    setIsPaused(true);
    setPauseStartTime(now);
    
    // 일시정지 시점까지의 경과 시간을 pausedSeconds에 저장
    if (startTime) {
      const elapsed = (now.getTime() - startTime.getTime()) / 1000;
      setPausedSeconds(elapsed);
    }
    
    // 토스트 메시지 표시 (Figma 디자인: "LIVE 1분 26.328 기도가 멈춤")
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = Math.floor(timerSeconds % 60);
    const milliseconds = Math.floor((timerSeconds % 1) * 100);
    toast.success(`LIVE ${minutes}분 ${seconds}.${milliseconds.toString().padStart(2, "0")} 기도가 멈춤`, {
      duration: 3000,
      style: {
        background: '#4ade80',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 16px',
      },
    });
  };

  // 계속 (일시정지 해제)
  const handleResume = () => {
    if (!isPaused) return;
    
    setIsPaused(false);
    // 일시정지 해제 시 시작 시간을 조정하여 일시정지 시간을 제외
    const now = new Date();
    if (startTime) {
      // 일시정지된 시간만큼 시작 시간을 앞당김
      const adjustedStartTime = new Date(now.getTime() - pausedSeconds * 1000);
      setStartTime(adjustedStartTime);
    }
    setPauseStartTime(null);
  };

  // 완료 (기도 종료)
  const handleComplete = async () => {
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
        setIsPaused(false);
        setStartTime(null);
        setPauseStartTime(null);
        setTimerSeconds(0);
        setPausedSeconds(0);
        
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
  const today = new Date().getDate();

  // 날짜별 통계 맵 생성
  const dailyStatsMap = new Map(dailyStats.map((stat) => [stat.date, stat.total_seconds]));

  // 현재 날짜로 스크롤
  useEffect(() => {
    if (todayDayRef.current && calendarDaysRef.current && !loading) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤
      setTimeout(() => {
        if (todayDayRef.current && calendarDaysRef.current) {
          const container = calendarDaysRef.current;
          const target = todayDayRef.current;
          const containerRect = container.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          
          // 현재 날짜가 보이도록 스크롤
          const scrollLeft = targetRect.left - containerRect.left + container.scrollLeft - 16; // 16px 패딩
          container.scrollTo({
            left: Math.max(0, scrollLeft),
            behavior: 'smooth',
          });
        }
      }, 100);
    }
  }, [loading, monthDays]);

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
      <Toaster position="top-center" />
      <Header />

      <Container>
        <ContentWrapper ref={contentWrapperRef}>
          {/* 초기 화면: 타이머, 십자가, 버튼만 표시 */}
          <InitialScreen>
            <CrossIcon>
              <img src="/images/apps/notk/theCross.svg" alt="Cross" />
            </CrossIcon>

            <TimerDisplay>{formatTime(timerSeconds, true)}</TimerDisplay>

            <ButtonContainer>
              {!isPraying ? (
                // 초기 상태 또는 일시정지 후: "기도 시작" 버튼만
                <Button variant="primary" onClick={handleStart} whileTap={{ scale: 0.95 }}>
                  기도 시작
                </Button>
              ) : isPaused ? (
                // 일시정지 상태: "완료" / "계속" 버튼
                <>
                  <Button variant="secondary" onClick={handleComplete} whileTap={{ scale: 0.95 }}>
                    완료
                  </Button>
                  <Button variant="primary" onClick={handleResume} whileTap={{ scale: 0.95 }}>
                    계속
                  </Button>
                </>
              ) : (
                // 진행 중: "완료" / "일시" 버튼
                <>
                  <Button variant="secondary" onClick={handleComplete} whileTap={{ scale: 0.95 }}>
                    완료
                  </Button>
                  <Button variant="primary" onClick={handlePause} whileTap={{ scale: 0.95 }}>
                    일시
                  </Button>
                </>
              )}
            </ButtonContainer>

            {/* 스크롤 인디케이터 (초기 화면에서만 표시) */}
            {!isPraying && !showStats && (
              <ScrollIndicatorWrapper onClick={handleScrollToStats}>
                <ScrollIndicator
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  ↓
                </ScrollIndicator>
              </ScrollIndicatorWrapper>
            )}
          </InitialScreen>

          {/* 통계 섹션 (스크롤 시 표시) */}
          {showStats && (
            <StatsSection
              ref={statsSectionRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >

          {activeUsers.length > 0 && (
            <div onClick={() => setIsLiveModalOpen(true)}>
              <LiveSection
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <LiveText>
                  <LiveBadge>LIVE</LiveBadge>
                  {activeUsers.length}명 기도 중
                </LiveText>
                <div style={{ color: "rgba(255, 255, 255, 0.7)" }}>→</div>
              </LiveSection>
            </div>
          )}

          {/* Figma 디자인: "LIVE 14일 기도함" 텍스트 추가 */}
          {dailyStats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                textAlign: "center",
                marginBottom: "32px",
                color: "#ffffff",
                fontSize: "20px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              LIVE {dailyStats.length}일 기도함
            </motion.div>
          )}

          <StatsGrid>
            <StatCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <StatTitle>오늘 나의 기도 시간</StatTitle>
              <StatValue>{formatMinutes(myStats?.today_seconds || 0)}</StatValue>
            </StatCard>
            <StatCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <StatTitle>나의 총 기도 시간</StatTitle>
              <StatValue>{formatMinutes(myStats?.total_seconds || 0)}</StatValue>
            </StatCard>
          </StatsGrid>

          <CommunityCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <StatTitle>허브 총 기도 시간</StatTitle>
            <StatValue>{formatHoursMinutes(communityStats?.total_seconds || 0)}</StatValue>
          </CommunityCard>

          <CalendarSection initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <CalendarHeader>
              <CalendarTitle>{currentMonth}</CalendarTitle>
              <div style={{ color: "rgba(255, 255, 255, 0.7)" }}>→</div>
            </CalendarHeader>
            <CalendarDays ref={calendarDaysRef}>
              {monthDays.map(({ date, day }) => {
                const dateKey = date.toISOString().split("T")[0];
                const seconds = dailyStatsMap.get(dateKey) || 0;
                const hasPrayer = seconds > 0;
                const isToday = day === today;

                return (
                  <CalendarDay
                    key={day}
                    active={hasPrayer}
                    hasPrayer={hasPrayer}
                    ref={isToday ? todayDayRef : null}
                  >
                    <DayCircle active={hasPrayer}>{day}</DayCircle>
                    <DayTime>{hasPrayer ? formatMinutes(seconds) : "0"}</DayTime>
                  </CalendarDay>
                );
              })}
            </CalendarDays>
          </CalendarSection>
            </StatsSection>
          )}
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

