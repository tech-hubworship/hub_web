"use client";

/**
 * 기도시간 사용자 화면
 * Figma: 메인 84-4370, 통계·캘린더 84-4381
 * https://www.figma.com/design/xwGBRQQLtFqblqCwwNFvCY/UI-Design?node-id=84-4370&m=dev
 * https://www.figma.com/design/xwGBRQQLtFqblqCwwNFvCY/UI-Design?node-id=84-4381&m=dev
 * - 배경: background.svg 전체 (메인·통계 경계 없음, 오버레이 fixed)
 * - 84-4381: LIVE N명 기도 중, 오늘/총/허브 기도 시간 카드, 월 그리드 캘린더(일~토, 기도 안 한 날 40% opacity)
 * - 81-3419: 통계 화면 (LIVE 빨간색, 카드 값 크기, 캘린더 +N 빨간색)
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "@emotion/styled";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "@src/lib/supabase";
import { Header } from "@src/components/Header";

const Footer = dynamic(() => import("@src/components/Footer"), { ssr: true });

const parseServerDate = (dateString: string): Date => new Date(dateString);

// ——— 유틸 ———
const formatTime = (totalSeconds: number, withMs = false): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  if (withMs) {
    const ms = Math.floor((totalSeconds % 1) * 100);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};
const formatMinutes = (seconds: number) => `${Math.floor(seconds / 60)}분`;
const formatHoursMinutes = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}시간 ${m}분`;
};

// ——— 스타일 (Figma: background.svg 전체 배경, 메인·통계 경계 없음) ———
const Page = styled.div`
  min-height: 100vh;
  background: #121212;
  background-image: url("/images/apps/notk/background.svg");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  &::before {
    content: "";
    position: fixed;
    inset: 0;
    background: rgba(18, 18, 18, 0.55);
    z-index: 0;
    pointer-events: none;
  }
  > * { position: relative; z-index: 1; }
`;

const Main = styled.main`
  max-width: 480px;
  margin: 0 auto;
  padding: 24px 20px 40px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
`;

const Hero = styled.section`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0 32px;
`;

const Cross = styled.div`
  width: 100%;
  max-width: 200px;
  margin-bottom: 24px;
  img {
    width: 100%;
    height: auto;
    aspect-ratio: 220 / 366;
    object-fit: contain;
    opacity: 0.2;
  }
`;

const Timer = styled.div`
  font-family: "SUIT", system-ui, sans-serif;
  font-weight: 200;
  font-size: clamp(48px, 14vw, 120px);
  line-height: 1.2;
  color: #fff;
  font-variant-numeric: tabular-nums;
  margin-bottom: 28px;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
`;

type BtnVariant = "gray" | "red" | "blue";
const Btn = styled(motion.button)<{ $variant?: BtnVariant } & React.ComponentPropsWithoutRef<"button">>`
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  color: #fff;
  background: ${(p) =>
    p.$variant === "red"
      ? "#ff3b30"
      : p.$variant === "blue"
        ? "#0a84ff"
        : "rgba(255,255,255,0.12)"};
  border: ${(p) =>
    p.$variant !== "red" && p.$variant !== "blue" ? "1px solid rgba(255,255,255,0.2)" : "none"};
  &:hover {
    background: ${(p) =>
      p.$variant === "red"
        ? "#ff6b63"
        : p.$variant === "blue"
          ? "#409cff"
          : "rgba(255,255,255,0.18)"};
  }
`;

/* Figma 81-2941: 통계 보기 화살표 (아래꺽쇠 + 동동 뜨는 인터랙션) */
const ScrollHint = styled(motion.div)<React.ComponentPropsWithoutRef<"div">>`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,0.5);
  font-size: 14px;
  cursor: pointer;
  &:hover {
    color: rgba(255,255,255,0.85);
  }
  &:hover .scroll-hint-icon {
    opacity: 0.9;
  }
`;

const ScrollHintIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: scroll-hint-bounce 2s ease-in-out infinite;
  @keyframes scroll-hint-bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
    60% { transform: translateY(-3px); }
  }
`;

const StatsBlock = styled.section`
  width: 100%;
  margin-top: 32px;
