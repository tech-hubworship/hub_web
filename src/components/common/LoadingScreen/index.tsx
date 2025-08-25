import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useLoading } from '@src/contexts/LoadingContext';

// 5대 솔라 정보 목록
const solarPrinciples = [
  {
    name: "Sola Scriptura",
    translation: "오직 성경으로",
  },
  {
    name: "Sola Fide",
    translation: "오직 믿음으로",
  },
  {
    name: "Sola Gratia",
    translation: "오직 은혜로",
  },
  {
    name: "Solus Christus",
    translation: "오직 그리스도로",
  },
  {
    name: "Soli Deo Gloria",
    translation: "오직 하나님께 영광을",

  }
];

const LoadingScreen: React.FC = () => {
  const { isLoading } = useLoading();
  const [principle, setPrinciple] = useState(solarPrinciples[0]);
  
  // 로딩 중에 5초마다 솔라 원리 변경
  useEffect(() => {
    if (!isLoading) return;
    
    const randomPrinciple = () => {
      const randomIndex = Math.floor(Math.random() * solarPrinciples.length);
      setPrinciple(solarPrinciples[randomIndex]);
    };
    
    // 초기 원리 설정
    randomPrinciple();
    
    // 5초마다 원리 변경
    const interval = setInterval(randomPrinciple, 5000);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <LoadingContainer>
      <LoadingContent>
        <CrossContainer>
          <Cross />
          <LightBeam />
        </CrossContainer>
        <PrincipleContainer>
          <PrincipleName>{principle.name}</PrincipleName>
          <PrincipleTranslation>{principle.translation}</PrincipleTranslation>
        </PrincipleContainer>
        <LoadingText>본질을 알아가는 중...</LoadingText>
      </LoadingContent>
    </LoadingContainer>
  );
};

// 애니메이션 정의
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const float = keyframes`
  0% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(0deg); }
  100% { transform: translateY(0) rotate(0deg); }
`;

const glow = keyframes`
  0% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 0.8; transform: scale(1.2); }
  100% { opacity: 0.4; transform: scale(0.8); }
`;

// 스타일 컴포넌트
const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #b01e1c 0%, #901715 50%, #701210 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: ${fadeIn} 0.5s ease;
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
  max-width: 90%;
  text-align: center;
`;

const CrossContainer = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Cross = styled.div`
  width: 60px;
  height: 80px;
  position: relative;
  z-index: 5;
  animation: ${float} 3s ease-in-out infinite;

  &:before, &:after {
    content: '';
    position: absolute;
    background-color: #ffffff;
  }

  &:before {
    width: 20px;
    height: 80px;
    left: 20px;
    top: 0;
  }

  &:after {
    width: 60px;
    height: 20px;
    left: 0;
    top: 20px;
  }
`;

const LightBeam = styled.div`
  position: absolute;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
  animation: ${glow} 4s ease-in-out infinite;
`;

const PrincipleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 350px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 20px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.15);
`;

const PrincipleName = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: #edf2f7;
  margin: 0 0 5px 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
`;

const PrincipleTranslation = styled.h3`
  font-size: 18px;
  font-weight: 500;
  color: #e2e8f0;
  margin: 0 0 15px 0;
  font-style: italic;
`;

const PrincipleDescription = styled.p`
  font-size: 16px;
  font-weight: 400;
  color: white;
  margin: 0 0 10px 0;
  line-height: 1.5;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
`;

const PrincipleReference = styled.p`
  font-size: 14px;
  color: #bee3f8;
  margin: 5px 0 0;
  font-style: italic;
`;

const LoadingText = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: #ffe0e0;
  margin-top: 20px;
`;

export default LoadingScreen; 