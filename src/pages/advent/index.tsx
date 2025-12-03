import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styled from '@emotion/styled';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@src/components/Header';
import Footer from '@src/components/Footer';
import { 
  IntroSection, 
  EventInfoSection,
  VideoSection, 
  AttendanceSection, 
  MeditationSection, 
  PreviousVideosSection,
  CountdownSection
} from '@src/components/advent';
import { AdventPost, AdventComment, PreviousPost } from '@src/lib/advent/types';
import { getDayNumber } from '@src/lib/advent/utils';

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
  color: ${props => props.isHiding ? '#000000' : '#CEB2FF'};
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
  color: ${props => props.isHiding ? '#000000' : '#CEB2FF'};
  transition: color 0.6s ease;
  
  ${props => !props.isHiding && `
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
  background: #ffffff;
  padding: 40px;
  border-bottom: 1px solid #f3f4f6;

  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #6b7280;
  padding: 60px 20px;
  font-size: 18px;

  @media (max-width: 768px) {
    padding: 40px 16px;
    font-size: 16px;
  }
`;

// ==================== Loading & Error States ====================
const LoadingText = styled.div`
  text-align: center;
  color: #6b7280;
  font-size: 18px;
  padding: 40px;
  background: #ffffff;
  border-bottom: 1px solid #f3f4f6;

  @media (max-width: 768px) {
    font-size: 16px;
    padding: 32px 20px;
  }
`;

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

// ==================== Main Component ====================
const AdventPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<AdventPost | null>(null);
  const [comments, setComments] = useState<AdventComment[]>([]);
  const [previousPosts, setPreviousPosts] = useState<PreviousPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showMyMeditation, setShowMyMeditation] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [meditationSaved, setMeditationSaved] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMeditationSavedModal, setShowMeditationSavedModal] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [showFullScreenIntro, setShowFullScreenIntro] = useState(true); // 초기값을 true로 설정하여 전체 화면부터 시작
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [hideScrollHint, setHideScrollHint] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      // 너비가 768px 이하인 경우 모바일로 감지
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // API 중복 호출 방지를 위한 캐시
  const postCacheRef = useRef<Map<string, { post: AdventPost | null; timestamp: number }>>(new Map());
  const CACHE_DURATION = 300000; // 5분 캐시 (서버 캐시와 함께 사용하여 Edge request 최소화)

  const fetchPost = useCallback(async (date: string) => {
    // 캐시 확인
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
      
      // Pages Router에서는 fetch의 next 옵션이 작동하지 않으므로
      // 클라이언트 측 캐시(postCacheRef)를 사용하여 중복 요청 방지
      const response = await fetch(`/api/advent/posts?date=${date}`, {
        cache: 'default', // 브라우저 캐시 사용
      });
      const data = await response.json();

      if (response.ok) {
        const postData = data.post || null;
        setPost(postData);
        // 캐시에 저장
        postCacheRef.current.set(date, { post: postData, timestamp: Date.now() });
      } else {
        setError(data.error || '게시물을 불러오는데 실패했습니다.');
      }
      
      // 최소 1초는 전체 화면으로 표시 (로딩이 빨리 끝나도 여유있게)
      const elapsed = Date.now() - startTime;
      const minDisplayTime = 1000;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      
      setTimeout(() => {
        setLoading(false);
        // 추가로 0.3초 더 전체 화면 유지 후 일반 크기로 전환
        setTimeout(() => {
          setShowFullScreenIntro(false);
          // 안내 문구 표시 (EventInfoSection 애니메이션 시작 전까지 표시)
          setShowScrollHint(true);
        }, 300);
      }, remainingTime);
    } catch (err) {
      setError('게시물을 불러오는데 실패했습니다.');
      const startTime = loadingStartTime || Date.now();
      const elapsed = Date.now() - startTime;
      const minDisplayTime = 1000;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      
        setTimeout(() => {
          setLoading(false);
          setTimeout(() => {
            setShowFullScreenIntro(false);
            // 안내 문구 표시 (EventInfoSection 애니메이션 시작 전까지 표시)
            setShowScrollHint(true);
          }, 300);
        }, remainingTime);
    }
  }, []); // loadingStartTime은 내부에서만 사용되므로 의존성에서 제거

  const fetchComments = useCallback(async (date: string, page: number = 1, limit: number = 20, showLoading: boolean = false) => {
    try {
      if (showLoading) setLoadingComments(true);
      const response = await fetch(`/api/advent/comments?date=${date}&page=${page}&limit=${limit}`);
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments || []);
        setTotalComments(data.total || 0);
      }
    } catch (err) {
      console.error('댓글 조회 오류:', err);
    } finally {
      if (showLoading) setLoadingComments(false);
    }
  }, []);

  const fetchUserComments = useCallback(async (showLoading: boolean = false) => {
    try {
      if (showLoading) setLoadingComments(true);
      const response = await fetch('/api/advent/user-comments');
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments || []);
        setTotalComments(data.comments?.length || 0);
      }
    } catch (err) {
      console.error('사용자 묵상 조회 오류:', err);
      setComments([]);
      setTotalComments(0);
    } finally {
      if (showLoading) setLoadingComments(false);
    }
  }, []);

  const fetchPreviousPosts = useCallback(async (currentPostDt?: string) => {
    try {
      setLoadingPrevious(true);
      // Pages Router에서는 fetch의 next 옵션이 작동하지 않으므로
      // 클라이언트 측 캐시를 사용하여 중복 요청 방지
      const response = await fetch('/api/advent/posts-list?limit=12', {
        cache: 'default', // 브라우저 캐시 사용
      });
      const data = await response.json();

      if (response.ok) {
        // 현재 포스트를 제외한 목록
        const filtered = data.posts?.filter((p: PreviousPost) => 
          p.post_dt !== currentPostDt
        ) || [];
        setPreviousPosts(filtered.slice(0, 12));
      }
    } catch (err) {
      console.error('지난 게시물 조회 오류:', err);
    } finally {
      setLoadingPrevious(false);
    }
  }, []);

  // 한국 시간 기준 현재 날짜 가져오기 (YYYYMMDD)
  const getKoreanDate = (): string => {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return koreanTime.toISOString().slice(0, 10).replace(/-/g, '');
  };

  // URL 쿼리에서 date 가져오기 (없으면 한국 시간 현재 날짜 사용)
  useEffect(() => {
    if (!router.isReady) return;
    
    const dateFromQuery = router.query.date as string;
    
    // date 쿼리가 없으면 한국 시간 현재 날짜를 변수에 직접 세팅
    const dateToUse = dateFromQuery || getKoreanDate();
    
    // 날짜가 변경된 경우에만 fetchPost 호출
    if (selectedDate !== dateToUse) {
      setSelectedDate(dateToUse);
      setMeditationSaved(false); // 날짜 변경 시 묵상 저장 상태 초기화
      fetchPost(dateToUse);
    }
  }, [router.isReady, router.query.date, selectedDate, fetchPost]);

  // 페이지당 아이템 수 (모바일: 5, PC: 8)
  const itemsPerPage = isMobile ? 5 : 8;

  // post가 변경될 때마다 전체 묵상 가져오기
  useEffect(() => {
    if (post?.post_dt && !showMyMeditation) {
      setCommentsPage(1);
      fetchComments(post.post_dt, 1, itemsPerPage);
    }
  }, [post?.post_dt, showMyMeditation, fetchComments, itemsPerPage]);

  // 사용자 묵상 가져오기 (내 묵상 보기 모드일 때)
  useEffect(() => {
    if (showMyMeditation && session?.user) {
      fetchUserComments();
    } else if (showMyMeditation && !session?.user) {
      setComments([]);
    }
  }, [showMyMeditation, session?.user, fetchUserComments]);

  // post가 변경될 때마다 이전 게시물 목록 업데이트
  useEffect(() => {
    if (post?.post_dt && !loading) {
      fetchPreviousPosts(post.post_dt);
    }
  }, [post?.post_dt, loading, fetchPreviousPosts]);


  const handleCommentSubmit = useCallback(async (): Promise<boolean> => {
    if (!session?.user) {
      const currentPath = router.asPath;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return false;
    }

    if (!commentText.trim()) {
      alert('묵상을 입력해주세요.');
      return false;
    }

    if (!post) {
      alert('게시물을 먼저 불러와주세요.');
      return false;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch('/api/advent/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_dt: post.post_dt,
          content: commentText.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCommentText('');
        setMeditationSaved(true);
        // 전체 묵상 새로고침
        setCommentsPage(1);
        fetchComments(post.post_dt, 1, itemsPerPage);
        // 팝업 표시
        setShowMeditationSavedModal(true);
        return true;
      } else {
        alert(data.error || '묵상 작성에 실패했습니다.');
        return false;
      }
    } catch (err) {
      alert('묵상 작성 중 오류가 발생했습니다.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [session?.user, commentText, post, router, fetchComments]);

  const handlePreviousVideoClick = (date: string) => {
    router.push(`/advent?date=${date}`);
  };

  const currentDateStr = router.query.date as string || getKoreanDate();
  const dateForInput = currentDateStr.length === 8
    ? `${currentDateStr.slice(0, 4)}-${currentDateStr.slice(4, 6)}-${currentDateStr.slice(6, 8)}`
    : '';

  // 일차 계산
  const dayNumber = getDayNumber(currentDateStr);
  
  // 1일차 시작 시간 계산 (2025년 11월 30일 00:00:00 한국 시간)
  const getFirstDayTargetDate = (): Date => {
    // 한국 시간 기준 2025년 11월 30일 00:00:00
    // 브라우저의 로컬 시간대를 사용하여 한국 시간으로 생성
    const year = 2025;
    const month = 10; // 0-based (11월 = 10)
    const day = 30;
    const hour = 0;
    const minute = 0;
    const second = 0;
    
    // 로컬 시간대로 Date 객체 생성 (브라우저가 한국 시간대면 자동으로 맞춰짐)
    const koreanDate = new Date(year, month, day, hour, minute, second);
    return koreanDate;
  };

  const firstDayTargetDate = getFirstDayTargetDate();
  const isDayZero = dayNumber === null || dayNumber <= 0;

  return (
    <>
      <Head>
        <title>대림절 | HUB Worship</title>
        <meta name="description" content="대림절 말씀과 나눔" />
      </Head>

      <Header />

      <Container>
        <ContentWrapper>
          {/* IntroSection - 항상 표시, 로딩 중에는 전체 화면, 로딩 완료 후에는 일반 크기 */}
          <IntroSection 
            post={post || undefined} 
            isLoading={showFullScreenIntro}
          />
          
          {/* 스크롤 안내 문구 - 이벤트 안내 섹션 애니메이션 시작 전까지 표시 */}
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
          
          {/* 로딩 완료 후 IntroSection이 원래 위치로 돌아온 다음에만 다른 섹션들 표시 */}
          {!loading && !showFullScreenIntro && (
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ErrorText>{error}</ErrorText>
                </motion.div>
              )}

              {!error && !post && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <EmptyStateCard>
                    <EmptyState>
                      해당 날짜의 게시물이 없습니다.
                    </EmptyState>
                  </EmptyStateCard>
                </motion.div>
              )}

              {post && (
                <>

                  {/* 2. 이벤트 안내 섹션 */}
                  <SectionWrapper
                    initial={isMobile ? false : { opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: isMobile ? "-50px" : "-100px", amount: isMobile ? 0 : 0.3 }}
                    transition={{ duration: isMobile ? 0.2 : 0.6, delay: isMobile ? 0 : 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <EventInfoSection 
                      onCandleVisible={() => {
                        // 캔들 아이콘이 보이기 시작하면 안내 문구 색상을 배경색과 동일하게 변경
                        setHideScrollHint(true);
                      }}
                    />
                  </SectionWrapper>

                  {/* 3. 영상 섹션 */}
                  <SectionWrapper
                    initial={isMobile ? false : { opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: isMobile ? "-50px" : "-100px", amount: isMobile ? 0 : 0.3 }}
                    transition={{ duration: isMobile ? 0.2 : 0.6, delay: isMobile ? 0 : 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <VideoSection post={post} currentDate={currentDateStr} />
                  </SectionWrapper>

                  {/* 0일차일 때 카운트다운 표시 */}
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

                  {/* 1일차 이상일 때만 출석 및 묵상 섹션 표시 */}
                  {!isDayZero && (
                    <>
                      {/* 4. 출석 섹션 */}
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

                      {/* 5. 묵상 섹션 (댓글) */}
                      <SectionWrapper
                        initial={isMobile ? false : { opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: isMobile ? "-50px" : "-100px", amount: isMobile ? 0 : 0.3 }}
                        transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      >
                        <MeditationSection
                          comments={comments}
                          totalComments={totalComments}
                          currentPage={commentsPage}
                          isLoggedIn={!!session?.user}
                          showMyMeditation={showMyMeditation}
                          loading={loadingComments}
                          onToggleMyMeditation={async () => {
                            const newShowMyMeditation = !showMyMeditation;
                            setShowMyMeditation(newShowMyMeditation);
                            setCommentsPage(1);
                            setLoadingComments(true);
                            setComments([]); // 초기화
                            
                            // 새로운 데이터 가져오기
                            try {
                              if (newShowMyMeditation) {
                                await fetchUserComments(true);
                              } else if (post?.post_dt) {
                                await fetchComments(post.post_dt, 1, itemsPerPage, true);
                              }
                            } catch (err) {
                              console.error('묵상 조회 오류:', err);
                              setLoadingComments(false);
                            }
                          }}
                          onPageChange={(page: number) => {
                            if (post?.post_dt && !showMyMeditation) {
                              setCommentsPage(page);
                              fetchComments(post.post_dt, page, itemsPerPage, true);
                            }
                          }}
                        />
                      </SectionWrapper>
                    </>
                  )}

                  {/* 5. 지난 묵상 영상 섹션 */}
                  <SectionWrapper
                    initial={isMobile ? false : { opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: isMobile ? "-50px" : "0px", amount: isMobile ? 0 : 0.3 }}
                    transition={{ duration: isMobile ? 0.2 : 0.6, delay: isMobile ? 0 : 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <PreviousVideosSection
                      previousPosts={previousPosts}
                      loading={loadingPrevious}
                      onVideoClick={handlePreviousVideoClick}
                    />
                  </SectionWrapper>
                </>
              )}
            </>
          )}
        </ContentWrapper>
      </Container>

      {!loading && <Footer />}

      {/* 묵상 저장 완료 모달 */}
      {showMeditationSavedModal && (
        <ModalOverlay onClick={() => setShowMeditationSavedModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>묵상저장이 완료되었습니다.</ModalTitle>
            <ModalMessage>
              {'출석하기'} 버튼을 꼭 눌러주셔야{'\n'}출석이 인정됩니다.
            </ModalMessage>
            <ModalButton onClick={() => setShowMeditationSavedModal(false)}>
              확인
            </ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default AdventPage;


