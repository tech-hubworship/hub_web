import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('@src/components/Footer'), { ssr: true });

// 카드 뒤집기 애니메이션
const flipCard = keyframes`
  0% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(180deg);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
`;

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    animation: ${float} 20s ease-in-out infinite;
  }
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: 900;
  color: white;
  text-align: center;
  margin-bottom: 20px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  margin-bottom: 60px;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 40px;
  }
`;

const CardWrapper = styled.div`
  perspective: 1000px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  z-index: 1;
`;

const Card = styled.div<{ isFlipped: boolean; isClickable: boolean }>`
  width: 100%;
  aspect-ratio: 2 / 3;
  position: relative;
  transform-style: preserve-3d;
  cursor: ${props => props.isClickable ? 'pointer' : 'default'};
  transition: transform 0.6s ease-in-out;

  transform: ${props => props.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'};

  &:hover {
    transform: ${props => props.isClickable 
      ? props.isFlipped ? 'rotateY(180deg) scale(1.02)' : 'rotateY(0deg) scale(1.02)'
      : 'none'};
  }
`;

const CardFace = styled.div<{ isBack?: boolean }>`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;

  ${props => props.isBack ? `
    transform: rotateY(180deg);
  ` : ''}
`;

const CardFront = styled(CardFace)`
  background: white;
  color: #333;
`;

const CardBack = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  background: white;
  color: #333;
  transform: rotateY(180deg);
`;

const CardIcon = styled.div`
  font-size: 100px;
  margin-bottom: 30px;
  animation: ${float} 3s ease-in-out infinite;
`;

const CardText = styled.div`
  font-size: 28px;
  font-weight: 700;
  text-align: center;
`;

const CardHint = styled.div`
  font-size: 14px;
  font-weight: 400;
  text-align: center;
  margin-top: 20px;
  opacity: 0.7;
`;

const QuestionText = styled.div`
  font-size: 22px;
  font-weight: 600;
  text-align: center;
  line-height: 1.6;
  word-break: keep-all;
`;


const SpinAgainButton = styled.button`
  margin-top: 40px;
  padding: 16px 40px;
  background: rgba(239, 68, 68, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 50px;
  color: white;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  z-index: 1;

  &:hover {
    background: rgba(239, 68, 68, 0.3);
    border-color: rgba(239, 68, 68, 0.5);
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
  }

  &:active {
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 14px 32px;
    font-size: 16px;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.9);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
  text-align: center;
  font-size: 16px;
  max-width: 500px;
  z-index: 1;
`;


interface Question {
  id: number;
  question: string;
}

const IceBreakingPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [drawnQuestions, setDrawnQuestions] = useState<number[]>([]);

  // 세션 ID 생성 (브라우저 로컬 스토리지에 저장)
  useEffect(() => {
    const storedSessionId = localStorage.getItem('ice_breaking_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      const storedDrawn = localStorage.getItem('ice_breaking_drawn');
      if (storedDrawn) {
        setDrawnQuestions(JSON.parse(storedDrawn));
      }
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      localStorage.setItem('ice_breaking_session_id', newSessionId);
    }
  }, []);

  const handleCardClick = async () => {
    if (isLoading) return;
    
    if (!isFlipped) {
      // 카드가 앞면일 때 - 먼저 뒤집고 질문 가져오기
      setIsFlipped(true);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ice-breaking/draw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            drawnQuestions,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '질문을 가져오는데 실패했습니다.');
        }

        if (data.question) {
          setCurrentQuestion(data.question);
          setDrawnQuestions([...drawnQuestions, data.question.id]);
          localStorage.setItem('ice_breaking_drawn', JSON.stringify([...drawnQuestions, data.question.id]));
          setIsLoading(false);
        } else {
          throw new Error('더 이상 뽑을 질문이 없습니다!');
        }
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
      }
    } else {
      // 카드가 뒷면일 때 - 다시 앞면으로 돌리기
      setIsFlipped(false);
    }
  };

  const resetSession = () => {
    localStorage.removeItem('ice_breaking_session_id');
    localStorage.removeItem('ice_breaking_drawn');
    setSessionId('');
    setDrawnQuestions([]);
    setCurrentQuestion(null);
    setIsFlipped(false);
    
    // 새로운 세션 생성
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    localStorage.setItem('ice_breaking_session_id', newSessionId);
  };

  return (
    <>
      <Head>
        <title>아이스브레이킹 카드 | HUB Worship</title>
        <meta name="description" content="교회 모임을 위한 아이스브레이킹 질문 카드 뽑기" />
      </Head>
      
      <Container>
        <Title>아이스브레이킹 카드</Title>
        <Subtitle>카드를 터치하면 랜덤한 질문이 나타납니다</Subtitle>

        <CardWrapper>
          <Card 
            isFlipped={isFlipped}
            isClickable={!isLoading}
            onClick={handleCardClick}
          >
            <CardFront>
              <CardIcon>?</CardIcon>
              <CardText>카드를 터치하세요!</CardText>
            </CardFront>
            <CardBack>
              {isLoading ? (
                <>
                  <div></div>
                  <CardText>질문을 가져오는 중...</CardText>
                  <div></div>
                </>
              ) : error ? (
                <>
                  <div></div>
                  <CardText style={{ color: '#fee' }}>{error}</CardText>
                  <div></div>
                </>
              ) : currentQuestion ? (
                <>
                  <div></div>
                  <QuestionText>
                    {currentQuestion.question}
                  </QuestionText>
                  <CardHint>
                    카드를 다시 터치하면 새로운 질문을 뽑을 수 있습니다
                  </CardHint>
                </>
              ) : (
                <>
                  <div></div>
                  <CardText>질문을 가져오는 중...</CardText>
                  <div></div>
                </>
              )}
            </CardBack>
          </Card>
        </CardWrapper>

        {drawnQuestions.length > 0 && (
          <SpinAgainButton onClick={resetSession}>
            세션 초기화 ({drawnQuestions.length}개 뽑음)
          </SpinAgainButton>
        )}
      </Container>

      <Footer />
    </>
  );
};

export default IceBreakingPage;

