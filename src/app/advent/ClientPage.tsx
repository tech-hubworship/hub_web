"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styled from "@emotion/styled";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Header } from "@src/components/Header";
import Footer from "@src/components/Footer";
import {
  IntroSection,
  EventInfoSection,
  VideoSection,
  AttendanceSection,
  MeditationSection,
  PreviousVideosSection,
  CountdownSection,
} from "@src/components/advent";
import { AdventPost, AdventComment, PreviousPost } from "@src/lib/advent/types";
import { getDayNumber } from "@src/lib/advent/utils";

// ==================== Container & Wrapper ====================
const Container = styled.div`
  min-height: 100vh;
  background: transparent;
  padding: 80px 0 0;
  background-color: #000000;

  @media (max-width: 768px) {
    padding: 60px 0 0;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 0;
  background-color: #000000;

  @media (max-width: 768px) {
    padding: 0 16px 0;
  }
`;

const SectionWrapper = styled(motion.div)`
  margin-bottom: 0;
`;

// 스크롤 안내 문구
const ScrollHint = styled(motion.div)`
  text-align: center;
  padding: 24px 20px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  background: transparent;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 20px 16px;
    font-size: 14px;
  }
`;

const ScrollHintText = styled(motion.div)<{ isHiding: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: ${(props) => (props.isHiding ? "#000000" : "#CEB2FF")};
  font-size: 16px;
  font-weight: 500;
  transition: color 0.6s ease;

  @media (max-width: 768px) {
    font-size: 14px;
    gap: 10px;
  }
`;

const ScrollArrow = styled(motion.div)<{ isHiding: boolean }>`
  font-size: 24px;
  color: ${(props) => (props.isHiding ? "#000000" : "#CEB2FF")};
  transition: color 0.6s ease;

  ${(props) =>
    !props.isHiding &&
    `
    animation: bounce 1.5s ease-in-out infinite;

    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(8px);
      }
    }
  `}

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

// ==================== Empty State Section ====================
const EmptyStateCard = styled.div`
  background: linear-gradient(135deg, #f8f9ff 0%, #fff5f8 100%);
  padding: 60px 40px;
  border-radius: 20px;
  border: 1px solid rgba(206, 178, 255, 0.2);
  box-shadow: 0 8px 32px rgba(206, 178, 255, 0.1);
  margin: 40px 0;

  @media (max-width: 768px) {
    padding: 40px 24px;
    margin: 30px 0;
    border-radius: 16px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;

  @media (max-width: 768px) {
    gap: 20px;
    padding: 10px;
  }
`;

const VideoIconWrapper = styled(motion.div)`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #CEB2FF 0%, #9B7FD9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(206, 178, 255, 0.3);
  margin-bottom: 8px;

  @media (max-width: 768px) {
    width: 64px;
    height: 64px;
  }
`;

const VideoIcon = styled.div`
  font-size: 36px;
  color: #ffffff;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const EmptyStateTitle = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: #724886;
  line-height: 1.6;
  white-space: pre-line;

  @media (max-width: 768px) {
    font-size: 18px;
    line-height: 1.5;
  }
`;

const EmptyStateSubtitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #9B7FD9;
  line-height: 1.6;
  margin-top: 8px;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-top: 4px;
  }
`;

const PrayerIcon = styled(motion.div)`
  font-size: 24px;
  color: #CEB2FF;
  margin-top: 8px;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

// ==================== Loading & Error States ====================
const ErrorText = styled.div`
  text-align: center;
  color: #fee;
  background: rgba(239, 68, 68, 0.9);
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
  border-bottom: 1px solid #f3f4f6;

  @media (max-width: 768px) {
    padding: 16px;
    font-size: 14px;
  }
`;

// ==================== Modal Styles ====================
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  text-align: center;

  @media (max-width: 768px) {
    padding: 24px;
    max-width: 90%;
  }
`;

const ModalTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 16px;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const ModalMessage = styled.div`
  font-size: 16px;
  color: #4b5563;
  line-height: 1.6;
  white-space: pre-line;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ModalButton = styled.button`
  width: 100%;
  padding: 14px 24px;
  background: #724886;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #5d3a6b;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 14px;
  }
`;

const SpecialAttendanceModalContent = styled(ModalContent)`
  max-width: 500px;
`;

