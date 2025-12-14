import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useRouter } from 'next/router';

const SectionCard = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 60px 40px;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  @media (max-width: 1024px) {
    padding: 50px 32px;
    min-height: 350px;
  }

  @media (max-width: 768px) {
    padding: 40px 24px;
    min-height: 300px;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  z-index: 1;
  position: relative;

  @media (max-width: 768px) {
    gap: 20px;
  }
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
  font-size: 36px;
  font-weight: 800;
  color: #FFD700;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

  @media (max-width: 1024px) {
    font-size: 32px;
  }

  @media (max-width: 768px) {
    font-size: 28px;
  }
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
  background: #FFD700;
  color: #000000;
  border: none;
  padding: 16px 40px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);

  &:hover {
    background: #FFC700;
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(255, 215, 0, 0.4);
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 768px) {
    padding: 14px 32px;
    font-size: 16px;
  }
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

  // 신청 마감 시간: 2026년 2월 15일 02시 (한국시간)
  const APPLICATION_CLOSE_DATE = new Date('2026-02-15T02:00:00+09:00');
  // 배부 시작 시간: 2026년 1월 1일 00시 (한국시간)
  const DISTRIBUTION_DATE = new Date('2026-01-01T00:00:00+09:00');
  // 오픈 시간: 2025년 11월 30일 16시 (오후 4시, 한국시간)
  const OPEN_DATE = new Date('2025-11-30T16:00:00+09:00');

  useEffect(() => {
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
  }, []);

  const handleClick = () => {
    if (isOpen && !isApplicationClosed) {
      router.push('/bible-card');
    } else if (isApplicationClosed) {
      router.push('/bible-card/download');
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
                <CountdownText>공개까지 남은 시간</CountdownText>
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

