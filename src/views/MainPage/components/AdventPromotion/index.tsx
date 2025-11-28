import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useRouter } from 'next/router';

const SectionCard = styled.div`
  background: #724886;
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

const BackgroundImage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/icons/intro.svg');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.3;
  z-index: 0;
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const Title = styled.h2`
  font-size: 36px;
  font-weight: 800;
  color: #CEB2FF;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);

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
  background: #CEB2FF;
  color: #000000;
  border: none;
  padding: 16px 40px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  box-shadow: 0 4px 12px rgba(206, 178, 255, 0.3);

  &:hover {
    background: #B89AFF;
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(206, 178, 255, 0.4);
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
  color: #CEB2FF;
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
  color: #CEB2FF;
  margin: 0 4px;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

export default function AdventPromotion() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // 오픈 시간: 2025년 11월 29일 12시 (한국시간)

  useEffect(() => {
    const updateCountdown = () => {
      // 오픈 시간: 2025년 11월 29일 12시 (한국시간, UTC+9)
      // ISO string with timezone은 자동으로 UTC로 변환됨
      const openDate = new Date('2025-11-29T12:00:00+09:00');
      
      // 현재 시간 (UTC 기준, Date 객체는 내부적으로 UTC로 저장됨)
      const now = new Date();
      
      // 둘 다 UTC 기준이므로 직접 비교
      const diff = openDate.getTime() - now.getTime();

      if (diff <= 0) {
        setIsOpen(true);
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
      setIsOpen(false);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (isOpen) {
      router.push('/advent');
    }
  };

  return (
    <SectionCard>
      <BackgroundImage />
      <ContentWrapper>
        <IconWrapper>
          <img src="/icons/advent_logo.svg" alt="Advent Logo" />
        </IconWrapper>
        <Title>대림절 묵상</Title>
        <Description>
          대림절 기간 동안 매일 올라오는 말씀과 영상을 통해
          <br />
          함께 묵상하고 나눔을 나누어보세요
        </Description>
        {isOpen ? (
          <CTAButton onClick={handleClick}>
            대림절 페이지로 이동 →
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
      </ContentWrapper>
    </SectionCard>
  );
}