const SpecialAttendanceTitle = styled(ModalTitle)`
  color: #724886;
  font-size: 22px;
  margin-bottom: 20px;
`;

const SpecialAttendanceMessage = styled(ModalMessage)`
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 30px;
`;

const DateButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;

const DateButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  padding: 16px 24px;
  background: ${(props) => (props.disabled ? "#e5e7eb" : "#724886")};
  color: ${(props) => (props.disabled ? "#9ca3af" : "#ffffff")};
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    background: #5d3a6b;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 14px 20px;
    font-size: 14px;
  }
`;

const DateLabel = styled.span`
  font-weight: 700;
`;

const CloseButton = styled(ModalButton)`
  background: #6b7280;
  margin-top: 12px;

  &:hover {
    background: #4b5563;
  }
`;

// 이벤트 종료 화면 스타일
const EventEndedCard = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  padding: 60px 40px;
  border-radius: 20px;
  border: 2px solid rgba(206, 178, 255, 0.3);
  box-shadow: 0 8px 32px rgba(206, 178, 255, 0.2);
  margin: 40px 0;
  text-align: center;

  @media (max-width: 768px) {
    padding: 40px 24px;
    margin: 30px 0;
    border-radius: 16px;
  }
`;

const EventEndedTitle = styled.div`
  font-size: 32px;
  font-weight: 800;
  color: #CEB2FF;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const EventEndedMessage = styled.div`
  font-size: 18px;
  color: #ffffff;
  line-height: 1.8;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 30px;
  }
