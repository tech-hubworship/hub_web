import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { AdventPost } from '@src/lib/advent/types';

const SectionCard = styled(motion.div)<{ isFullScreen: boolean }>`
  background: #724886;
  padding: 0;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  background-image: url('/icons/intro.svg');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  background-attachment: scroll;
  position: relative;
`;

const SpinnerContainer = styled(motion.div)`
  position: absolute;
  top: 70%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Spinner = styled(motion.div)`
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #ffffff;
  border-radius: 50%;
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    border-width: 3px;
  }
`;

interface IntroSectionProps {
  post?: AdventPost;
  isLoading?: boolean;
}

export const IntroSection: React.FC<IntroSectionProps> = ({ post, isLoading = false }) => {
  const spinnerVariants = {
    rotate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <SectionCard
      isFullScreen={isLoading}
      initial={false}
      animate={{ 
        height: isLoading ? '100vh' : '520px',
      }}
      style={{
        opacity: 1,
        position: isLoading ? 'fixed' : 'relative',
        top: isLoading ? 0 : 'auto',
        left: isLoading ? 0 : 'auto',
        zIndex: isLoading ? 9999 : 'auto',
      }}
      transition={{ 
        height: {
          duration: 1.2,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }}
    >
      {isLoading && (
        <SpinnerContainer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Spinner
            variants={spinnerVariants}
            animate="rotate"
          />
        </SpinnerContainer>
      )}
    </SectionCard>
  );
};