`;

const LiveChip = styled(motion.button)<React.ComponentPropsWithoutRef<"button">>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  margin-bottom: 20px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  &:hover { background: rgba(255,255,255,0.1); }
`;

const LiveDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff453a;
  margin-right: 8px;
  animation: pulse 1.5s ease-in-out infinite;
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

/* Figma 81-3419: LIVE 텍스트 빨간색 */
const LiveLabel = styled.span`
  color: #ff453a;
  font-weight: 600;
  margin-right: 4px;
`;

const Card = styled(motion.div)`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 12px;
  color: #fff;
`;

const CardLabel = styled.div`
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  margin-bottom: 4px;
`;

const CardValue = styled.div`
  font-size: clamp(20px, 5vw, 26px);
  font-weight: 700;
`;

/* Figma 81-3419: 허브 총 기도 시간 값은 더 크게 */
const CardValueLarge = styled(CardValue)`
  font-size: clamp(22px, 5.5vw, 30px);
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const CalendarWrap = styled(Card)`
  margin-top: 20px;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const CalendarTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #fff;
`;

const CalendarNav = styled.button`
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  padding: 4px 8px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  &:hover { color: #fff; }
`;

const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
  text-align: center;
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  font-weight: 500;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const CalendarCell = styled.div<{ $empty?: boolean; $hasPrayer?: boolean; $today?: boolean }>`
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  opacity: ${(p) => (p.$empty ? 0 : p.$hasPrayer ? 1 : 0.4)};
  background: ${(p) => (p.$today && !p.$empty ? "rgba(255,255,255,0.12)" : "transparent")};
  border-radius: 8px;
`;

/* Figma 81-3419: 캘린더 날짜 아래 +N 빨간색 */
const CalendarCellDuration = styled.div`
  font-size: 10px;
  font-weight: 500;
  color: #ff453a;
  margin-top: 2px;
`;

const ModalBackdrop = styled(motion.div)<React.ComponentPropsWithoutRef<"div">>`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  @media (min-width: 500px) { align-items: center; }
`;

const ModalPanel = styled(motion.div)<React.ComponentPropsWithoutRef<"div">>`
  background: #1a1a1a;
  width: 100%;
  max-width: 480px;
  max-height: 70vh;
  border-radius: 20px 20px 0 0;
  padding: 20px 24px 32px;
  overflow-y: auto;
  @media (min-width: 500px) { border-radius: 20px; }
`;

const ModalHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModalClose = styled.button`
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  &:hover { color: #fff; }
`;

const UserRow = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  margin-bottom: 8px;
  background: rgba(255,255,255,0.04);
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.06);
`;

const UserName = styled.span`font-weight: 600; color: #fff;`;
const UserDuration = styled.span`font-variant-numeric: tabular-nums; color: rgba(255,255,255,0.7); font-size: 14px;`;

// ——— 컴포넌트 ———
export default function PrayerTimeClientPage() {
  const { data: session } = useSession();
  const [isPraying, setIsPraying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [pausedSeconds, setPausedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [myStats, setMyStats] = useState<{
    today_seconds: number;
    total_seconds: number;
    active_session: { start_time: string } | null;
  } | null>(null);
  const [communityStats, setCommunityStats] = useState<{
    total_seconds: number;
    user_stats: Array<{ user_id: string; name: string; total_seconds: number }>;
  } | null>(null);
  const [activeUsers, setActiveUsers] = useState<Array<{
    user_id: string;
    name: string;
    duration_seconds: number;
    start_time?: string;
  }>>([]);
  const [dailyStats, setDailyStats] = useState<Array<{ date: string; total_seconds: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [liveModalOpen, setLiveModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const statsRef = useRef<HTMLElement>(null);
  const [userNameCache, setUserNameCache] = useState<Map<string, string>>(new Map());
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });

  // 타이머 틱
  useEffect(() => {
    if (!isPraying || !startTime || isPaused) return;
    const interval = setInterval(() => {
      const elapsed = Math.max(0, (Date.now() - startTime.getTime()) / 1000 - pausedSeconds);
      setTimerSeconds(elapsed);
    }, 10);
    return () => clearInterval(interval);
  }, [isPraying, isPaused, startTime, pausedSeconds]);

  // 초기 기도 중인 사람
  const { data: initialActive } = useQuery({
    queryKey: ["prayer-time-active"],
    queryFn: async () => {
      const res = await fetch("/api/prayer-time/active");
      if (!res.ok) throw new Error("active failed");
      const json = await res.json();
      return json.data?.users ?? [];
    },
    enabled: !!session?.user?.id,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (initialActive?.length) {
      setActiveUsers(initialActive);
      const cache = new Map<string, string>();
      initialActive.forEach((u: { user_id: string; name: string }) => cache.set(u.user_id, u.name));
      setUserNameCache(cache);
    }
  }, [initialActive]);

  // LIVE 목록 duration 1초마다 갱신
  useEffect(() => {
    if (activeUsers.length === 0) return;
    const interval = setInterval(() => {
      setActiveUsers((prev) =>
        prev.map((u) => {
          const start = (u as { start_time?: string }).start_time ? parseServerDate((u as { start_time: string }).start_time) : null;
          if (!start) return u;
          const dur = Math.floor((Date.now() - start.getTime()) / 1000);
          return { ...u, duration_seconds: dur };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [activeUsers.length]);

  // Supabase Realtime
  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = supabase
      .channel("prayer-sessions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "prayer_sessions" },
        async (payload) => {
          const row = payload.new as { user_id: string; start_time: string };
          let name = userNameCache.get(row.user_id);
          if (!name) {
            try {
              const r = await fetch(`/api/prayer-time/user-name?user_id=${row.user_id}`);
              const d = r.ok ? await r.json() : {};
              name = d.name ?? "알 수 없음";
              setUserNameCache((prev) => new Map(prev).set(row.user_id, name!));
            } catch {
              name = "알 수 없음";
            }
          }
          setActiveUsers((prev) =>
            prev.some((u) => u.user_id === row.user_id)
              ? prev
              : [...prev, { user_id: row.user_id, name: name!, duration_seconds: 0, start_time: row.start_time }]
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "prayer_sessions" },
        (payload) => {
          const old = payload.old as { user_id?: string };
          if (old?.user_id) {
            setActiveUsers((prev) => prev.filter((u) => u.user_id !== old.user_id));
          } else {
            fetch("/api/prayer-time/active")
              .then((res) => res.json())
              .then((data) => {
                if (data.data?.users) setActiveUsers(data.data.users);
              })
              .catch(() => {});
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, userNameCache]);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    try {
      const [myRes, communityRes] = await Promise.all([
        fetch("/api/prayer-time/my-stats"),
        fetch("/api/prayer-time/community"),
      ]);
      if (myRes.ok) {
        const data = (await myRes.json()).data;
        setMyStats(data);
        if (data?.active_session) {
          setIsPraying(true);
          setIsPaused(false);
          const st = parseServerDate(data.active_session.start_time);
          setStartTime(st);
          setPauseStartTime(null);
          setPausedSeconds(0);
          setTimerSeconds(Math.max(0, (Date.now() - st.getTime()) / 1000));
        } else {
          setIsPraying(false);
          setIsPaused(false);
          setStartTime(null);
          setPauseStartTime(null);
          setTimerSeconds(0);
          setPausedSeconds(0);
        }
      }
      if (communityRes.ok) {
        const data = (await communityRes.json()).data;
        setCommunityStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 60000);
    return () => clearInterval(t);
  }, [loadData]);

  // 캘린더 월별 daily 통계 (Figma 84-4381)
  useEffect(() => {
    if (!session?.user?.id) return;
    const { year, month } = calendarMonth;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    fetch(`/api/prayer-time/daily?start_date=${startStr}&end_date=${endStr}`)
      .then((res) => (res.ok ? res.json() : { data: {} }))
      .then((json) => setDailyStats(json.data?.daily_stats ?? []))
      .catch(() => setDailyStats([]));
  }, [session?.user?.id, calendarMonth.year, calendarMonth.month]);

  const handleStart = async () => {
    if (!session?.user?.id) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    try {
      const res = await fetch("/api/prayer-time/start", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err?.error ?? "시작 실패");
        return;
      }
      const { data } = await res.json();
      const st = parseServerDate(data.start_time);
      setIsPraying(true);
      setIsPaused(false);
      setStartTime(st);
      setPauseStartTime(null);
      setPausedSeconds(0);
      setTimerSeconds(0);
      await loadData();
    } catch {
      toast.error("기도 시작에 실패했습니다.");
    }
  };

  const handlePause = () => {
    if (!isPraying || isPaused) return;
    setIsPaused(true);
    setPauseStartTime(new Date());
    if (startTime) setPausedSeconds((Date.now() - startTime.getTime()) / 1000);
  };

  const handleResume = () => {
    if (!isPaused) return;
    setIsPaused(false);
    setPauseStartTime(null);
    setStartTime(new Date(Date.now() - pausedSeconds * 1000));
  };

  const handleComplete = async () => {
    if (!session?.user?.id) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    const recordedSeconds = timerSeconds;
    const m = Math.floor(recordedSeconds / 60);
    const s = Math.floor(recordedSeconds % 60);
    const ms = Math.floor((recordedSeconds % 1) * 100);
    const toastMessage = `${m}분 ${s}.${String(ms).padStart(2, "0")}초 기록되었어요`;
    try {
      const res = await fetch("/api/prayer-time/stop", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err?.error ?? "종료 실패");
        return;
      }
      toast.success(toastMessage, {
        duration: 3000,
        style: {
          background: "rgba(48, 209, 88, 0.15)",
          color: "#fff",
          border: "1px solid rgba(48, 209, 88, 0.5)",
          borderRadius: "12px",
          padding: "12px 16px",
        },
        icon: "✓",
        iconTheme: { primary: "#30d158", secondary: "#fff" },
      });
    } catch {
      toast.error("기도 종료에 실패했습니다.");
      return;
    }
    setIsPraying(false);
    setIsPaused(false);
    setStartTime(null);
    setPauseStartTime(null);
    setTimerSeconds(0);
    setPausedSeconds(0);
    setActiveUsers((prev) => prev.filter((u) => u.user_id !== session!.user!.id));
    await loadData();
  };

  const scrollToStats = () => {
    setShowStats(true);
    setTimeout(() => statsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const dailyMap = new Map(dailyStats.map((s) => [s.date, s.total_seconds]));
  const now = new Date();
  const todayNum = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  // Figma 84-4381: 월 그리드 (일~토, 기도 안 한 날 opacity 40%)
  const { year: calYear, month: calMonth } = calendarMonth;
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const lastDate = new Date(calYear, calMonth + 1, 0).getDate();
  const calendarCells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: lastDate }, (_, i) => i + 1),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);
  const calendarMonthLabel = new Date(calYear, calMonth, 1).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  const goPrevMonth = () => {
    setCalendarMonth((prev) =>
      prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }
    );
  };
  const goNextMonth = () => {
    setCalendarMonth((prev) =>
      prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }
    );
  };

  if (loading) {
    return (
      <>
        <Header />
        <Page>
          <Main>
            <div style={{ color: "rgba(255,255,255,0.6)", padding: 48 }}>로딩 중...</div>
          </Main>
        </Page>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <Header />
      <Page>
        <Main>
          <Hero>
            <Cross>
              <img src="/images/apps/notk/theCross.svg" alt="십자가" />
            </Cross>
            <Timer>{formatTime(timerSeconds, true)}</Timer>
            <BtnRow>
              {!isPraying && (
                <Btn $variant="gray" onClick={handleStart} whileTap={{ scale: 0.98 }}>
                  기도 시작
                </Btn>
              )}
              {isPraying && !isPaused && (
                <>
                  <Btn $variant="gray" onClick={handleComplete} whileTap={{ scale: 0.98 }}>완료</Btn>
                  <Btn $variant="red" onClick={handlePause} whileTap={{ scale: 0.98 }}>중지</Btn>
                </>
              )}
              {isPraying && isPaused && (
                <>
                  <Btn $variant="gray" onClick={handleComplete} whileTap={{ scale: 0.98 }}>초기화</Btn>
                  <Btn $variant="blue" onClick={handleResume} whileTap={{ scale: 0.98 }}>계속</Btn>
                </>
              )}
            </BtnRow>
            {!isPraying && !showStats && (
              <ScrollHint onClick={scrollToStats} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                <ScrollHintIcon className="scroll-hint-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M7 9.5l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </ScrollHintIcon>
                <span>통계 보기</span>
              </ScrollHint>
            )}
          </Hero>

          {showStats && (
            <StatsBlock ref={statsRef}>
              {activeUsers.length > 0 && (
                <LiveChip onClick={() => setLiveModalOpen(true)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <span>
                    <LiveDot />
                    <LiveLabel>LIVE</LiveLabel>
                    {activeUsers.length}명 기도 중
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>▼</span>
                </LiveChip>
              )}
              {dailyStats.length > 0 && (
                <div style={{ textAlign: "center", marginBottom: 16, color: "#fff", fontSize: 16, fontWeight: 600 }}>
                  이번 달 {dailyStats.length}일 기도함
                </div>
              )}
              <Grid2>
                <Card initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <CardLabel>오늘 나의 기도 시간</CardLabel>
                  <CardValue>{formatMinutes(myStats?.today_seconds ?? 0)}</CardValue>
                </Card>
                <Card initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <CardLabel>나의 총 기도 시간</CardLabel>
                  <CardValue>{formatMinutes(myStats?.total_seconds ?? 0)}</CardValue>
                </Card>
              </Grid2>
              <Card initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <CardLabel>허브 총 기도 시간</CardLabel>
                <CardValueLarge>{formatHoursMinutes(communityStats?.total_seconds ?? 0)}</CardValueLarge>
              </Card>
              <CalendarWrap initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <CalendarHeader>
                  <CalendarTitle>{calendarMonthLabel}</CalendarTitle>
                  <div style={{ display: "flex", gap: 4 }}>
                    <CalendarNav type="button" onClick={goPrevMonth} aria-label="이전 달">‹</CalendarNav>
                    <CalendarNav type="button" onClick={goNextMonth} aria-label="다음 달">›</CalendarNav>
                  </div>
                </CalendarHeader>
                <WeekdayRow>
                  {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </WeekdayRow>
                <CalendarGrid>
                  {calendarCells.map((day, i) => {
                    const empty = day === null;
                    const dateKey =
                      !empty && day !== null
                        ? new Date(calYear, calMonth, day).toISOString().slice(0, 10)
                        : "";
                    const sec = empty ? 0 : dailyMap.get(dateKey) ?? 0;
                    const hasPrayer = sec > 0;
                    const isToday =
                      !empty &&
                      day === todayNum &&
                      calMonth === todayMonth &&
                      calYear === todayYear;
                    return (
                      <CalendarCell
                        key={i}
                        $empty={empty}
                        $hasPrayer={hasPrayer}
                        $today={isToday ?? false}
                      >
                        {!empty && day}
                        {!empty && hasPrayer && (
                          <CalendarCellDuration>+{Math.floor(sec / 60)}</CalendarCellDuration>
                        )}
                      </CalendarCell>
                    );
                  })}
                </CalendarGrid>
              </CalendarWrap>
            </StatsBlock>
          )}
        </Main>
      </Page>

      <AnimatePresence>
        {liveModalOpen && (
          <ModalBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLiveModalOpen(false)}
          >
            <ModalPanel
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <ModalHead>
                <ModalTitle>
                  <LiveDot />
                  기도 중인 사람들
                </ModalTitle>
                <ModalClose onClick={() => setLiveModalOpen(false)}>×</ModalClose>
              </ModalHead>
              {activeUsers.length > 0 ? (
                activeUsers
                  .sort((a, b) => (b.duration_seconds ?? 0) - (a.duration_seconds ?? 0))
                  .map((user, i) => (
                    <UserRow
                      key={user.user_id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <UserName>{user.name}</UserName>
                      <UserDuration>{formatTime(user.duration_seconds ?? 0)}</UserDuration>
                    </UserRow>
                  ))
              ) : (
                <div style={{ textAlign: "center", padding: 32, color: "rgba(255,255,255,0.5)" }}>
                  현재 기도 중인 사람이 없습니다.
                </div>
              )}
            </ModalPanel>
          </ModalBackdrop>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
