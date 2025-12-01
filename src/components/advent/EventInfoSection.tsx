import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

const SectionCard = styled(motion.div)`
  background: #000000;
  padding: 40px 40px;
  color: #ffffff;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);

  @media (max-width: 1024px) {
    padding: 32px 32px;
  }

  @media (max-width: 768px) {
    padding: 24px 24px;
  }
`;

const ContentWrapper = styled(motion.div)`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const CandleIcon = styled(motion.div)`
  width: 46px;
  height: 45px;
  margin-bottom: 8px;

  img {
    width: 100%;
    height: 100%;
  }
`;

const EventTitle = styled(motion.h2)`
  font-size: 28px;
  font-weight: 800;
  color: #CEB2FF;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const DateText = styled(motion.p)`
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const DescriptionText = styled(motion.p)`
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  line-height: 1.8;
  white-space: pre-line;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const GiftText = styled(motion.p)`
  font-size: 16px;
  font-weight: 700;
  color: #CEB2FF;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const NoticeText = styled(motion.p)`
  font-size: 14px;
  font-weight: 600;
  color: #B5B5B5;
  margin: 0;
  line-height: 1.8;
  white-space: pre-line;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

const candleVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.8,
      ease: [0.34, 1.56, 0.64, 1]
    }
  }
};

export const EventInfoSection: React.FC = () => {
  return (
    <SectionCard
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
    >
      <ContentWrapper>
        <CandleIcon variants={candleVariants}>
          <img src="/icons/candle.svg" alt="candle icon" />
        </CandleIcon>

        <EventTitle variants={itemVariants}>
          허브 공동체 대림절 이벤트
        </EventTitle>

        <DateText variants={itemVariants}>
          2025.11.30 - 2025.12.25
        </DateText>

        <DescriptionText variants={itemVariants}>
          {`대림절 기간 동안 웹사이트에 올라오는 영상을 시청 후,
짧은 묵상을 올린 뒤, 출석까지 완료해주세요.`}
        </DescriptionText>

        <GiftText variants={itemVariants}>
          매일 묵상+출석을 올려주신 분들께 선물을 드립니다 :)
        </GiftText>

        <NoticeText variants={itemVariants}>
          {`*1일차부터 이벤트 참여가 시작됩니다.
*묵상을 올리시면 '출석하기' 버튼이 나옵니다.
*이 버튼까지 꼭 눌러주셔야 출석이 인정됩니다.`}
        </NoticeText>
      </ContentWrapper>
    </SectionCard>
  );
};

