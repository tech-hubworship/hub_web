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
} from "@src/components/video-event";
import { VideoEventPost, VideoEventComment, PreviousPost } from "@src/lib/video-event/types";
import { getDayNumber } from "@src/lib/video-event/utils";
import { VIDEO_EVENT, getVideoEventPath } from "@src/lib/video-event/constants";

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
  color: ${(props) => (props.isHiding ? "#000000" : "#ffffff")};
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
  color: ${(props) => (props.isHiding ? "#000000" : "#ffffff")};
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
  border: 1px solid rgba(239, 0, 23, 0.2);
  box-shadow: 0 8px 32px rgba(239, 0, 23, 0.1);
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
  background: linear-gradient(135deg, #EF0017 0%, #c90014 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(239, 0, 23, 0.3);
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
  color: #ffffff;
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
  color: #ffffff;
  line-height: 1.6;
  margin-top: 8px;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-top: 4px;
  }
`;

const PrayerIcon = styled(motion.div)`
  font-size: 24px;
  color: #ffffff;
  margin-top: 8px;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

// ==================== Loading & Error States ====================
const ErrorText = styled.div`
  text-align: center;
  color: #ffffff;
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
  color: #ffffff;
  margin-bottom: 16px;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const ModalMessage = styled.div`
  font-size: 16px;
  color: #ffffff;
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
  background: #EF0017;
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
  color: #ffffff;
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
  background: ${(props) => (props.disabled ? "#e5e7eb" : "#EF0017")};
  color: ${(props) => (props.disabled ? "#ffffff" : "#ffffff")};
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
  border: 2px solid rgba(239, 0, 23, 0.3);
  box-shadow: 0 8px 32px rgba(239, 0, 23, 0.2);
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
  color: #ffffff;
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
export default function VideoEventClientPage() {
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

  const [post, setPost] = useState<VideoEventPost | null>(null);
  const [comments, setComments] = useState<VideoEventComment[]>([]);
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
  const [loadingComments, setLoadingComments] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [showFullScreenIntro, setShowFullScreenIntro] = useState(true);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [hideScrollHint, setHideScrollHint] = useState(false);

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
  const postCacheRef = useRef<Map<string, { post: VideoEventPost | null; timestamp: number }>>(new Map());
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

      const response = await fetch(`/api/video-event/posts?date=${date}`, { cache: "default" });
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
        ? `/api/video-event/comments?date=${date}&page=${page}&limit=${limit}&_t=${Date.now()}`
        : `/api/video-event/comments?date=${date}&page=${page}&limit=${limit}`;

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
      const response = await fetch(`/api/video-event/user-comments?page=${page}&limit=${limit}`);
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
      const response = await fetch("/api/video-event/posts-list?limit=12", { cache: "default" });
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

  const handleCommentSubmit = useCallback(async (): Promise<boolean> => {
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(currentAsPath ?? getVideoEventPath())}`);
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

      const response = await fetch("/api/video-event/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_dt: post.post_dt, content: commentText.trim() }),
      });

      const data = await response.json();
      if (response.ok) {
        setCommentText("");
        await new Promise((resolve) => setTimeout(resolve, 200));
        setCommentsPage(1);
        fetchComments(post.post_dt, 1, itemsPerPage, true, true);
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
    router.push(`${getVideoEventPath()}?date=${date}`);
  };

  const currentDateStr = queryDate || fallbackDate;
  const dayNumber = getDayNumber(currentDateStr);

  const getFirstDayTargetDate = (): Date => {
    const b = VIDEO_EVENT.BASE_DATE;
    return new Date(
      parseInt(b.slice(0, 4), 10),
      parseInt(b.slice(4, 6), 10) - 1,
      parseInt(b.slice(6, 8), 10),
      0,
      0,
      0
    );
  };

  const firstDayTargetDate = getFirstDayTargetDate();
  const isDayZero = dayNumber === null || dayNumber <= 0;

  const getCurrentDateStr = (): string => {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return koreanTime.toISOString().slice(0, 10).replace(/-/g, "");
  };

  const dateToCheck = currentDateStr || getCurrentDateStr();
  // END_DATE 다음날부터 종료로 처리 (예: 20251225 → 20251226 이상이면 종료)
  const endDateNext = VIDEO_EVENT.END_DATE.slice(0, 6) + String(parseInt(VIDEO_EVENT.END_DATE.slice(6, 8), 10) + 1).padStart(2, "0");
  const isEventEnded = dateToCheck >= endDateNext;

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
                      <EventEndedTitle>{VIDEO_EVENT.DISPLAY_NAME} 이벤트가 종료되었습니다</EventEndedTitle>
                      <EventEndedMessage>
                        {VIDEO_EVENT.DISPLAY_NAME} 이벤트가 성공적으로 마무리되었습니다.{"\n"}
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
                      currentDate={VIDEO_EVENT.END_DATE}
                      isLoggedIn={!!session?.user}
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
                          currentPostDt={post?.post_dt}
                          commentText={commentText}
                          onCommentTextChange={setCommentText}
                          onSubmit={handleCommentSubmit}
                          submitting={submitting}
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

    </>
  );
}

