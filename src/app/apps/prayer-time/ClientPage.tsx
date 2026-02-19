"use client";

/**
 * 기도시간 사용자 화면
 * Figma: 메인 84-4370, 통계·캘린더 84-4381
 * https://www.figma.com/design/xwGBRQQLtFqblqCwwNFvCY/UI-Design?node-id=84-4370&m=dev
 * https://www.figma.com/design/xwGBRQQLtFqblqCwwNFvCY/UI-Design?node-id=84-4381&m=dev
 * - 배경: background.webp 전체 (메인·통계 경계 없음, 오버레이 fixed)
 * - 84-4381: LIVE N명 기도 중, 오늘/총/허브 기도 시간 카드, 월 그리드 캘린더(일~토, 기도 안 한 날 40% opacity)
 * - 81-3419: 통계 화면 (LIVE 빨간색, 카드 값 크기, 캘린더 +N 빨간색)
 */
import React, { useState, useRef, useCallback, useEffect } from "react";
import styled from "@emotion/styled";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import toast, { Toaster } from "react-hot-toast";
import { Header } from "@src/components/Header";
import { usePrayerTime } from "./usePrayerTime";

const Footer = dynamic(() => import("@src/components/Footer"), { ssr: true });

// Figma 81-2976: 토스트 성공 아이콘 (녹색 원 + 흰 체크)
const TOAST_SUCCESS_GREEN = "#34CB76"; // rgb(52, 203, 118)
const ToastSuccessIcon = () => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 20,
      height: 20,
      aspectRatio: "1 / 1",
      borderRadius: "50%",
      background: TOAST_SUCCESS_GREEN,
      color: "#fff",
    }}
    aria-hidden
  >
    <svg width="12" height="9" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 5.5L5 9.5L13 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

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

// ——— 스타일 (Figma: background.webp 고정 배경 - iOS에서도 스크롤 시 고정) ———
/* 배경: position fixed div 사용 (iOS Safari는 background-attachment: fixed 미지원) */
const FixedBackground = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  background: #121212;
  background-image: url("/images/apps/notk/background.webp");
  background-size: cover;
  background-position: center;
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(18, 18, 18, 0.55);
  }
`;

const Page = styled.div`
  position: relative;
  z-index: 1;
  min-height: 100vh;
  min-height: 100dvh;
  padding-bottom: env(safe-area-inset-bottom, 0);
  > * { position: relative; z-index: 1; }
`;

const SplashScreen = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  background: #121212;
  background-image: url("/images/apps/notk/background.webp");
  background-size: cover;
  background-position: center;
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(18, 18, 18, 0.55);
  }
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  font-weight: 500;
`;

const SplashSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  animation: splash-spin 0.8s linear infinite;
  @keyframes splash-spin {
    to { transform: rotate(360deg); }
  }
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

/* 첫 화면: 타이머 ~ 아래 화살표까지 한 뷰포트에 맞춤 (헤더 높이 제외) */
const FirstScreen = styled.section`
  width: 100%;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 0;
  box-sizing: border-box;
  @media (min-width: 58.75rem) {
    min-height: calc(100vh - 80px);
  }
`;

const Hero = styled.section`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0 16px;
`;

const Cross = styled.div`
  width: 100%;
  max-width: 120px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  svg {
    width: 100%;
    height: auto;
    max-height: 160px;
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
  min-height: 48px;
  min-width: 220px;
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
  &:hover {
    background: ${(p) =>
      p.$variant === "red"
        ? "#ff6b63"
        : p.$variant === "blue"
          ? "#409cff"
          : "rgba(255,255,255,0.18)"};
  }
`;

/* 레이아웃 유지: 기도 시작 후에도 통계 보기 영역 높이 확보 */
const ScrollHintWrap = styled.div<{ $visible: boolean }>`
  flex-shrink: 0;
  min-height: 48px;
  padding-bottom: 8px;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  pointer-events: ${(p) => (p.$visible ? "auto" : "none")};
  visibility: ${(p) => (p.$visible ? "visible" : "hidden")};
`;

