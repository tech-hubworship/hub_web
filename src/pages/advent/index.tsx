import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styled from '@emotion/styled';
import { useSession } from 'next-auth/react';
import { MessageSquare, Send, Calendar } from 'lucide-react';
import { Header } from '@src/components/Header';
import Footer from '@src/components/Footer';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 20px 40px;
`;

const ContentWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const DateSelector = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const DateInput = styled.input`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  flex: 1;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const DateButton = styled.button`
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #5568d3;
    transform: translateY(-2px);
  }
`;

const PostCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const PostTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
`;

const PostContent = styled.div`
  font-size: 18px;
  line-height: 1.8;
  color: #374151;
  margin-bottom: 24px;
  white-space: pre-wrap;
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  margin-bottom: 24px;
  border-radius: 12px;
  overflow: hidden;
  background: #000;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const ThumbnailImage = styled.img`
  width: 100%;
  border-radius: 12px;
  margin-bottom: 24px;
`;

const CommentsSection = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const CommentsTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CommentForm = styled.form`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const CommentInput = styled.textarea`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SubmitButton = styled.button`
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  align-self: flex-start;

  &:hover {
    background: #5568d3;
    transform: translateY(-2px);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CommentItem = styled.div`
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  border-left: 4px solid #667eea;
`;

const CommentContent = styled.div`
  font-size: 16px;
  color: #374151;
  margin-bottom: 8px;
  line-height: 1.6;
`;

const CommentMeta = styled.div`
  font-size: 14px;
  color: #9ca3af;
  display: flex;
  gap: 12px;
`;

const LoadingText = styled.div`
  text-align: center;
  color: white;
  font-size: 18px;
  padding: 40px;
`;

const ErrorText = styled.div`
  text-align: center;
  color: #fee;
  background: rgba(239, 68, 68, 0.9);
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
`;

const EmptyState = styled.div`
  text-align: center;
  color: white;
  padding: 60px 20px;
  font-size: 18px;
`;

interface AdventPost {
  post_dt: string;
  title: string;
  content: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  reg_id: string;
  reg_dt: string;
  mod_id: string;
  mod_dt: string;
}

interface AdventComment {
  comment_id: number;
  post_dt: string;
  content: string;
  reg_id: string;
  reg_dt: string;
  mod_id: string;
  mod_dt: string;
}

const getYouTubeEmbedUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  // YouTube URL 변환
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  return null;
};

const AdventPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<AdventPost | null>(null);
  const [comments, setComments] = useState<AdventComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // URL 쿼리에서 date 가져오기
  useEffect(() => {
    if (router.isReady) {
      const date = router.query.date as string || 
        new Date().toISOString().slice(0, 10).replace(/-/g, '');
      setSelectedDate(date);
      fetchPost(date);
      fetchComments(date);
    }
  }, [router.isReady, router.query.date]);

  const fetchPost = async (date: string) => {
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
  };

  const fetchComments = async (date: string) => {
    try {
      const response = await fetch(`/api/advent/comments?date=${date}`);
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('댓글 조회 오류:', err);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const dateStr = value.replace(/-/g, '');
      setSelectedDate(dateStr);
    }
  };

  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate && selectedDate.length === 8) {
      router.push(`/advent?date=${selectedDate}`);
    } else {
      alert('올바른 날짜를 선택해주세요.');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!commentText.trim()) {
      alert('댓글을 입력해주세요.');
      return;
    }

    if (!post) {
      alert('게시물을 먼저 불러와주세요.');
      return;
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
        fetchComments(post.post_dt);
      } else {
        alert(data.error || '댓글 작성에 실패했습니다.');
      }
    } catch (err) {
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentDateStr = router.query.date as string || 
    new Date().toISOString().slice(0, 10).replace(/-/g, '');
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
          <DateSelector>
            <Calendar size={24} color="#667eea" />
            <DateInput
              type="date"
              value={dateForInput}
              onChange={handleDateChange}
              max={new Date().toISOString().slice(0, 10)}
            />
            <DateButton onClick={handleDateSubmit}>
              날짜 선택
            </DateButton>
          </DateSelector>

          {loading && <LoadingText>로딩 중...</LoadingText>}
          {error && <ErrorText>{error}</ErrorText>}

          {!loading && !error && !post && (
            <EmptyState>
              해당 날짜의 게시물이 없습니다.
            </EmptyState>
          )}

          {post && (
            <>
              <PostCard>
                <PostTitle>{post.title}</PostTitle>
                
                {post.thumbnail_url && (
                  <ThumbnailImage 
                    src={post.thumbnail_url} 
                    alt={post.title}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}

                {post.video_url && getYouTubeEmbedUrl(post.video_url) && (
                  <VideoContainer>
                    <iframe
                      src={getYouTubeEmbedUrl(post.video_url) || ''}
                      title={post.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </VideoContainer>
                )}

                {post.content && (
                  <PostContent>{post.content}</PostContent>
                )}
              </PostCard>

              <CommentsSection>
                <CommentsTitle>
                  <MessageSquare size={24} />
                  댓글 ({comments.length})
                </CommentsTitle>

                {session?.user && (
                  <CommentForm onSubmit={handleCommentSubmit}>
                    <CommentInput
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="댓글을 입력하세요..."
                      maxLength={1000}
                    />
                    <SubmitButton type="submit" disabled={submitting}>
                      <Send size={18} />
                      {submitting ? '작성 중...' : '댓글 작성'}
                    </SubmitButton>
                  </CommentForm>
                )}

                {!session?.user && (
                  <CommentForm>
                    <CommentInput
                      placeholder="로그인이 필요합니다."
                      disabled
                    />
                    <SubmitButton disabled>
                      <Send size={18} />
                      로그인 필요
                    </SubmitButton>
                  </CommentForm>
                )}

                <CommentList>
                  {comments.length === 0 ? (
                    <EmptyState style={{ padding: '40px', color: '#9ca3af' }}>
                      첫 번째 댓글을 작성해보세요!
                    </EmptyState>
                  ) : (
                    comments.map((comment) => (
                      <CommentItem key={comment.comment_id}>
                        <CommentContent>{comment.content}</CommentContent>
                        <CommentMeta>
                          <span>{comment.reg_id}</span>
                          <span>{new Date(comment.reg_dt).toLocaleString('ko-KR')}</span>
                        </CommentMeta>
                      </CommentItem>
                    ))
                  )}
                </CommentList>
              </CommentsSection>
            </>
          )}
        </ContentWrapper>
      </Container>

      <Footer />
    </>
  );
};

export default AdventPage;

