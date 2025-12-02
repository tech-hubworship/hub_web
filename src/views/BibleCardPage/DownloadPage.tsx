// 파일 경로: src/views/BibleCardPage/DownloadPage.tsx
// 말씀카드 다운로드 페이지 - 2026년 1월 1일 오픈 카운트다운

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { keyframes, css } from '@emotion/react';
import { Header } from '@src/components/Header';
import Footer from '@src/components/Footer';

// ... (imports)

// ... (interfaces)

// ... (keyframes)

// 2026년 1월 1일 0시 0분 0초 (한국 시간)
const OPEN_DATE = new Date('2026-01-01T00:00:00+09:00');

export default function BibleCardDownloadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState<{ [key: number]: boolean }>({ 1: false, 2: false });

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

  // 카운트다운 계산
  useEffect(() => {
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
  }, []);

  // 로그인 체크
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?redirect=${encodeURIComponent('/bible-card/download')}`);
    }
  }, [status, router]);

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
      const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(linkUrl)}&filename=${encodeURIComponent(filename)}`;
      
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

  // 오픈 전 - 카운트다운 표시
  if (false) { // !isOpen
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

            {/* 말씀 정보 */}
            {app.bible_verse && (
              <BibleSection>
                <BibleLabel>📖 나에게 주신 말씀</BibleLabel>
                <BibleReference>{app.bible_verse_reference}</BibleReference>
                <BibleContent>{app.bible_verse}</BibleContent>
              </BibleSection>
            )}

            {/* 다운로드 버튼 */}
            <DownloadSection>
              {app.drive_link_1 ? (
                <>
                  <button
                    css={downloadButtonStyle(false)}
                    onClick={() => handleDownload(app.drive_link_1, 1)}
                    disabled={downloading[1]}
                  >
                    {downloading[1] ? '다운로드 중...' : '📥 말씀카드 다운로드 (1)'}
                  </button>
                  {app.drive_link_2 && (
                    <button
                      css={downloadButtonStyle(true)}
                      onClick={() => handleDownload(app.drive_link_2, 2)}
                      disabled={downloading[2]}
                    >
                      {downloading[2] ? '다운로드 중...' : '📥 말씀카드 다운로드 (2)'}
                    </button>
                  )}
                </>
              ) : (
                <NoLinkMessage>
                  아직 다운로드 링크가 준비되지 않았습니다.<br />
                  잠시 후 다시 확인해주세요.
                </NoLinkMessage>
              )}
            </DownloadSection>

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

// ... (keep other styled components)

const downloadButtonStyle = (secondary?: boolean) => css`
  display: block;
  width: 100%;
  padding: 16px;
  background: ${secondary 
    ? 'white' 
    : 'linear-gradient(135deg, #10b981, #059669)'};
  color: ${secondary ? '#10b981' : 'white'};
  border: ${secondary ? '2px solid #10b981' : 'none'};
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  &:disabled {
    background: #9ca3af;
    border-color: #9ca3af;
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
