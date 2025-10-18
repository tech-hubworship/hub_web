/**
 * MediaGallery 컴포넌트
 * 
 * 2025 허브 공동체 미디어선교 전시를 위한 미디어 갤러리 섹션입니다.
 * - 카운트다운 타이머 기능
 * - 전시 오픈 전까지는 카운트다운 표시
 * - 오픈 후에는 미디어 갤러리로 이동하는 버튼 표시
 * 
 * @author HUB Development Team
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';

// 스타일 컴포넌트들
const Container = styled.section`
  width: 100%;
  background-color: #000000;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const PosterSection = styled.section`
  width: 100%;
  height: calc((1130 / 1078) * 100vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-image: url('/images/media_poster.webp');
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  position: relative;

  @media (min-width: 58.75rem) {
    height: calc((1130 / 1078) * 100vw);
    width: 100%;
    background-size: contain;
  }
`;

const CountdownSection = styled.section`
  width: 100%;
  background-color: #000000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
`;

const CountdownContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 30px;
`;

const CountdownTitle = styled.h2`
  color: #FFFFFF;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin: 0;
  white-space: nowrap;

  @media (min-width: 58.75rem) {
    font-size: 24px;
  }
`;

const CountdownTimer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;

  @media (min-width: 58.75rem) {
    gap: 24px;
  }
`;

const TimeUnit = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const TimeValue = styled.span`
  color: #FFFFFF;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1;

  @media (min-width: 58.75rem) {
    font-size: 40px;
  }
`;

const TimeLabel = styled.span`
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: -0.3px;
  opacity: 0.8;

  @media (min-width: 58.75rem) {
    font-size: 14px;
  }
`;

const OpenSection = styled.section`
  width: 100%;
  background-color: #000000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 20px;
  min-height: 300px;
`;

const OpenButton = styled.button`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80%;
  max-width: 800px;
  padding: 24px 20px;
  background-color: #ED2725;
  border-radius: 0;
  border: 2px solid #ED2725;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.5px;
  box-shadow: 0 4px 20px rgba(237, 39, 37, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    transform: translateY(-2px);
    background-color: #d11f1d;
    border-color: #d11f1d;
    box-shadow: 0 6px 24px rgba(237, 39, 37, 0.5);
  }

  &:hover::before {
    left: 100%;
  }

  &:active {
    transform: translateY(0);
    transition: all 0.15s ease;
  }

  @media (min-width: 58.75rem) {
    font-size: 20px;
    padding: 28px 20px;
  }
`;

const MediaGallery = () => {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isOpen, setIsOpen] = useState(false);

  // 전시 오픈 시간: 2025년 10월 19일 오후 4시
  const openTime = new Date('2025-10-19T16:00:00+09:00');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = openTime.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGalleryClick = () => {
    router.push('/media-gallery');
  };

  return (
    <Container>
      <Content>
        <PosterSection />
        
        {!isOpen && (
          <CountdownSection>
            <CountdownContainer>
              <CountdownTitle>전시 오픈까지</CountdownTitle>
              <CountdownTimer>
                <TimeUnit>
                  <TimeValue>{timeLeft.days}</TimeValue>
                  <TimeLabel>일</TimeLabel>
                </TimeUnit>
                <TimeUnit>
                  <TimeValue>{timeLeft.hours}</TimeValue>
                  <TimeLabel>시간</TimeLabel>
                </TimeUnit>
                <TimeUnit>
                  <TimeValue>{timeLeft.minutes}</TimeValue>
                  <TimeLabel>분</TimeLabel>
                </TimeUnit>
                <TimeUnit>
                  <TimeValue>{timeLeft.seconds}</TimeValue>
                  <TimeLabel>초</TimeLabel>
                </TimeUnit>
              </CountdownTimer>
            </CountdownContainer>
          </CountdownSection>
        )}

        {isOpen && (
          <OpenSection>
            <OpenButton onClick={handleGalleryClick}>
              미디어 갤러리 보러가기
            </OpenButton>
          </OpenSection>
        )}
      </Content>
    </Container>
  );
};

export default MediaGallery;