import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

// ==================== Styled Components ====================
const SectionCard = styled(motion.div)`
  background: #000000;
  padding: 60px 40px;
  color: #ffffff;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  margin-bottom: 0;
  will-change: transform, opacity;

  @media (max-width: 1024px) {
    padding: 48px 32px;
  }

  @media (max-width: 768px) {
    padding: 40px 24px;
  }
`;

const ContentWrapper = styled(motion.div)`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
`;

const Message = styled(motion.div)`
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 40px;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 32px;
  }

  @media (max-width: 480px) {
    font-size: 18px;
    margin-bottom: 24px;
  }
`;

const CountdownContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin: 40px 0;

  @media (max-width: 768px) {
    gap: 16px;
    margin: 32px 0;
  }

  @media (max-width: 480px) {
    gap: 12px;
    margin: 24px 0;
  }
`;

const TimeUnit = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

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

  const timeUnitVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <SectionCard
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-200px" }}
      variants={containerVariants}
    >
      <ContentWrapper>
        <Message variants={itemVariants}>
          묵상하기와 출석하기는 1차(11월 30일)에 오픈됩니다.
        </Message>
        
        <CountdownContainer variants={containerVariants}>
          <TimeUnit
            variants={timeUnitVariants}
            animate={["visible", "pulse"]}
            transition={{ delay: 0 }}
          >
            <TimeValue>{String(timeLeft.days).padStart(2, '0')}</TimeValue>
            <TimeLabel>일</TimeLabel>
          </TimeUnit>
          <motion.div variants={itemVariants} style={{ fontSize: '36px', fontWeight: 300, color: '#ECC784', opacity: 0.6 }}>
            :
          </motion.div>
          <TimeUnit
            variants={timeUnitVariants}
            animate={["visible", "pulse"]}
            transition={{ delay: 0.2 }}
          >
            <TimeValue>{String(timeLeft.hours).padStart(2, '0')}</TimeValue>
            <TimeLabel>시간</TimeLabel>
          </TimeUnit>
          <motion.div variants={itemVariants} style={{ fontSize: '36px', fontWeight: 300, color: '#ECC784', opacity: 0.6 }}>
            :
          </motion.div>
          <TimeUnit
            variants={timeUnitVariants}
            animate={["visible", "pulse"]}
            transition={{ delay: 0.4 }}
          >
            <TimeValue>{String(timeLeft.minutes).padStart(2, '0')}</TimeValue>
            <TimeLabel>분</TimeLabel>
          </TimeUnit>
          <motion.div variants={itemVariants} style={{ fontSize: '36px', fontWeight: 300, color: '#ECC784', opacity: 0.6 }}>
            :
          </motion.div>
          <TimeUnit
            variants={timeUnitVariants}
            animate={["visible", "pulse"]}
            transition={{ delay: 0.6 }}
          >
            <TimeValue>{String(timeLeft.seconds).padStart(2, '0')}</TimeValue>
            <TimeLabel>초</TimeLabel>
          </TimeUnit>
        </CountdownContainer>
      </ContentWrapper>
    </SectionCard>
  );
};

