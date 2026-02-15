import React from 'react';
import styled from '@emotion/styled';
import { useRouter } from 'next/navigation';
import { getVideoEventPath, VIDEO_EVENT } from '@src/lib/video-event/constants';

const SectionCard = styled.div`
  background: #EF0017;
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
  color: #ffffff;
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
  background: #ffffff;
  color: #000000;
  border: none;
  padding: 16px 40px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #e5e7eb;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 14px 32px;
    font-size: 16px;
  }
`;

export default function VideoEventPromotion() {
  const router = useRouter();

  const handleClick = () => {
    router.push(getVideoEventPath());
  };

  return (
    <SectionCard>
      <BackgroundImage />
      <ContentWrapper>
        <IconWrapper>
          <img src={VIDEO_EVENT.EVENT_LOGO_PATH} alt={`${VIDEO_EVENT.DISPLAY_NAME} 로고`} />
        </IconWrapper>
        <Title>{VIDEO_EVENT.DISPLAY_NAME} 묵상</Title>
        <Description>
          이벤트 기간 동안 매일 올라오는 말씀과 영상을 통해
          <br />
          함께 묵상하고 나눔을 나누어보세요
        </Description>

        <CTAButton onClick={handleClick}>
          {VIDEO_EVENT.DISPLAY_NAME} 페이지로 이동 →
        </CTAButton>
      </ContentWrapper>
    </SectionCard>
  );
}
