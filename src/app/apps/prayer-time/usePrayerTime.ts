"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@src/lib/supabase";

const parseServerDate = (s: string) => new Date(s);

const PausedStorageKey = "prayer-time-paused";
function getStoredPaused(): { startTime: string; elapsedAtPause: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PausedStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { startTime: string; elapsedAtPause: number };
    return parsed?.startTime != null && typeof parsed?.elapsedAtPause === "number" ? parsed : null;
  } catch {
    return null;
  }
}
function setStoredPaused(startTime: string, elapsedAtPause: number) {
  try {
    sessionStorage.setItem(PausedStorageKey, JSON.stringify({ startTime, elapsedAtPause }));
  } catch {}
}
function clearStoredPaused() {
  try {
    sessionStorage.removeItem(PausedStorageKey);
  } catch {}
}

// ——— 타입 ———
export type LiveUser = {
  user_id: string;
  name: string;
  duration_seconds: number;
  start_time?: string;
};

export type MyStats = {
  today_seconds: number;
  total_seconds: number;
  active_session: { start_time: string } | null;
};

export type CommunityStats = {
  total_seconds: number;
  user_stats: Array<{ user_id: string; name: string; total_seconds: number }>;
};

export type CalendarMonth = { year: number; month: number };

// ——— API ———
async function apiStart() {
  const res = await fetch("/api/prayer-time/start", { method: "POST" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error ?? "시작 실패");
  }
  return res.json();
}

async function apiStop(durationSeconds: number) {
  const res = await fetch("/api/prayer-time/stop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ duration_seconds: Math.round(durationSeconds) }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error ?? "종료 실패");
  }
  return res.json();
}

async function fetchStats(): Promise<{
  my: MyStats | null;
  community: CommunityStats | null;
}> {
  const res = await fetch("/api/prayer-time/stats");
  if (!res.ok) return { my: null, community: null };
  const json = await res.json();
  const data = json.data as {
    my?: MyStats;
    community?: CommunityStats;
  };
  return {
    my: data.my ?? null,
    community: data.community ?? null,
  };
}

async function fetchActiveUsers() {
  const res = await fetch("/api/prayer-time/active");
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data?.users ?? []) as LiveUser[];
}

async function fetchUserName(userId: string): Promise<string> {
  const res = await fetch(`/api/prayer-time/user-name?user_id=${userId}`);
  if (!res.ok) return "알 수 없음";
  const d = await res.json();
  return d.name ?? "알 수 없음";
}

async function fetchDailyStats(year: number, month: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const res = await fetch(`/api/prayer-time/daily?start_date=${start}&end_date=${end}`);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data?.daily_stats ?? []) as Array<{ date: string; total_seconds: number }>;
}

