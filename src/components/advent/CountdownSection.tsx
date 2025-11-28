import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

// ==================== Animations ====================
const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// ==================== Styled Components ====================
const SectionCard = styled.div`
  background: #000000;
  padding: 60px 40px;
  color: #ffffff;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  margin-bottom: 0;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 1024px) {
    padding: 48px 32px;
  }

  @media (max-width: 768px) {
    padding: 40px 24px;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
`;

const Message = styled.div`
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 40px;
  line-height: 1.6;
  animation: ${fadeIn} 0.6s ease-out;

  @media (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 32px;
  }

  @media (max-width: 480px) {
    font-size: 18px;
    margin-bottom: 24px;
  }
`;

const CountdownContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin: 40px 0;
  animation: ${fadeIn} 0.8s ease-out;

  @media (max-width: 768px) {
    gap: 16px;
    margin: 32px 0;
  }

  @media (max-width: 480px) {
    gap: 12px;
    margin: 24px 0;
  }
`;

const TimeUnit = styled.div<{ delay?: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  animation: ${pulse} 2s ease-in-out infinite;
  animation-delay: ${props => props.delay || 0}s;

  @media (max-width: 480px) {
    gap: 6px;
  }
`;

const TimeValue = styled.div`
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  color: #ECC784;
  text-shadow: 0 0 20px rgba(236, 199, 132, 0.5);
  min-width: 1.2em;
  text-align: center;
  font-variant-numeric: tabular-nums;

  @media (max-width: 768px) {
    font-size: 36px;
    min-width: 1.2em;
  }

  @media (max-width: 480px) {
    font-size: 28px;
    min-width: 1.2em;
  }
`;

const TimeLabel = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: #cccccc;
  text-transform: uppercase;
  letter-spacing: 1px;

  @media (max-width: 768px) {
    font-size: 12px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const Separator = styled.div`
  font-size: 36px;
  font-weight: 300;
  color: #ECC784;
  opacity: 0.6;

  @media (max-width: 768px) {
    font-size: 28px;
  }

  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

// ==================== Component ====================
interface CountdownSectionProps {
  targetDate: Date;
}

export const CountdownSection: React.FC<CountdownSectionProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    // 초기 계산
    calculateTimeLeft();

    // 1초마다 업데이트
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <SectionCard>
      <ContentWrapper>
        <Message>
          출석하기와 묵상하기는 1일차에 오픈 됩니다.
        </Message>
        
        <CountdownContainer>
          <TimeUnit delay={0}>
            <TimeValue>{String(timeLeft.days).padStart(2, '0')}</TimeValue>
            <TimeLabel>일</TimeLabel>
          </TimeUnit>
          <Separator>:</Separator>
          <TimeUnit delay={0.2}>
            <TimeValue>{String(timeLeft.hours).padStart(2, '0')}</TimeValue>
            <TimeLabel>시간</TimeLabel>
          </TimeUnit>
          <Separator>:</Separator>
          <TimeUnit delay={0.4}>
            <TimeValue>{String(timeLeft.minutes).padStart(2, '0')}</TimeValue>
            <TimeLabel>분</TimeLabel>
          </TimeUnit>
          <Separator>:</Separator>
          <TimeUnit delay={0.6}>
            <TimeValue>{String(timeLeft.seconds).padStart(2, '0')}</TimeValue>
            <TimeLabel>초</TimeLabel>
          </TimeUnit>
        </CountdownContainer>
      </ContentWrapper>
    </SectionCard>
  );
};

