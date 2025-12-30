// 파일 경로: src/views/BibleCardPage/DownloadPage.tsx
// 말씀카드 다운로드 페이지 - 2026년 1월 1일 오픈 카운트다운

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Header } from '@src/components/Header';
import Footer from '@src/components/Footer';

interface ApplicationData {
  id: number;
  name: string;
  community: string;
  group_name: string;
  cell_name: string;
  prayer_request: string;
  status: string;
  pastor_name: string;
  bible_verse: string;
  bible_verse_reference: string;
  pastor_message: string;
  drive_link_1: string;
  drive_link_2: string;
  created_at: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// 2026년 1월 1일 0시 0분 0초 (한국 시간)
const OPEN_DATE = new Date('2026-01-01T00:00:00+09:00');

export default function BibleCardDownloadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  // 테스트 모드: 쿼리 스트링에 value=test 또는 value=admin이 있으면 시간 제한 없이 오픈
  const isTestMode = router.query.value === 'test' || router.query.value === 'admin';
  const [isOpen, setIsOpen] = useState(isTestMode);
  const [downloading, setDownloading] = useState<{ [key: number]: boolean }>({ 1: false, 2: false });
  const [activeTab, setActiveTab] = useState<'card' | 'card1' | 'card2' | 'verse' | 'prayer'>('card');
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>({ 1: true, 2: true });
  const [imageBlobUrl, setImageBlobUrl] = useState<{ [key: number]: string | null }>({ 1: null, 2: null });

  // 내 신청 정보 조회
  const { data: myApplication, isLoading } = useQuery({
    queryKey: ['my-bible-card-download'],
    queryFn: async () => {
      const response = await fetch('/api/bible-card/my-application');
      if (!response.ok) throw new Error('조회 실패');
      return response.json();
    },
    enabled: status === 'authenticated',
  });

  // 카운트다운 계산 (테스트 모드가 아닐 때만)
  useEffect(() => {
    // 테스트 모드면 카운트다운 스킵
    if (isTestMode) {
      setIsOpen(true);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = OPEN_DATE.getTime() - now.getTime();

      if (difference <= 0) {
        setIsOpen(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // 초기 계산
    setTimeLeft(calculateTimeLeft());

    // 1초마다 업데이트
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [isTestMode]);

  // 로그인 체크
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?redirect=${encodeURIComponent('/bible-card/download')}`);
    }
  }, [status, router]);

  // 다운로드 페이지 접속 카운팅
  useEffect(() => {
    if (status === 'authenticated' && myApplication?.hasApplication && isOpen) {
      // 페이지 접속 시 카운팅
      fetch('/api/bible-card/track-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch((error) => {
        console.error('접속 카운팅 오류:', error);
        // 카운팅 실패해도 페이지는 정상 동작
      });
    }
  }, [status, myApplication?.hasApplication, isOpen]);

  // drive_link가 2개 있으면 초기 탭을 card1로 설정 (early return 전에 hooks 호출 필요)
  useEffect(() => {
    if (!myApplication?.hasApplication) return;
    
    const app = myApplication.application;
    const hasTwoLinks = !!(app.drive_link_1 && app.drive_link_2);
    
    if (hasTwoLinks && activeTab === 'card') {
      setActiveTab('card1');
    } else if (!hasTwoLinks && (activeTab === 'card1' || activeTab === 'card2')) {
      setActiveTab('card');
    }
  }, [myApplication?.hasApplication, myApplication?.application?.drive_link_1, myApplication?.application?.drive_link_2, activeTab]);

  // 이미지를 프록시 API를 통해 가져와서 Blob URL로 변환
  useEffect(() => {
    if (!myApplication?.hasApplication) {
      setImageBlobUrl({ 1: null, 2: null });
      setImageLoading({ 1: false, 2: false });
      return;
    }

    const app = myApplication.application;
    const loadImageForLink = async (linkUrl: string | null, index: number) => {
      if (!linkUrl) {
        setImageLoading(prev => ({ ...prev, [index]: false }));
        setImageBlobUrl(prev => ({ ...prev, [index]: null }));
        return;
      }

      setImageLoading(prev => ({ ...prev, [index]: true }));
      try {
        const proxyUrl = `/api/bible-card/download-proxy?url=${encodeURIComponent(linkUrl)}&view=true`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          throw new Error(`이미지 로드 실패: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        setImageBlobUrl(prev => {
          // 이전 Blob URL이 있으면 해제
          if (prev[index]) {
            window.URL.revokeObjectURL(prev[index]!);
          }
          return { ...prev, [index]: blobUrl };
        });
        setImageLoading(prev => ({ ...prev, [index]: false }));
      } catch (error) {
        console.error(`이미지 로드 오류 (링크 ${index}):`, error);
        setImageLoading(prev => ({ ...prev, [index]: false }));
        setImageBlobUrl(prev => ({ ...prev, [index]: null }));
      }
    };

    // 두 링크 모두 로드
    loadImageForLink(app.drive_link_1, 1);
    if (app.drive_link_2) {
      loadImageForLink(app.drive_link_2, 2);
    } else {
      setImageLoading(prev => ({ ...prev, 2: false }));
      setImageBlobUrl(prev => ({ ...prev, 2: null }));
    }

    // 클린업
    return () => {
      setImageBlobUrl((prev) => {
        Object.values(prev).forEach(url => {
          if (url) {
            window.URL.revokeObjectURL(url);
          }
        });
        return { 1: null, 2: null };
      });
    };
  }, [myApplication?.application?.drive_link_1, myApplication?.application?.drive_link_2]);

