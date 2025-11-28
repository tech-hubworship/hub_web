import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

// ==================== Animations ====================
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.95);
  }
`;

const breathe = keyframes`
  0%, 100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  50% {
    transform: scale(1.05) translateY(-10px);
    opacity: 0.9;
  }
`;

// ==================== Styled Components ====================
const LoadingContainer = styled.div`
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
  animation: ${fadeIn} 0.3s ease-in;
`;

const IntroImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: ${breathe} 2.5s ease-in-out infinite;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 16px;
  }
`;

// ==================== Component ====================
export const LoadingScreen = () => {
  return (
    <LoadingContainer>
      <IntroImage 
        src="/icons/intro.svg" 
        alt="로딩 중"
      />
    </LoadingContainer>
  );
};

