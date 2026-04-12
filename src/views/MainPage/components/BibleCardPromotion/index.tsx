import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

const SectionCard = styled.div`
  background: #171E39;
  padding: 60px 20px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ContentWrapper = styled.div`
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  font-size: 64px;

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 48px;
  }
`;

const Title = styled.h2`
  font-family: 'Wanted Sans', sans-serif;
  font-weight: 700;
  font-size: 32px;
  color: #fff;
  margin: 0;
`;

const Description = styled.p`
  font-size: 18px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0;
  line-height: 1.8;
  max-width: 600px;

  @media (max-width: 1024px) {
    font-size: 16px;
  }

  @media (max-width: 768px) {
    font-size: 14px;
    max-width: 100%;
  }
`;

const CTAButton = styled.button`
  background: #FFFFFF;
  color: #171E39;
  border: none;
  padding: 0 28px;
  height: 52px;
  font-family: 'Wanted Sans', sans-serif;
  font-size: 18px;
  font-weight: 700;
  border-radius: 16px;
  letter-spacing: -0.04em;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.85; }
`;

const CountdownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 8px;

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const CountdownText = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const CountdownGrid = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const CountdownItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const CountdownNumber = styled.div`
  font-size: 32px;
  font-weight: 800;
  color: #FFD700;
  min-width: 60px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    font-size: 24px;
    min-width: 50px;
  }
`;

const CountdownLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #FFFFFF;
  opacity: 0.8;

  @media (max-width: 768px) {
    font-size: 10px;
  }
`;

const CountdownSeparator = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #FFD700;
  margin: 0 4px;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

export default function BibleCardPromotion() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  // 테스트 모드: 쿼리 스트링에 value=test 또는 value=admin이 있으면 카운트다운 무시
  const v = searchParams?.get('value');
  const isTestMode = v === 'test' || v === 'admin';
  
  // 특별한 텍스트를 보여줄 사용자 목록
  const specialUsers = ['고주원', '김형진', '정민정', '김현아', '남윤희', '김세인', '여기준', '오해성', '최주영'];
  const userName = session?.user?.name;
  const isSpecialUser = userName && specialUsers.includes(userName);
  
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isApplicationClosed, setIsApplicationClosed] = useState(false);
  const [distributionTimeLeft, setDistributionTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // 신청 마감 시간: 2025년 12월 15일 02시 (한국시간)
  const APPLICATION_CLOSE_DATE = new Date('2025-12-15T02:00:00+09:00');
  // 배부 시작 시간: 2026년 1월 1일 00시 (한국시간)
  const DISTRIBUTION_DATE = new Date('2026-01-01T00:00:00+09:00');
  // 오픈 시간: 2025년 11월 30일 16시 (오후 4시, 한국시간)
  const OPEN_DATE = new Date('2025-11-30T16:00:00+09:00');

  useEffect(() => {
    // 테스트 모드: 카운트다운 무시하고 버튼 표시
    if (isTestMode) {
      setIsApplicationClosed(true);
      setIsOpen(false);
      setDistributionTimeLeft(null); // 카운트다운 없이 바로 버튼 표시
      setTimeLeft(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      
      // 신청 마감 시간 체크
      if (now >= APPLICATION_CLOSE_DATE) {
        setIsApplicationClosed(true);
        setIsOpen(false);
        
        // 배부 시작까지 카운트다운
        const diff = DISTRIBUTION_DATE.getTime() - now.getTime();
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setDistributionTimeLeft({ days, hours, minutes, seconds });
        } else {
          setDistributionTimeLeft(null);
        }
        return;
      }
      
      // 신청 오픈 시간 체크
      const diff = OPEN_DATE.getTime() - now.getTime();
      if (diff <= 0) {
        setIsOpen(true);
        setTimeLeft(null);
        setIsApplicationClosed(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
      setIsOpen(false);
      setIsApplicationClosed(false);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isTestMode]);

  const handleClick = () => {
    if (isOpen && !isApplicationClosed) {
      router.push('/bible-card');
    } else if (isApplicationClosed) {
      // 테스트 모드면 쿼리 스트링 전달
      const url = isTestMode ? '/bible-card/download?value=test' : '/bible-card/download';
      router.push(url);
    }
  };

  return (
    <SectionCard>
      <ContentWrapper>
        <IconWrapper>📜</IconWrapper>
        {isApplicationClosed ? (
          <>
            <Title>신년 말씀카드</Title>
            {distributionTimeLeft ? (
              <CountdownWrapper>
                <CountdownText>{isSpecialUser ? `${userName} 30살까지 남은 시간` : '공개까지 남은 시간'}</CountdownText>
                <CountdownGrid>
                  <CountdownItem>
                    <CountdownNumber>{String(distributionTimeLeft.days).padStart(2, '0')}</CountdownNumber>
                    <CountdownLabel>일</CountdownLabel>
                  </CountdownItem>
                  <CountdownSeparator>:</CountdownSeparator>
                  <CountdownItem>
                    <CountdownNumber>{String(distributionTimeLeft.hours).padStart(2, '0')}</CountdownNumber>
                    <CountdownLabel>시</CountdownLabel>
                  </CountdownItem>
                  <CountdownSeparator>:</CountdownSeparator>
                  <CountdownItem>
                    <CountdownNumber>{String(distributionTimeLeft.minutes).padStart(2, '0')}</CountdownNumber>
                    <CountdownLabel>분</CountdownLabel>
                  </CountdownItem>
                  <CountdownSeparator>:</CountdownSeparator>
                  <CountdownItem>
                    <CountdownNumber>{String(distributionTimeLeft.seconds).padStart(2, '0')}</CountdownNumber>
                    <CountdownLabel>초</CountdownLabel>
                  </CountdownItem>
                </CountdownGrid>
              </CountdownWrapper>
            ) : (
              <CTAButton onClick={handleClick}>
                말씀카드 다운로드 →
              </CTAButton>
            )}
          </>
        ) : (
          <>
        <Title>신년 말씀카드 신청</Title>
        {isOpen ? (
          <CTAButton onClick={handleClick}>
            말씀카드 페이지로 이동 →
          </CTAButton>
        ) : (
          <CountdownWrapper>
            <CountdownText>오픈까지 남은 시간</CountdownText>
            {timeLeft && (
              <CountdownGrid>
                <CountdownItem>
                  <CountdownNumber>{String(timeLeft.days).padStart(2, '0')}</CountdownNumber>
                  <CountdownLabel>일</CountdownLabel>
                </CountdownItem>
                <CountdownSeparator>:</CountdownSeparator>
                <CountdownItem>
                  <CountdownNumber>{String(timeLeft.hours).padStart(2, '0')}</CountdownNumber>
                  <CountdownLabel>시</CountdownLabel>
                </CountdownItem>
                <CountdownSeparator>:</CountdownSeparator>
                <CountdownItem>
                  <CountdownNumber>{String(timeLeft.minutes).padStart(2, '0')}</CountdownNumber>
                  <CountdownLabel>분</CountdownLabel>
                </CountdownItem>
                <CountdownSeparator>:</CountdownSeparator>
                <CountdownItem>
                  <CountdownNumber>{String(timeLeft.seconds).padStart(2, '0')}</CountdownNumber>
                  <CountdownLabel>초</CountdownLabel>
                </CountdownItem>
              </CountdownGrid>
            )}
          </CountdownWrapper>
            )}
          </>
        )}
      </ContentWrapper>
    </SectionCard>
  );
}

