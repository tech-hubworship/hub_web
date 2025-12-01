import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

// ==================== Styled Components ====================
const LoadingContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #724886;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const IntroImageWrapper = styled.div`
  width: 100%;
  height: 100%;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 16px;
  }
`;

// ==================== Component ====================
export const LoadingScreen = () => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.5 }
    },
    exit: { 
      opacity: 0,
      y: -520,
      transition: { 
        duration: 1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const imageVariants = {
    initial: { 
      scale: 0.8,
      opacity: 0,
      y: 20
    },
    animate: { 
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const breatheVariants = {
    animate: {
      y: [0, -15, 0],
      scale: [1, 1.05, 1],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <LoadingContainer
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        variants={imageVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div
          variants={breatheVariants}
          animate="animate"
        >
          <IntroImageWrapper>
            <img
              src="/icons/intro.svg" 
              alt="로딩 중"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </IntroImageWrapper>
        </motion.div>
      </motion.div>
    </LoadingContainer>
  );
};