// ——— 훅 ———
export function usePrayerTime(sessionUserId: string | undefined) {
  // 1. 타이머: 서버와 동기화된 뒤에는 startTime + isPaused + elapsedAtPause 만으로 표시값 유도
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedAtPause, setElapsedAtPause] = useState(0);
  const [displaySeconds, setDisplaySeconds] = useState(0);

  // 2. 통계
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // 3. LIVE 목록
  const [activeUsers, setActiveUsers] = useState<LiveUser[]>([]);
  const nameCacheRef = useRef<Map<string, string>>(new Map());
  const userPausedRef = useRef(false); // 중지 상태일 때 서버 동기화로 덮어쓰지 않음

  // 4. 캘린더
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonth>(() => {
    const korea = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    return { year: korea.getFullYear(), month: korea.getMonth() };
  });
  const [dailyStats, setDailyStats] = useState<Array<{ date: string; total_seconds: number }>>([]);

  const isPraying = startTime !== null;
  const refetchStats = useCallback(async (showLoading = false) => {
    if (!sessionUserId) return;
    if (showLoading) setStatsLoading(true);
    try {
      const { my, community } = await fetchStats();
      setMyStats(my ?? null);
      setCommunityStats(community ?? null);
    } finally {
      if (showLoading) setStatsLoading(false);
    }
  }, [sessionUserId]);

  // 통계 최초 로드 1회만 (Strict Mode 이중 실행 방지)
  const statsFetchedForUser = useRef<string | null>(null);
  useEffect(() => {
    if (!sessionUserId) {
      setStatsLoading(false);
      statsFetchedForUser.current = null;
      return;
    }
    if (statsFetchedForUser.current === sessionUserId) return;
    statsFetchedForUser.current = sessionUserId;
    refetchStats(true); // 초기 로드만 로딩 UI 표시
  }, [sessionUserId, refetchStats]);

  // 탭이 보일 때만 2분마다 통계 갱신 (Vercel edge 요청 절감 + 백그라운드 탭은 요청 안 함)
  const STATS_POLL_MS = 120000; // 2분
  useEffect(() => {
    if (!sessionUserId || typeof document === "undefined") return;
    let t: ReturnType<typeof setInterval> | null = null;
    const schedule = () => {
      if (document.visibilityState === "visible") {
        t = setInterval(() => refetchStats(false), STATS_POLL_MS);
      } else if (t) {
        clearInterval(t);
        t = null;
      }
    };
    schedule();
    const onVisibility = () => {
      if (t) clearInterval(t);
      t = null;
      if (document.visibilityState === "visible") {
        refetchStats(false);
        t = setInterval(() => refetchStats(false), STATS_POLL_MS);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (t) clearInterval(t);
    };
  }, [sessionUserId, refetchStats]);

  // 서버 active_session 에 맞춰 타이머 상태 동기화 (다시 들어와도 중지 상태 복원)
  useEffect(() => {
    if (!myStats?.active_session || !sessionUserId) return;
    const serverStart = myStats.active_session.start_time;
    const st = parseServerDate(serverStart);
    if (userPausedRef.current) return; // 같은 탭에서 중지 상태면 서버로 덮어쓰지 않음
    const stored = getStoredPaused();
    const isSameSession = stored && Math.abs(parseServerDate(stored.startTime).getTime() - st.getTime()) < 2000;
    if (stored && isSameSession) {
      // 페이지 재진입: sessionStorage에 저장된 중지 상태 복원
      userPausedRef.current = true;
      setStartTime(st);
      setIsPaused(true);
      setElapsedAtPause(stored.elapsedAtPause);
      setDisplaySeconds(stored.elapsedAtPause);
      return;
    }
    setStartTime(st);
    setIsPaused(false);
    setElapsedAtPause(0);
    setDisplaySeconds(Math.max(0, (Date.now() - st.getTime()) / 1000));
  }, [myStats?.active_session?.start_time, sessionUserId]);

  // 서버에 진행 중인 세션이 없을 때만 타이머 리셋 (최초 로드 후에만)
  const hasStatsLoaded = myStats !== null;
  useEffect(() => {
    if (hasStatsLoaded && sessionUserId && !myStats?.active_session) {
      userPausedRef.current = false;
      clearStoredPaused();
      setStartTime(null);
      setIsPaused(false);
      setElapsedAtPause(0);
      setDisplaySeconds(0);
    }
  }, [hasStatsLoaded, sessionUserId, myStats?.active_session]);

  // 타이머 틱 (진행 중일 때만, 100ms 간격으로 리렌더 최소화)
  useEffect(() => {
    if (!startTime || isPaused) return;
    const interval = setInterval(() => {
      setDisplaySeconds(Math.max(0, (Date.now() - startTime.getTime()) / 1000));
    }, 100);
    return () => clearInterval(interval);
  }, [startTime, isPaused]);

  // LIVE 초기 목록
  const { data: initialActive } = useQuery({
    queryKey: ["prayer-time-active"],
    queryFn: fetchActiveUsers,
    enabled: !!sessionUserId,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (initialActive?.length) {
      setActiveUsers(initialActive);
      initialActive.forEach((u) => nameCacheRef.current.set(u.user_id, u.name));
    }
  }, [initialActive]);

  // LIVE duration 1초마다 갱신
  useEffect(() => {
    if (activeUsers.length === 0) return;
    const interval = setInterval(() => {
      setActiveUsers((prev) =>
        prev.map((u) => {
          if (!u.start_time) return u;
          const dur = Math.floor((Date.now() - parseServerDate(u.start_time).getTime()) / 1000);
          return { ...u, duration_seconds: dur };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [activeUsers.length]);

  // Realtime: 새 세션 추가/삭제
  useEffect(() => {
    if (!sessionUserId) return;
    const channel = supabase
      .channel("prayer-sessions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "prayer_sessions" },
        async (payload) => {
          const row = payload.new as { user_id: string; start_time: string };
          let name = nameCacheRef.current.get(row.user_id);
          if (!name) {
            name = await fetchUserName(row.user_id);
            nameCacheRef.current.set(row.user_id, name);
          }
          setActiveUsers((prev) =>
            prev.some((u) => u.user_id === row.user_id)
              ? prev
              : [...prev, { user_id: row.user_id, name, duration_seconds: 0, start_time: row.start_time }]
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
            fetchActiveUsers().then(setActiveUsers);
          }
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionUserId]);

  // 캘린더 월별 daily
  useEffect(() => {
    if (!sessionUserId) return;
    const { year, month } = calendarMonth;
    fetchDailyStats(year, month).then(setDailyStats);
  }, [sessionUserId, calendarMonth.year, calendarMonth.month]);

  const start = useCallback(async () => {
    if (!sessionUserId) throw new Error("로그인이 필요합니다.");
    const { data } = await apiStart();
    const st = parseServerDate(data.start_time);
    setStartTime(st);
    setIsPaused(false);
    setElapsedAtPause(0);
    setDisplaySeconds(0);
    await refetchStats();
  }, [sessionUserId, refetchStats]);

  const pause = useCallback(() => {
    if (!startTime || isPaused) return;
    const elapsed = (Date.now() - startTime.getTime()) / 1000;
    userPausedRef.current = true;
    setStoredPaused(startTime.toISOString(), elapsed);
    setElapsedAtPause(elapsed);
    setDisplaySeconds(elapsed);
    setIsPaused(true);
  }, [startTime, isPaused]);

  const resume = useCallback(() => {
    if (!isPaused) return;
    userPausedRef.current = false;
    clearStoredPaused();
    setStartTime(new Date(Date.now() - elapsedAtPause * 1000));
    setElapsedAtPause(0);
    setDisplaySeconds(elapsedAtPause); // 0으로 깜빡임 방지
    setIsPaused(false);
  }, [isPaused, elapsedAtPause]);

  const complete = useCallback(async () => {
    if (!sessionUserId) throw new Error("로그인이 필요합니다.");
    const recorded = isPaused ? elapsedAtPause : displaySeconds;
    userPausedRef.current = false;
    clearStoredPaused();
    await apiStop(recorded);
    setStartTime(null);
    setIsPaused(false);
    setElapsedAtPause(0);
    setDisplaySeconds(0);
    setActiveUsers((prev) => prev.filter((u) => u.user_id !== sessionUserId));
    await refetchStats();
    fetchDailyStats(calendarMonth.year, calendarMonth.month).then(setDailyStats);
    setTimeout(() => refetchStats(), 600);
    return recorded;
  }, [sessionUserId, isPaused, elapsedAtPause, displaySeconds, refetchStats, calendarMonth.year, calendarMonth.month]);

  const goPrevMonth = useCallback(() => {
    setCalendarMonth((p) => (p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 }));
  }, []);

  const goNextMonth = useCallback(() => {
    setCalendarMonth((p) => (p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 }));
  }, []);

  return {
    loading: statsLoading,
    timer: {
      displaySeconds: isPaused ? elapsedAtPause : displaySeconds,
      isPraying,
      isPaused,
      start,
      pause,
      resume,
      complete,
    },
    stats: { myStats, communityStats, refetch: refetchStats },
    activeUsers,
    daily: { dailyStats, calendarMonth, goPrevMonth, goNextMonth },
  };
}