/* Figma 81-2941: 통계 보기 화살표 (아래꺽쇠 + 동동 뜨는 인터랙션) */
const ScrollHint = styled(motion.div)<React.ComponentPropsWithoutRef<"div">>`
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
  scroll-margin-top: 140px; /* 버튼 클릭 시 덜 내려가도록 */
`;

const LiveChip = styled(motion.button)<React.ComponentPropsWithoutRef<"button">>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  margin-bottom: 20px;
  background: rgba(255,255,255,0.06);
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

/* 요일·날짜 한 그리드로 묶어 열 정렬 보장 */
const CalendarTable = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  width: 100%;
`;

const WeekdayCell = styled.div`
  text-align: center;
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  font-weight: 500;
  padding-bottom: 8px;
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

/* Figma 116-9199: 기도방 모달 */
const ModalHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  flex: 1;
  text-align: center;
`;

const ModalClose = styled.button`
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  width: 36px;
  &:hover { color: #fff; }
`;

const UserRow = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  &:last-of-type { border-bottom: none; }
`;

const UserAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: #fff;
  margin-bottom: 2px;
`;

const UserGroup = styled.div`
  font-size: 12px;
  color: rgba(255,255,255,0.55);
`;

const UserTimeWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const UserDuration = styled.span`
  font-variant-numeric: tabular-nums;
  font-size: 14px;
  color: rgba(255,255,255,0.8);
`;

// ——— 컴포넌트 ———
export default function PrayerTimeClientPage() {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;
  const {
    loading,
    timer,
    stats,
    activeUsers,
    daily,
  } = usePrayerTime(userId ?? undefined);
  const isInitialLoading = sessionStatus === "loading" || loading;

  const [liveModalOpen, setLiveModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const statsRef = useRef<HTMLElement>(null);

  // 아이폰 오버스크롤 시 밝게 보이는 현상 방지
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#121212";
    return () => {
      document.body.style.backgroundColor = prev;
    };
  }, []);

  const handleStart = useCallback(async () => {
    if (!userId) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    try {
      await timer.start();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "시작 실패");
    }
  }, [userId, timer]);

  const handleComplete = useCallback(async () => {
    if (!userId) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    try {
      const recorded = await timer.complete();
      const m = Math.floor(recorded / 60);
      const s = Math.floor(recorded % 60);
      toast.success(`${m}분 ${s}초 기록되었어요`, {
        duration: 3000,
        style: {
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.10)",
          backdropFilter: "blur(28px)",
          color: "#FFF",
          textAlign: "center",
          fontFamily: "Pretendard, sans-serif",
          fontSize: "14px",
          fontStyle: "normal",
          fontWeight: 500,
          lineHeight: "150%",
          padding: "12px 16px",
        },
        icon: <ToastSuccessIcon />,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "종료 실패");
    }
  }, [userId, timer]);

  const scrollToStats = useCallback(() => {
    statsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // 스크롤이 발생하면 통계 힌트 숨김 + 버튼 클릭과 동일한 위치로 스크롤
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 80) {
        setShowStats((prev) => {
          if (!prev) {
            requestAnimationFrame(() => {
              statsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
            return true;
          }
          return prev;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dailyMap = new Map(daily.dailyStats.map((s) => [s.date, s.total_seconds]));
  const koreaNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const todayNum = koreaNow.getDate();
  const todayMonth = koreaNow.getMonth();
  const todayYear = koreaNow.getFullYear();
  const { year: calYear, month: calMonth } = daily.calendarMonth;
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

  if (isInitialLoading) {
    return (
      <>
        <FixedBackground aria-hidden />
        <Header />
        <Page>
          <Main />
        </Page>
        <SplashScreen aria-live="polite" aria-busy="true">
          <SplashSpinner aria-hidden />
          <span>기도 시간</span>
        </SplashScreen>
      </>
    );
  }

  return (
    <>
      <Toaster
        position="top-center"
        containerStyle={{ marginTop: 72 }}
        toastOptions={{
          style: {
            borderRadius: "16px",
            background: "rgba(255, 255, 255, 0.10)",
            backdropFilter: "blur(28px)",
            color: "#FFF",
            textAlign: "center",
            fontFamily: "Pretendard, sans-serif",
            fontSize: "14px",
            fontStyle: "normal",
            fontWeight: 500,
            lineHeight: "150%",
            padding: "12px 16px",
          },
        }}
      />
      <FixedBackground aria-hidden />
      <Header />
      <Page>
        <Main>
          <FirstScreen>
            <Hero>
              <Cross aria-hidden>
                <svg viewBox="0 0 56 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  {/* 라틴 십자가: 세로 막대 + 가로 막대(위쪽 1/3) */}
                  <path d="M28 4v72M10 28h36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </Cross>
              <Timer>{formatTime(timer.displaySeconds)}</Timer>
              <BtnRow>
                {!timer.isPraying && (
                  <Btn $variant="gray" onClick={handleStart} whileTap={{ scale: 0.98 }}>
                    기도 시작
                  </Btn>
                )}
                {timer.isPraying && !timer.isPaused && (
                  <>
                    <Btn $variant="gray" onClick={handleComplete} whileTap={{ scale: 0.98 }}>완료</Btn>
                    <Btn $variant="red" onClick={timer.pause} whileTap={{ scale: 0.98 }}>중지</Btn>
                  </>
                )}
                {timer.isPraying && timer.isPaused && (
                  <>
                    <Btn $variant="gray" onClick={handleComplete} whileTap={{ scale: 0.98 }}>초기화</Btn>
                    <Btn $variant="blue" onClick={timer.resume} whileTap={{ scale: 0.98 }}>계속</Btn>
                  </>
                )}
              </BtnRow>
            </Hero>
            <ScrollHintWrap $visible={!timer.isPraying && !showStats}>
              <ScrollHint onClick={scrollToStats} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                <ScrollHintIcon className="scroll-hint-icon" aria-hidden>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 9.5l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </ScrollHintIcon>
              </ScrollHint>
            </ScrollHintWrap>
          </FirstScreen>

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
            <Grid2>
                <Card initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <CardLabel>오늘 나의 기도 시간</CardLabel>
                  <CardValue>{formatMinutes(stats.myStats?.today_seconds ?? 0)}</CardValue>
                </Card>
                <Card initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <CardLabel>나의 총 기도 시간</CardLabel>
                  <CardValue>{formatMinutes(stats.myStats?.total_seconds ?? 0)}</CardValue>
                </Card>
              </Grid2>
              <Card initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <CardLabel>허브 총 기도 시간</CardLabel>
                <CardValueLarge>{formatHoursMinutes(stats.communityStats?.total_seconds ?? 0)}</CardValueLarge>
              </Card>
              <CalendarWrap initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <CalendarHeader>
                  <CalendarTitle>{calendarMonthLabel}</CalendarTitle>
                  <div style={{ display: "flex", gap: 4 }}>
                    <CalendarNav type="button" onClick={daily.goPrevMonth} aria-label="이전 달">‹</CalendarNav>
                    <CalendarNav type="button" onClick={daily.goNextMonth} aria-label="다음 달">›</CalendarNav>
                  </div>
                </CalendarHeader>
                <CalendarTable>
                  {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                    <WeekdayCell key={d}>{d}</WeekdayCell>
                  ))}
                  {calendarCells.map((day, i) => {
                    const empty = day === null;
                    const dateKey =
                      !empty && day !== null
                        ? `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
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
                </CalendarTable>
              </CalendarWrap>
          </StatsBlock>
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
                <ModalTitle>기도방</ModalTitle>
                <ModalClose onClick={() => setLiveModalOpen(false)} aria-label="닫기">×</ModalClose>
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
                      <UserAvatar>{user.name?.slice(0, 1) || "?"}</UserAvatar>
                      <UserInfo>
                        <UserName>{user.name}</UserName>
                        <UserGroup>허브인</UserGroup>
                      </UserInfo>
                        <UserTimeWrap>
                          <UserDuration>{formatTime(user.duration_seconds ?? 0)}</UserDuration>
                        </UserTimeWrap>
                    </UserRow>
                  ))
              ) : (
                <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                  현재 기도 중인 사람이 없습니다.
                </div>
              )}
            </ModalPanel>
          </ModalBackdrop>
        )}
      </AnimatePresence>

      <Footer variant="dark" />
    </>
  );
}
