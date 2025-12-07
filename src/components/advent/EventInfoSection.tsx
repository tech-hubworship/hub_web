import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

const SectionCard = styled(motion.div)`
  background: #000000;
  padding: 40px 40px;
  color: #ffffff;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  will-change: transform, opacity;

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
      duration: 0.6,
      staggerChildren: 0.1,
      delayChildren: 0.1,
      ease: "easeOut"
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const candleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.1,
    transition: {
      duration: 0.3
    }
  }
};

interface EventInfoSectionProps {
  onCandleVisible?: () => void;
}

export const EventInfoSection: React.FC<EventInfoSectionProps> = ({ onCandleVisible }) => {
  const candleRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasCalled = useRef(false);
  const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 768 || window.innerHeight <= 500);

  useEffect(() => {
    if (!candleRef.current || hasCalled.current) return;

    // 모바일에서는 섹션이 실제로 보일 때까지 기다림
    const targetElement = isMobile ? sectionRef.current : candleRef.current;
    if (!targetElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > (isMobile ? 0.3 : 0.1)) {
            // 모바일: 섹션이 충분히 보일 때, PC: 캔들 아이콘이 보이기 시작할 때
            if (!hasCalled.current) {
              hasCalled.current = true;
              // 모바일에서는 약간의 지연을 두어 애니메이션이 시작된 후에 숨김
              setTimeout(() => {
                onCandleVisible?.();
              }, isMobile ? 300 : 0);
            }
          }
        });
      },
      { threshold: isMobile ? 0.3 : 0.1 }
    );

    observer.observe(targetElement);

    return () => {
      observer.disconnect();
    };
  }, [onCandleVisible, isMobile]);

  return (
    <SectionCard
      ref={sectionRef}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: isMobile ? "-50px" : "-100px", amount: 0 }}
      variants={containerVariants}
    >
      <ContentWrapper>
        <CandleIcon 
          ref={candleRef}
          variants={candleVariants}
          whileHover="hover"
          onAnimationStart={(definition: any) => {
            // PC에서만 캔들 아이콘 애니메이션이 visible 상태로 시작될 때 콜백 호출
            if (!isMobile && !hasCalled.current && definition && (definition.opacity === 1 || definition.scale === 1)) {
              hasCalled.current = true;
              onCandleVisible?.();
            }
          }}
        >
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