  // 다운로드 핸들러
  const handleDownload = async (linkUrl: string, index: number) => {
    if (!linkUrl) return;
    if (downloading[index]) return;

    try {
      setDownloading(prev => ({ ...prev, [index]: true }));

      // 파일명 생성 (예: HUB_말씀카드_1.jpg)
      const appName = myApplication?.application?.name || 'HUB';
      const filename = `${appName}_말씀카드_${index}.jpg`;

      // 프록시 API 호출
      const proxyUrl = `/api/bible-card/download-proxy?url=${encodeURIComponent(linkUrl)}&filename=${encodeURIComponent(filename)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error('다운로드에 실패했습니다.');
      }

      // Blob URL 생성
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // 다운로드 링크 생성
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Blob URL 해제
      window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
      console.error('다운로드 오류:', error);
      alert('다운로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setDownloading(prev => ({ ...prev, [index]: false }));
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <>
        <Head>
          <title>말씀카드 다운로드 | HUB Worship</title>
        </Head>
        <Header />
        <Container>
          <ContentWrapper>
            <LoadingContainer>
              <Spinner />
              <LoadingText>로딩 중...</LoadingText>
            </LoadingContainer>
          </ContentWrapper>
        </Container>
        <Footer />
      </>
    );
  }

  // 신청 내역이 없는 경우
  if (!myApplication?.hasApplication) {
    return (
      <>
        <Head>
          <title>말씀카드 다운로드 | HUB Worship</title>
        </Head>
        <Header />
        <Container>
          <ContentWrapper>
            <Card>
              <EmptyIcon>📭</EmptyIcon>
              <EmptyTitle>신청 내역이 없습니다</EmptyTitle>
              <EmptyDescription>
                말씀카드를 먼저 신청해주세요.
              </EmptyDescription>
              <BackButton onClick={() => router.push('/bible-card')}>
                말씀카드 신청하기
              </BackButton>
            </Card>
          </ContentWrapper>
        </Container>
        <Footer />
      </>
    );
  }

  const app: ApplicationData = myApplication.application;
  const hasTwoLinks = !!(app.drive_link_1 && app.drive_link_2);

  // 현재 활성화된 카드 링크 인덱스 결정
  const getCurrentCardIndex = () => {
    if (activeTab === 'card1') return 1;
    if (activeTab === 'card2') return 2;
    return 1; // 기본값
  };

  const currentCardIndex = getCurrentCardIndex();
  const currentDriveLink = currentCardIndex === 1 ? app.drive_link_1 : app.drive_link_2;

  // 오픈 전 - 카운트다운 표시
  if (!isOpen) {
    return (
      <>
        <Head>
          <title>말씀카드 오픈 카운트다운 | HUB Worship</title>
          <meta name="description" content="말씀카드 오픈까지 남은 시간" />
        </Head>
        <Header />
        <Container>
          <ContentWrapper>
            <Card>
              <CardHeader>
                <Title>📜 말씀카드</Title>
                <Subtitle>{app.name}님을 위한 말씀카드가 준비되고 있습니다</Subtitle>
              </CardHeader>

              <CountdownSection>
                <CountdownLabel>오픈까지 남은 시간</CountdownLabel>
                <CountdownGrid>
                  <CountdownItem>
                    <CountdownNumber>{String(timeLeft.days).padStart(2, '0')}</CountdownNumber>
                    <CountdownUnit>일</CountdownUnit>
                  </CountdownItem>
                  <CountdownSeparator>:</CountdownSeparator>
                  <CountdownItem>
                    <CountdownNumber>{String(timeLeft.hours).padStart(2, '0')}</CountdownNumber>
                    <CountdownUnit>시간</CountdownUnit>
                  </CountdownItem>
                  <CountdownSeparator>:</CountdownSeparator>
                  <CountdownItem>
                    <CountdownNumber>{String(timeLeft.minutes).padStart(2, '0')}</CountdownNumber>
                    <CountdownUnit>분</CountdownUnit>
                  </CountdownItem>
                  <CountdownSeparator>:</CountdownSeparator>
                  <CountdownItem>
                    <CountdownNumber>{String(timeLeft.seconds).padStart(2, '0')}</CountdownNumber>
                    <CountdownUnit>초</CountdownUnit>
                  </CountdownItem>
                </CountdownGrid>
                <OpenDate>2026년 1월 1일 00:00 오픈</OpenDate>
              </CountdownSection>

              <InfoMessage>
                🎉 새해 첫 날, 특별한 말씀카드가 공개됩니다!
              </InfoMessage>

              <BackLink onClick={() => router.push('/bible-card')}>
                ← 신청 내역으로 돌아가기
              </BackLink>
            </Card>
          </ContentWrapper>
        </Container>
        <Footer />
      </>
    );
  }


  // 오픈 후 - 다운로드 가능
  return (
    <>
      <Head>
        <title>말씀카드 다운로드 | HUB Worship</title>
        <meta name="description" content="말씀카드 다운로드" />
      </Head>
      <Header />
      <Container>
        <ContentWrapper>
          <Card>
            <CardHeader>
              <Title>📥 말씀카드 다운로드</Title>
              <Subtitle>{app.name}님을 위한 말씀카드</Subtitle>
            </CardHeader>

            {/* 탭 메뉴 */}
            <TabContainer>
              {hasTwoLinks ? (
                <>
                  <TabButton 
                    active={activeTab === 'card1'} 
                    onClick={() => setActiveTab('card1')}
                  >
                    말씀카드 1
                  </TabButton>
                  <TabButton 
                    active={activeTab === 'card2'} 
                    onClick={() => setActiveTab('card2')}
                  >
                    말씀카드 2
                  </TabButton>
                </>
              ) : (
                <TabButton 
                  active={activeTab === 'card'} 
                  onClick={() => setActiveTab('card')}
                >
                  말씀카드
                </TabButton>
              )}
              <TabButton 
                active={activeTab === 'verse'} 
                onClick={() => setActiveTab('verse')}
              >
                내 말씀
              </TabButton>
              <TabButton 
                active={activeTab === 'prayer'} 
                onClick={() => setActiveTab('prayer')}
              >
                내 기도제목
              </TabButton>
            </TabContainer>

            {/* 탭 컨텐츠 */}
            {(activeTab === 'card' || activeTab === 'card1' || activeTab === 'card2') && (
              <>
                {/* 말씀카드 이미지 */}
                {currentDriveLink && (
                  <CardImageContainer>
                    {imageLoading[currentCardIndex] && (
                      <ImageSkeleton>
                        <SkeletonSpinner />
                        <SkeletonText>말씀카드를 불러오는 중...</SkeletonText>
                      </ImageSkeleton>
                    )}
                    {imageBlobUrl[currentCardIndex] && !imageLoading[currentCardIndex] && (
                      <CardImage 
                        src={imageBlobUrl[currentCardIndex]!} 
                        alt={`${app.name}님의 말씀카드 ${hasTwoLinks ? currentCardIndex : ''}`}
                        onError={() => {
                          setImageLoading(prev => ({ ...prev, [currentCardIndex]: false }));
                          setImageBlobUrl(prev => ({ ...prev, [currentCardIndex]: null }));
                        }}
                      />
                    )}
                    {!imageBlobUrl[currentCardIndex] && !imageLoading[currentCardIndex] && (
                      <ImageError>
                        <ErrorIcon>⚠️</ErrorIcon>
                        <ErrorText>이미지를 불러올 수 없습니다.</ErrorText>
                      </ImageError>
                    )}
                  </CardImageContainer>
                )}

                {/* 다운로드 버튼 */}
                <DownloadSection>
                  {currentDriveLink ? (
                    <DownloadButton 
                      onClick={() => handleDownload(currentDriveLink, currentCardIndex)}
                      disabled={downloading[currentCardIndex]}
                    >
                      {downloading[currentCardIndex] ? '다운로드 중...' : `📥 말씀카드${hasTwoLinks ? ` ${currentCardIndex}` : ''} 다운로드`}
                    </DownloadButton>
                  ) : (
                    <NoLinkMessage>
                      아직 다운로드 링크가 준비되지 않았습니다.<br />
                      잠시 후 다시 확인해주세요.
                    </NoLinkMessage>
                  )}
                </DownloadSection>
              </>
            )}

            {activeTab === 'verse' && (
              <>
                {/* 말씀 정보 */}
                {app.bible_verse ? (
                  <BibleSection>
                    <BibleLabel>📖 나에게 주신 말씀</BibleLabel>
                    <BibleReference>{app.bible_verse_reference}</BibleReference>
                    <BibleContent>{app.bible_verse}</BibleContent>
                    {app.pastor_message && (
                      <>
                        <PastorMessageLabel>💬 비고</PastorMessageLabel>
                        <PastorMessageContent>{app.pastor_message}</PastorMessageContent>
                      </>
                    )}
                  </BibleSection>
                ) : (
                  <EmptyTabMessage>
                    아직 말씀이 작성되지 않았습니다.
                  </EmptyTabMessage>
                )}
              </>
            )}

            {activeTab === 'prayer' && (
              <>
                {/* 기도제목 */}
                {app.prayer_request ? (
                  <PrayerSection>
                    <PrayerLabel>🙏 나의 기도제목</PrayerLabel>
                    <PrayerContent>{app.prayer_request}</PrayerContent>
                  </PrayerSection>
                ) : (
                  <EmptyTabMessage>
                    기도제목이 없습니다.
                  </EmptyTabMessage>
                )}
              </>
            )}

            <BackLink onClick={() => router.push('/bible-card')}>
              ← 신청 내역으로 돌아가기
            </BackLink>
          </Card>
        </ContentWrapper>
      </Container>
      <Footer />
    </>
  );
}

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-top: 80px;
  padding-bottom: 60px;
  box-sizing: border-box;

  @media (max-width: 480px) {
    padding-top: 60px;
    padding-bottom: 40px;
  }
`;

const ContentWrapper = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: 24px 16px;
  box-sizing: border-box;

  @media (max-width: 480px) {
    padding: 16px 12px;
    max-width: 100%;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 20px;

  @media (max-width: 480px) {
    min-height: 300px;
    border-radius: 16px;
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.p`
  margin-top: 16px;
  color: #64748b;
  font-size: 14px;
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 32px;
  animation: ${fadeIn} 0.5s ease;

  @media (max-width: 480px) {
    padding: 24px 18px;
    border-radius: 16px;
  }
`;

const CardHeader = styled.div`
  text-align: center;
  margin-bottom: 28px;

  @media (max-width: 480px) {
    margin-bottom: 24px;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
`;

const EmptyIcon = styled.div`
  text-align: center;
  font-size: 64px;
  margin-bottom: 20px;
`;

const EmptyTitle = styled.h2`
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
`;

const EmptyDescription = styled.p`
  text-align: center;
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px 0;
  line-height: 1.6;
`;

const BackButton = styled.button`
  display: block;
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }
`;

// 카운트다운 스타일
const CountdownSection = styled.div`
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-radius: 16px;
  padding: 32px 24px;
  margin-bottom: 24px;
  text-align: center;

  @media (max-width: 480px) {
    padding: 24px 16px;
    border-radius: 12px;
  }
`;

const CountdownLabel = styled.div`
  font-size: 14px;
  color: #0369a1;
  font-weight: 600;
  margin-bottom: 20px;
`;

const CountdownGrid = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    gap: 4px;
  }
`;

const CountdownItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CountdownNumber = styled.div`
  font-size: 48px;
  font-weight: 800;
  color: #0c4a6e;
  line-height: 1;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace;
  animation: ${pulse} 2s ease-in-out infinite;

  @media (max-width: 480px) {
    font-size: 36px;
  }
`;

const CountdownUnit = styled.div`
  font-size: 12px;
  color: #0369a1;
  font-weight: 600;
  margin-top: 4px;

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const CountdownSeparator = styled.div`
  font-size: 36px;
  font-weight: 700;
  color: #0c4a6e;
  padding-bottom: 20px;

  @media (max-width: 480px) {
    font-size: 28px;
    padding-bottom: 16px;
  }
`;

const OpenDate = styled.div`
  font-size: 16px;
  color: #0369a1;
  font-weight: 700;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const InfoMessage = styled.div`
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 12px;
  color: #92400e;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 24px;

  @media (max-width: 480px) {
    padding: 14px;
    font-size: 13px;
    border-radius: 10px;
  }
`;

// 탭 스타일
const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0;

  @media (max-width: 480px) {
    gap: 4px;
    margin-bottom: 20px;
  }
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 12px 16px;
  background: ${props => props.active ? '#f8fafc' : 'transparent'};
  border: none;
  border-bottom: 3px solid ${props => props.active ? '#6366f1' : 'transparent'};
  color: ${props => props.active ? '#6366f1' : '#64748b'};
  font-size: 15px;
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -2px;

  &:hover {
    color: #6366f1;
    background: #f8fafc;
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
    font-size: 14px;
  }
`;

// 말씀카드 이미지 스타일
const CardImageContainer = styled.div`
  width: 100%;
  margin-bottom: 24px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 400px;
  background: #f8fafc;

  @media (max-width: 480px) {
    border-radius: 12px;
    margin-bottom: 20px;
    min-height: 300px;
  }
`;

const ImageSkeleton = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const SkeletonSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(99, 102, 241, 0.2);
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 16px;
`;

const SkeletonText = styled.div`
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
`;

const CardImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  border-radius: 16px;

  @media (max-width: 480px) {
    border-radius: 12px;
  }
`;

const ImageError = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: #64748b;
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
`;

const ErrorText = styled.div`
  font-size: 14px;
  font-weight: 500;
`;

const EmptyTabMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 15px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 20px;
`;

// 다운로드 화면 스타일
const BibleSection = styled.div`
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    padding: 18px;
    border-radius: 12px;
  }
`;

const BibleLabel = styled.div`
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 12px;
  font-size: 15px;
`;

const BibleReference = styled.div`
  font-size: 14px;
  color: #3b82f6;
  margin-bottom: 16px;
  font-weight: 600;
`;

const BibleContent = styled.div`
  color: #1e3a8a;
  line-height: 1.8;
  font-size: 15px;
  white-space: pre-wrap;
`;

const PastorMessageLabel = styled.div`
  font-weight: 600;
  color: #1e40af;
  margin-top: 20px;
  margin-bottom: 8px;
  font-size: 14px;
  padding-top: 16px;
  border-top: 1px solid rgba(30, 64, 175, 0.2);
`;

const PastorMessageContent = styled.div`
  color: #1e3a8a;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
`;

const PastorInfo = styled.div`
  text-align: center;
  font-size: 14px;
  color: #64748b;
  margin-bottom: 24px;

  strong {
    color: #1e293b;
  }
`;

const DownloadSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;

const DownloadButton = styled.button<{ secondary?: boolean }>`
  display: block;
  width: 100%;
  padding: 16px;
  background: #FF474A;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:hover:not(:disabled) {
    background: rgb(216, 61, 63);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 71, 74, 0.3);
  }

  &:disabled {
    background: #9ca3af;
    color: white;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 480px) {
    padding: 14px;
    font-size: 15px;
  }
`;

const NoLinkMessage = styled.div`
  text-align: center;
  padding: 24px;
  background: #fef3c7;
  border-radius: 12px;
  color: #92400e;
  font-size: 14px;
  line-height: 1.6;
`;

const PrayerSection = styled.div`
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    padding: 18px;
    border-radius: 12px;
  }
`;

const PrayerLabel = styled.div`
  font-weight: 600;
  color: #92400e;
  margin-bottom: 12px;
  font-size: 15px;
`;

const PrayerContent = styled.div`
  color: #78350f;
  line-height: 1.8;
  font-size: 15px;
  white-space: pre-wrap;
`;

const BackLink = styled.button`
  display: block;
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  text-align: center;

  &:hover {
    color: #6366f1;
  }
`;
