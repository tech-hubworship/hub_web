import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styled from '@emotion/styled';
import { useSession } from 'next-auth/react';
import { Header } from '@src/components/Header';
import Footer from '@src/components/Footer';
import { 
  IntroSection, 
  EventInfoSection,
  VideoSection, 
  AttendanceSection, 
  MeditationSection, 
  PreviousVideosSection 
} from '@src/components/advent';
import { AdventPost, AdventComment, PreviousPost } from '@src/lib/advent/types';

// ==================== Container & Wrapper ====================
const Container = styled.div`
  min-height: 100vh;
  background: transparent;
  padding: 80px 0 0;

  @media (max-width: 768px) {
    padding: 60px 0 0;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 0;

  @media (max-width: 768px) {
    padding: 0 16px 0;
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
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [meditationSaved, setMeditationSaved] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchPost = useCallback(async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/advent/posts?date=${date}`);
      const data = await response.json();

      if (response.ok) {
        setPost(data.post || null);
      } else {
        setError(data.error || '게시물을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('게시물을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComments = useCallback(async (date: string, page: number = 1, showLoading: boolean = false) => {
    try {
      if (showLoading) setLoadingComments(true);
      const response = await fetch(`/api/advent/comments?date=${date}&page=${page}&limit=10`);
      const data = await response.json();

      if (response.ok) {
        if (page === 1) {
          setComments(data.comments || []);
        } else {
          setComments(prev => [...prev, ...(data.comments || [])]);
        }
        setHasMoreComments(data.hasMore || false);
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
      }
    } catch (err) {
      console.error('사용자 묵상 조회 오류:', err);
    } finally {
      if (showLoading) setLoadingComments(false);
    }
  }, []);

  const fetchPreviousPosts = useCallback(async (currentPostDt?: string) => {
    try {
      setLoadingPrevious(true);
      const response = await fetch('/api/advent/posts-list?limit=12');
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
    
    setSelectedDate(dateToUse);
    setMeditationSaved(false); // 날짜 변경 시 묵상 저장 상태 초기화
    fetchPost(dateToUse);
  }, [router.isReady, router.query.date, fetchPost]);

  // post가 변경될 때마다 전체 묵상 가져오기
  useEffect(() => {
    if (post?.post_dt && !showMyMeditation) {
      setCommentsPage(1);
      fetchComments(post.post_dt, 1);
    }
  }, [post?.post_dt, showMyMeditation, fetchComments]);

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
        fetchComments(post.post_dt, 1);
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

  return (
    <>
      <Head>
        <title>대림절 | HUB Worship</title>
        <meta name="description" content="대림절 말씀과 나눔" />
      </Head>

      <Header />

      <Container>
        <ContentWrapper>
          {loading && <LoadingText>로딩 중...</LoadingText>}
          {error && <ErrorText>{error}</ErrorText>}

          {!loading && !error && !post && (
            <EmptyStateCard>
              <EmptyState>
                해당 날짜의 게시물이 없습니다.
              </EmptyState>
            </EmptyStateCard>
          )}

          {post && (
            <>
              {/* 1. 인트로 섹션 */}
              <IntroSection post={post} />

              {/* 2. 이벤트 안내 섹션 */}
              <EventInfoSection />

              {/* 3. 영상 섹션 */}
              <VideoSection post={post} currentDate={currentDateStr} />

              {/* 4. 출석 섹션 */}
              <AttendanceSection 
                currentDate={currentDateStr}
                isLoggedIn={!!session?.user}
                commentText={commentText}
                submitting={submitting}
                meditationSaved={meditationSaved}
                onCommentTextChange={setCommentText}
                onCommentSubmit={handleCommentSubmit}
                onMeditationSavedChange={setMeditationSaved}
              />

              {/* 5. 묵상 섹션 (댓글) */}
              <MeditationSection
                comments={comments}
                isLoggedIn={!!session?.user}
                showMyMeditation={showMyMeditation}
                hasMore={hasMoreComments}
                loading={loadingComments}
                onToggleMyMeditation={() => {
                  const newShowMyMeditation = !showMyMeditation;
                  setShowMyMeditation(newShowMyMeditation);
                  setCommentsPage(1);
                  setComments([]); // 초기화
                  
                  // 새로운 데이터 가져오기
                  if (newShowMyMeditation) {
                    fetchUserComments(true);
                  } else if (post?.post_dt) {
                    fetchComments(post.post_dt, 1, true);
                  }
                }}
                onLoadMore={() => {
                  if (post?.post_dt && !showMyMeditation) {
                    const nextPage = commentsPage + 1;
                    setCommentsPage(nextPage);
                    fetchComments(post.post_dt, nextPage);
                  }
                }}
              />

              {/* 5. 지난 묵상 영상 섹션 */}
              <PreviousVideosSection
                previousPosts={previousPosts}
                loading={loadingPrevious}
                onVideoClick={handlePreviousVideoClick}
              />
            </>
          )}
        </ContentWrapper>
      </Container>

      <Footer />
    </>
  );
};

export default AdventPage;
