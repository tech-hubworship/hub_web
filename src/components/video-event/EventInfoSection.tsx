import React, { useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { VIDEO_EVENT, formatEventDateRange } from "@src/lib/video-event/constants";

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
  color: #ffffff;
  margin: 0;
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const DateText = styled(motion.p)`
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const DescriptionText = styled(motion.p)`
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
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
  color: #ffffff;
  margin: 0;
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const NoticeText = styled(motion.p)`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
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
      ease: "easeOut",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const candleVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

interface EventInfoSectionProps {
  onCandleVisible?: () => void;
}

export const EventInfoSection: React.FC<EventInfoSectionProps> = ({
  onCandleVisible,
}) => {
  const candleRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasCalled = useRef(false);
  const isMobile =
    typeof window !== "undefined" &&
    (window.innerWidth <= 768 || window.innerHeight <= 500);

  useEffect(() => {
    if (!candleRef.current || hasCalled.current) return;
    const targetElement = isMobile ? sectionRef.current : candleRef.current;
    if (!targetElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            entry.intersectionRatio > (isMobile ? 0.3 : 0.1)
          ) {
            if (!hasCalled.current) {
              hasCalled.current = true;
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
    return () => observer.disconnect();
  }, [onCandleVisible, isMobile]);

  const dateRange = formatEventDateRange(
    VIDEO_EVENT.BASE_DATE,
    VIDEO_EVENT.END_DATE
  );

  return (
    <SectionCard
      ref={sectionRef}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: true,
        margin: isMobile ? "-50px" : "-100px",
        amount: 0,
      }}
      variants={containerVariants}
    >
      <ContentWrapper>
        <CandleIcon
          ref={candleRef}
          variants={candleVariants}
          onAnimationStart={(definition: any) => {
            if (
              !isMobile &&
              !hasCalled.current &&
              definition &&
              definition.opacity === 1
            ) {
              hasCalled.current = true;
              onCandleVisible?.();
            }
          }}
        >
          <img src="/icons/candle.svg" alt="candle icon" />
        </CandleIcon>

        <EventTitle variants={itemVariants}>
          허브 공동체 {VIDEO_EVENT.DISPLAY_NAME} 이벤트
        </EventTitle>

        <DateText variants={itemVariants}>{dateRange}</DateText>

        <DescriptionText variants={itemVariants}>
          {`사순절 기간 동안 웹사이트에 올라오는 영상을 시청 후,
출석 버튼을 눌러주세요!`}
        </DescriptionText>

        <GiftText variants={itemVariants}>
          1일차부터 40일동안 매일 출석한 분들께 선물을 드립니다 :)
        </GiftText>
      </ContentWrapper>
    </SectionCard>
  );
};