`;

// ==================== Main Component ====================
export default function AdventClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const fallbackDate = useMemo(() => {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return koreanTime.toISOString().slice(0, 10).replace(/-/g, "");
  }, []);
  const queryDate = searchParams?.get("date") ?? "";

  const currentAsPath = useMemo(() => {
    const qs = searchParams?.toString() ?? "";
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams]);

  const [post, setPost] = useState<AdventPost | null>(null);
  const [comments, setComments] = useState<AdventComment[]>([]);
  const [previousPosts, setPreviousPosts] = useState<PreviousPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showMyMeditation, setShowMyMeditation] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [meditationSaved, setMeditationSaved] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMeditationSavedModal, setShowMeditationSavedModal] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [showFullScreenIntro, setShowFullScreenIntro] = useState(true);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [hideScrollHint, setHideScrollHint] = useState(false);
  const [showSpecialAttendanceModal, setShowSpecialAttendanceModal] = useState(false);
  const [specialAttendanceDates, setSpecialAttendanceDates] = useState<string[]>([]);
  const [checkingSpecialAttendance, setCheckingSpecialAttendance] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("orientationchange", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", checkMobile);
    };
  }, []);

  // API 중복 호출 방지를 위한 캐시
  const postCacheRef = useRef<Map<string, { post: AdventPost | null; timestamp: number }>>(new Map());
  const CACHE_DURATION = 300000;

  const fetchPost = useCallback(async (date: string) => {
    const cached = postCacheRef.current.get(date);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setPost(cached.post);
      setLoading(false);
      setShowFullScreenIntro(false);
      setShowScrollHint(true);
      return;
    }

    try {
      setLoading(true);
      setShowFullScreenIntro(true);
      const startTime = Date.now();
      setLoadingStartTime(startTime);
      setError(null);

      const response = await fetch(`/api/advent/posts?date=${date}`, { cache: "default" });
      const data = await response.json();

      if (response.ok) {
        const postData = data.post || null;
        setPost(postData);
        postCacheRef.current.set(date, { post: postData, timestamp: Date.now() });
      } else {
        setError(data.error || "게시물을 불러오는데 실패했습니다.");
      }

      const elapsed = Date.now() - startTime;
      const minDisplayTime = 1000;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      setTimeout(() => {
        setLoading(false);
        setTimeout(() => {
          setShowFullScreenIntro(false);
          setShowScrollHint(true);
        }, 300);
      }, remainingTime);
    } catch (err) {
      setError("게시물을 불러오는데 실패했습니다.");
      const startTime = loadingStartTime || Date.now();
      const elapsed = Date.now() - startTime;
      const minDisplayTime = 1000;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      setTimeout(() => {
        setLoading(false);
        setTimeout(() => {
          setShowFullScreenIntro(false);
          setShowScrollHint(true);
        }, 300);
      }, remainingTime);
    }
  }, [loadingStartTime]);

  const fetchComments = useCallback(async (date: string, page = 1, limit = 20, showLoading = false, skipCache = false) => {
    try {
      if (showLoading) setLoadingComments(true);
      const url = skipCache
        ? `/api/advent/comments?date=${date}&page=${page}&limit=${limit}&_t=${Date.now()}`
        : `/api/advent/comments?date=${date}&page=${page}&limit=${limit}`;

      const response = await fetch(url, { cache: skipCache ? "no-store" : "default" });
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments || []);
        setTotalComments(data.total || 0);
      }
    } catch (err) {
      console.error("댓글 조회 오류:", err);
    } finally {
      if (showLoading) setLoadingComments(false);
    }
  }, []);

  const fetchUserComments = useCallback(async (page = 1, limit = 20, showLoading = false) => {
    try {
      if (showLoading) setLoadingComments(true);
      const response = await fetch(`/api/advent/user-comments?page=${page}&limit=${limit}`);
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments || []);
        setTotalComments(data.total || 0);
      }
    } catch (err) {
      console.error("사용자 묵상 조회 오류:", err);
      setComments([]);
      setTotalComments(0);
    } finally {
      if (showLoading) setLoadingComments(false);
    }
  }, []);

  const fetchPreviousPosts = useCallback(async (currentPostDt?: string) => {
    try {
      setLoadingPrevious(true);
      const response = await fetch("/api/advent/posts-list?limit=12", { cache: "default" });
      const data = await response.json();

      if (response.ok) {
        const filtered = data.posts?.filter((p: PreviousPost) => p.post_dt !== currentPostDt) || [];
        setPreviousPosts(filtered.slice(0, 12));
      }
    } catch (err) {
      console.error("지난 게시물 조회 오류:", err);
    } finally {
      setLoadingPrevious(false);
    }
  }, []);

  // URL 쿼리 date 사용 (없으면 fallback)
  useEffect(() => {
    const dateToUse = queryDate || fallbackDate;
    if (selectedDate !== dateToUse) {
      setSelectedDate(dateToUse);
      setMeditationSaved(false);
      fetchPost(dateToUse);
    }
  }, [queryDate, fallbackDate, selectedDate, fetchPost]);

  // 페이지당 아이템 수 (모바일: 5, PC: 8)
  const itemsPerPage = isMobile ? 5 : 8;

  useEffect(() => {
    if (post?.post_dt && !loading) {
      fetchPreviousPosts(post.post_dt);
    }
  }, [post?.post_dt, loading, fetchPreviousPosts]);

  // 특별 출석 날짜 체크 (12월 24일, 25일에 20일, 21일 출석 체크)
  const checkSpecialAttendance = useCallback(async () => {
    if (!session?.user) return;

    const specialDates = ["20251220", "20251221"];
    const now = new Date();
    const currentDateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

    const isSpecialPeriod = currentDateStr === "20251224" || currentDateStr === "20251225";
    if (!isSpecialPeriod) return;

    try {
      setCheckingSpecialAttendance(true);
      const missingDates: string[] = [];

      for (const date of specialDates) {
        const response = await fetch(`/api/advent/attendance?post_dt=${date}`);
        const data = await response.json();
        if (response.ok && !data.attendance) missingDates.push(date);
      }

      if (missingDates.length > 0) {
        setSpecialAttendanceDates(missingDates);
        setShowSpecialAttendanceModal(true);
      }
    } catch (err) {
      console.error("특별 출석 확인 오류:", err);
    } finally {
      setCheckingSpecialAttendance(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user && !loading) {
      checkSpecialAttendance();
    }
  }, [session?.user, loading, checkSpecialAttendance]);

  // 특별 출석 처리
  const handleSpecialAttendance = useCallback(async (date: string) => {
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(currentAsPath ?? "/advent")}`);
      return;
    }

    const dayNumber = getDayNumber(date);
    if (!dayNumber) {
      alert("올바른 날짜가 아닙니다.");
      return;
    }

    try {
      const commentResponse = await fetch("/api/advent/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_dt: date, content: "아멘" }),
      });
      const commentData = await commentResponse.json();
      if (!commentResponse.ok && commentData.error !== "이미 출석하셨습니다.") {
        console.warn("묵상 저장 실패:", commentData.error);
      }

      const attendanceResponse = await fetch("/api/advent/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_dt: date, day_number: dayNumber }),
      });
      const attendanceData = await attendanceResponse.json();

      if (attendanceResponse.ok) {
        setSpecialAttendanceDates((prev) => prev.filter((d) => d !== date));
        if (specialAttendanceDates.filter((d) => d !== date).length === 0) {
          setShowSpecialAttendanceModal(false);
        }
        alert(`${date.slice(4, 6)}월 ${date.slice(6, 8)}일 출석이 완료되었습니다.`);
      } else {
        alert(attendanceData.error || "출석 처리에 실패했습니다.");
      }
    } catch (err) {
      console.error("특별 출석 처리 오류:", err);
      alert("출석 처리 중 오류가 발생했습니다.");
    }
  }, [session?.user, router, currentAsPath, specialAttendanceDates]);

  const handleCommentSubmit = useCallback(async (): Promise<boolean> => {
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(currentAsPath ?? "/advent")}`);
      return false;
    }

    if (!commentText.trim()) {
      alert("묵상을 입력해주세요.");
      return false;
    }

    if (!post) {
      alert("게시물을 먼저 불러와주세요.");
      return false;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/advent/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_dt: post.post_dt, content: commentText.trim() }),
      });

      const data = await response.json();
      if (response.ok) {
        setCommentText("");
        setMeditationSaved(true);

        await new Promise((resolve) => setTimeout(resolve, 200));
        setCommentsPage(1);
        fetchComments(post.post_dt, 1, itemsPerPage, true, true);
        setShowMeditationSavedModal(true);
        return true;
      } else {
        alert(data.error || "묵상 작성에 실패했습니다.");
        return false;
      }
    } catch (err) {
      alert("묵상 작성 중 오류가 발생했습니다.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [session?.user, router, currentAsPath, commentText, post, fetchComments, itemsPerPage]);

  const handlePreviousVideoClick = (date: string) => {
    router.push(`/advent?date=${date}`);
  };

  const currentDateStr = queryDate || fallbackDate;
  const dayNumber = getDayNumber(currentDateStr);

  const getFirstDayTargetDate = (): Date => {
    return new Date(2025, 10, 30, 0, 0, 0);
  };

  const firstDayTargetDate = getFirstDayTargetDate();
  const isDayZero = dayNumber === null || dayNumber <= 0;

  const getCurrentDateStr = (): string => {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return koreanTime.toISOString().slice(0, 10).replace(/-/g, "");
  };

  const dateToCheck = currentDateStr || getCurrentDateStr();
  const isEventEnded = dateToCheck >= "20251226";

  useEffect(() => {
    if (post?.post_dt && !showMyMeditation && !isEventEnded) {
      setCommentsPage(1);
      fetchComments(post.post_dt, 1, itemsPerPage);
    }
  }, [post?.post_dt, showMyMeditation, fetchComments, itemsPerPage, isEventEnded]);

  useEffect(() => {
    if (showMyMeditation && session?.user && !isEventEnded) {
      setCommentsPage(1);
      fetchUserComments(1, itemsPerPage);
    } else if (showMyMeditation && !session?.user) {
      setComments([]);
    }
  }, [showMyMeditation, session?.user, fetchUserComments, itemsPerPage, isEventEnded]);

  useEffect(() => {
    if (isEventEnded && session?.user && !loading) {
      setShowMyMeditation(true);
      fetchUserComments(1, itemsPerPage, true);
    }
  }, [isEventEnded, session?.user, loading, fetchUserComments, itemsPerPage]);

  return (
    <>
      <Header />

      <Container>
        <ContentWrapper>
          <IntroSection post={post || undefined} isLoading={showFullScreenIntro} />

          {showScrollHint && (
            <ScrollHint
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <ScrollHintText isHiding={hideScrollHint}>
                <ScrollArrow isHiding={hideScrollHint}>↓</ScrollArrow>
              </ScrollHintText>
            </ScrollHint>
          )}

          {!loading && !showFullScreenIntro && (
            <>
              {isEventEnded && (
                <>
                  <SectionWrapper
                    initial={isMobile ? false : { opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <EventEndedCard>
                      <EventEndedTitle>대림절 이벤트가 종료되었습니다</EventEndedTitle>
                      <EventEndedMessage>
                        대림절 이벤트가 성공적으로 마무리되었습니다.{"\n"}
                        참여해주신 모든 분들께 감사드립니다.{"\n\n"}
                        아래에서 전체 출석 현황과 내 묵상을 확인하실 수 있습니다.
                      </EventEndedMessage>
                    </EventEndedCard>
                  </SectionWrapper>

                  <SectionWrapper
                    initial={isMobile ? false : { opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: isMobile ? "-50px" : "-100px", amount: isMobile ? 0 : 0.3 }}
                    transition={{ duration: isMobile ? 0.2 : 0.6, delay: isMobile ? 0 : 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <AttendanceSection
                      currentDate="20251225"
                      isLoggedIn={!!session?.user}
                      commentText=""
                      submitting={false}
                      meditationSaved={false}
                      onCommentTextChange={() => {}}
                      onCommentSubmit={async () => false}
                      onMeditationSavedChange={() => {}}
                      isEventEnded={true}
                    />
                  </SectionWrapper>

                  {session?.user && (
                    <SectionWrapper
                      initial={isMobile ? false : { opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: isMobile ? "-50px" : "-100px", amount: isMobile ? 0 : 0.3 }}
                      transition={{ duration: isMobile ? 0.2 : 0.6, delay: isMobile ? 0 : 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <MeditationSection
                        comments={comments}
                        totalComments={totalComments}
                        currentPage={commentsPage}
                        isLoggedIn={!!session?.user}
                        showMyMeditation={true}
                        loading={loadingComments}
                        onToggleMyMeditation={async () => {
                          setCommentsPage(1);
                          setLoadingComments(true);
                          setComments([]);
                          try {
                            await fetchUserComments(1, itemsPerPage, true);
                          } catch (err) {
                            console.error("묵상 조회 오류:", err);
                            setLoadingComments(false);
                          }
                        }}
                        onPageChange={(page: number) => {
                          setCommentsPage(page);
                          fetchUserComments(page, itemsPerPage, true);
                        }}
                        isEventEnded={true}
                      />
                    </SectionWrapper>
                  )}
                </>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <ErrorText>{error}</ErrorText>
                </motion.div>
              )}

              {!error && !post && !isEventEnded && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}>
                  <EmptyStateCard>
                    <EmptyState>
                      <VideoIconWrapper initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}>
                        <VideoIcon>🎬</VideoIcon>
                      </VideoIconWrapper>
                      <EmptyStateTitle>영상 제작팀이 열심히 영상을 제작중입니다</EmptyStateTitle>
                      <EmptyStateSubtitle>헌신하는 영상제작팀을 위해 기도해주세요</EmptyStateSubtitle>
                      <PrayerIcon
                        animate={{ y: [0, -8, 0], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        🙏
                      </PrayerIcon>
                    </EmptyState>
                  </EmptyStateCard>
                </motion.div>
              )}

              {post && !isEventEnded && (
                <>
                  <SectionWrapper
                    initial={isMobile ? false : { opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: isMobile ? "-50px" : "-100px", amount: isMobile ? 0 : 0.3 }}
                    transition={{ duration: isMobile ? 0.2 : 0.6, delay: isMobile ? 0 : 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <EventInfoSection onCandleVisible={() => setHideScrollHint(true)} />
                  </SectionWrapper>

                  <SectionWrapper
                    initial={isMobile ? false : { opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: isMobile ? "-50px" : "-100px", amount: isMobile ? 0 : 0.3 }}
                    transition={{ duration: isMobile ? 0.2 : 0.6, delay: isMobile ? 0 : 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <VideoSection post={post} currentDate={currentDateStr} />
                  </SectionWrapper>

                  {isDayZero && (
                    <SectionWrapper
                      initial={isMobile ? false : { opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: isMobile ? "-50px" : "-100px", amount: isMobile ? 0 : 0.3 }}
                      transition={{ duration: isMobile ? 0.2 : 0.6, delay: isMobile ? 0 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <CountdownSection targetDate={firstDayTargetDate} />
                    </SectionWrapper>
                  )}

                  {!isDayZero && (
                    <>
                      <SectionWrapper
                        initial={isMobile ? false : { opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: isMobile ? "-50px" : "-100px", amount: isMobile ? 0 : 0.3 }}
                        transition={{ duration: isMobile ? 0.2 : 0.6, delay: isMobile ? 0 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      >
                        <AttendanceSection
                          currentDate={post.post_dt}
                          isLoggedIn={!!session?.user}
                          commentText={commentText}
                          submitting={submitting}
                          meditationSaved={meditationSaved}
                          onCommentTextChange={setCommentText}
                          onCommentSubmit={handleCommentSubmit}
                          onMeditationSavedChange={setMeditationSaved}
                        />
                      </SectionWrapper>

                      <div>
                        <MeditationSection
                          comments={comments}
                          totalComments={totalComments}
                          currentPage={commentsPage}
                          isLoggedIn={!!session?.user}
                          showMyMeditation={showMyMeditation}
                          loading={loadingComments}
                          onToggleMyMeditation={async () => {
                            const newShow = !showMyMeditation;
                            setShowMyMeditation(newShow);
                            setCommentsPage(1);
                            setLoadingComments(true);
                            setComments([]);
                            try {
                              if (newShow) {
                                await fetchUserComments(1, itemsPerPage, true);
                              } else if (post?.post_dt) {
                                await fetchComments(post.post_dt, 1, itemsPerPage, true);
                              }
                            } catch (err) {
                              console.error("묵상 조회 오류:", err);
                              setLoadingComments(false);
                            }
                          }}
                          onPageChange={(page: number) => {
                            setCommentsPage(page);
                            if (showMyMeditation) {
                              fetchUserComments(page, itemsPerPage, true);
                            } else if (post?.post_dt) {
                              fetchComments(post.post_dt, page, itemsPerPage, true);
                            }
                          }}
                          isEventEnded={false}
                        />
                      </div>
                    </>
                  )}

                  <SectionWrapper
                    initial={isMobile ? false : { opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: isMobile ? "-50px" : "0px", amount: isMobile ? 0 : 0.3 }}
                    transition={{ duration: isMobile ? 0.2 : 0.6, delay: isMobile ? 0 : 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <PreviousVideosSection previousPosts={previousPosts} loading={loadingPrevious} onVideoClick={handlePreviousVideoClick} />
                  </SectionWrapper>
                </>
              )}
            </>
          )}
        </ContentWrapper>
      </Container>

      {!loading && <Footer />}

      {showMeditationSavedModal && (
        <ModalOverlay onClick={() => setShowMeditationSavedModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>묵상저장이 완료되었습니다.</ModalTitle>
            <ModalMessage>{"출석하기"} 버튼을 꼭 눌러주셔야{"\n"}출석이 인정됩니다.</ModalMessage>
            <ModalButton onClick={() => setShowMeditationSavedModal(false)}>확인</ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}

      {showSpecialAttendanceModal && (
        <ModalOverlay onClick={() => setShowSpecialAttendanceModal(false)}>
          <SpecialAttendanceModalContent onClick={(e) => e.stopPropagation()}>
            <SpecialAttendanceTitle>특별 출석 안내</SpecialAttendanceTitle>
            <SpecialAttendanceMessage>
              12월 20일과 21일은 모든 분들이 출석하실 수 있습니다.{"\n"}
              출석하지 않은 날짜의 버튼을 눌러주세요.{"\n\n"}
              묵상은 "아멘"으로 자동 저장됩니다.
            </SpecialAttendanceMessage>
            <DateButtonGroup>
              {specialAttendanceDates.includes("20251220") && (
                <DateButton onClick={() => handleSpecialAttendance("20251220")}>
                  <DateLabel>12월 20일</DateLabel>
                  <span>출석하기</span>
                </DateButton>
              )}
              {specialAttendanceDates.includes("20251221") && (
                <DateButton onClick={() => handleSpecialAttendance("20251221")}>
                  <DateLabel>12월 21일</DateLabel>
                  <span>출석하기</span>
                </DateButton>
              )}
            </DateButtonGroup>
            <CloseButton onClick={() => setShowSpecialAttendanceModal(false)}>닫기</CloseButton>
          </SpecialAttendanceModalContent>
        </ModalOverlay>
      )}
    </>
  );
}

