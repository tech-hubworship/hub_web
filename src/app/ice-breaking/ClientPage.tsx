"use client";

import React, { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";

const Footer = dynamic(() => import("@src/components/Footer"), { ssr: true });

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(160deg, #f7f8fb 0%, #eff2f8 50%, #e0e7ff 100%);
  padding: 44px 20px 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  overflow-x: hidden;
`;

const Title = styled.h1`
  font-size: 38px;
  font-weight: 800;
  color: #1f2a5c;
  text-align: center;
  margin-bottom: 8px;
  letter-spacing: -0.01em;

  @media (max-width: 768px) {
    font-size: 26px;
  }
`;

const Subtitle = styled.p`
  font-size: 17px;
  color: rgba(31, 42, 92, 0.7);
  text-align: center;
  margin-bottom: 30px;
  max-width: 460px;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 22px;
  }
`;

const CardWrapper = styled.div`
  position: relative;
  perspective: 1000px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  z-index: 1;

  @media (max-width: 600px) {
    padding: 0 6px;
  }
`;

const GuideButtonContainer = styled.div`
  width: 100%;
  max-width: 500px;
  display: flex;
  justify-content: flex-end;
  margin: 0 auto 16px;
  padding: 0 12px;

  @media (max-width: 600px) {
    max-width: 100%;
    padding: 0 6px;
  }
`;

const CardBase = styled.div<{ $isClickable: boolean }>`
  width: 100%;
  aspect-ratio: 1 / 1.45;
  max-height: 560px;
  position: relative;
  transform-style: preserve-3d;
  cursor: ${(props) => (props.$isClickable ? "pointer" : "default")};
  pointer-events: ${(props) => (props.$isClickable ? "auto" : "none")};
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(28, 64, 152, 0.12);
  will-change: transform;
`;

const Card = motion(CardBase);

const CardFront = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 48px;
  pointer-events: none;
  background: linear-gradient(140deg, #0066ff 0%, #388bff 50%, #74b0ff 100%);
  color: #ffffff;
`;

const CardBack = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  pointer-events: none;
  text-align: center;
  background: #ffffff;
  color: #1f2a5c;
  transform: rotateY(180deg);
  box-shadow: inset 0 0 0 1px rgba(31, 42, 92, 0.06);
`;

const CardContent = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  text-align: center;
`;

const CardFrontContent = styled(CardContent)`
  padding-top: 44px;

  @media (max-width: 768px) {
    padding-top: 32px;
    gap: 18px;
  }
`;

const CardFooter = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding-top: 16px;
`;

const CardFooterText = styled.p<{ $tone?: "light" | "dark" }>`
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: ${(props) =>
    props.$tone === "light"
      ? "rgba(255, 255, 255, 0.78)"
      : "rgba(31, 42, 92, 0.65)"};
  margin: 0;
  padding: 0 12px 4px;
  line-height: 1.5;
  text-align: center;
`;

const CardIcon = styled(motion.div)`
  font-size: 84px;
  font-weight: 700;
  line-height: 1;
`;

const CardBadge = styled.span`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

const CardText = styled.div`
  font-size: 26px;
  font-weight: 700;
  text-align: center;
  line-height: 1.6;
`;

const QuestionText = styled.div`
  font-size: 22px;
  font-weight: 600;
  text-align: center;
  line-height: 1.7;
  word-break: keep-all;
  color: #0f1f4a;
`;

const CardLoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const CardLoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 4px solid rgba(0, 102, 255, 0.18);
  border-top-color: #0066ff;
  animation: ${spin} 0.8s linear infinite;
`;

const GuideButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(31, 42, 92, 0.08);
  color: #1f2a5c;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(31, 42, 92, 0.12);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(31, 42, 92, 0.12);
    transform: translateY(-1px);
  }
`;

const CardConnectionOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  overflow: hidden;
  z-index: 3;
`;

const CardConnectionGlow = styled(motion.div)`
  position: absolute;
  inset: -10%;
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 55%),
    radial-gradient(circle at 80% 70%, rgba(116, 176, 255, 0.4) 0%, rgba(116, 176, 255, 0) 60%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 70%);
  mix-blend-mode: screen;
`;

const CardConnectionBeam = styled(motion.div)`
  position: absolute;
  width: 140%;
  height: 140%;
  top: -20%;
  left: -20%;
  border-radius: 40px;
  background: radial-gradient(circle, rgba(0, 102, 255, 0.15) 0%, rgba(0, 102, 255, 0) 70%);
  mix-blend-mode: screen;
`;

const GuideIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #0066ff;
  color: white;
  font-size: 11px;
  font-weight: 700;
`;

const GuideOverlayBase = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(7, 15, 32, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 20;
  overflow-y: auto;

  @media (max-width: 600px) {
    padding: 16px;
    align-items: center;
  }
`;

const GuideOverlay = motion(GuideOverlayBase);

const GuideModalBase = styled.div`
  width: min(480px, 90vw);
  max-height: min(560px, 85vh);
  background: #ffffff;
  border-radius: 28px;
  padding: 28px 30px 28px;
  box-shadow: 0 32px 72px rgba(15, 31, 74, 0.18);
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
  min-height: 0;

  @media (max-width: 600px) {
    width: min(360px, calc(100% - 48px));
    max-height: 76vh;
    margin: 22px auto;
    border-radius: 18px;
    padding: 16px 16px 18px;
    gap: 12px;
  }
`;

const GuideModal = motion(GuideModalBase);

const GuideHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

const GuideTitle = styled.h2`
  font-size: 24px;
  font-weight: 800;
  color: #0f1f4a;
  margin: 0;

  @media (max-width: 600px) {
    font-size: 20px;
  }
`;

const GuideList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 16px 8px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;

  @media (max-width: 600px) {
    gap: 16px;
    padding: 14px 4px 20px;
  }
`;

const GuideContentArea = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  &::before,
  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    height: 24px;
    pointer-events: none;
    z-index: 1;
  }

  &::before {
    top: 0;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 1) 0%,
      rgba(255, 255, 255, 0) 70%
    );
  }

  &::after {
    bottom: 0;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 1) 70%
    );
  }
`;

const GuideFooter = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
`;

const GuideItem = styled.li`
  display: flex;
  gap: 16px;
  align-items: flex-start;

  @media (max-width: 600px) {
    gap: 12px;
  }
`;

const GuideBadge = styled.span`
  min-width: 28px;
  height: 28px;
  border-radius: 12px;
  background: rgba(0, 102, 255, 0.1);
  color: #0066ff;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;

  @media (max-width: 600px) {
    min-width: 24px;
    height: 24px;
    font-size: 12px;
  }
`;

const GuideContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const GuideHighlight = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: #0f1f4a;
  margin: 0;

  @media (max-width: 600px) {
    font-size: 15px;
  }
`;

const GuideDescription = styled.p`
  font-size: 15px;
  color: rgba(15, 31, 74, 0.7);
  margin: 0;
  line-height: 1.55;

  @media (max-width: 600px) {
    font-size: 13px;
    line-height: 1.55;
  }
`;

const CloseGuideButton = styled.button`
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #0f1f4a;
  background: rgba(15, 31, 74, 0.08);
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background: rgba(15, 31, 74, 0.12);
    transform: translateY(-1px);
  }

  @media (max-width: 600px) {
    font-size: 13px;
    padding: 9px 16px;
  }
`;

const SpinAgainButton = styled.button`
  margin-top: 36px;
  padding: 16px 32px;
  background: #0f1f4a;
  border: none;
  border-radius: 20px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: -0.01em;

  &:hover {
    background: #152b5e;
    transform: translateY(-2px);
    box-shadow: 0 16px 40px rgba(15, 31, 74, 0.25);
  }

  &:active {
    transform: translateY(0px);
  }

  @media (max-width: 768px) {
    padding: 14px 28px;
    font-size: 15px;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(228, 65, 73, 0.9);
  color: white;
  padding: 18px 24px;
  border-radius: 16px;
  margin: 28px 0 0;
  text-align: center;
  font-size: 15px;
  max-width: 520px;
`;

const GAME_NAME = "허브 커넥트 플레이";

const GUIDE_STEPS = [
  {
    title: "🙏 나눔에 적극적으로 참여하기!",
    description:
      "→ 오늘은 “서로를 알아가는 시간”이에요.\n적극적일수록 더 즐겁고 은혜도 깊어집니다☺️",
  },
  {
    title: "카드 하나 뽑아보자!",
    description: "→ 돌아가며 랜덤 카드를 클릭해서 열어주세요👉",
  },
  {
    title: "질문은 반드시 ‘다른 사람에게’ 지목해서!",
    description:
      "→ 이때, 이름을 불러서 지목하는 게 룰이에요!\n→ “현교님, 이 질문에 대답해주세요~”",
  },
  {
    title: "📛 이름을 못 부르면 본인이 대답!",
    description: "→ 오늘 안에 서로 이름 외우기 필수 💡",
  },
  {
    title: "⏱️ 답변 시간은 30초~1분!",
    description:
      "→ 시간 안에 못 끝내면? → 순 단톡방에 꼭 답변 말해주기❗️",
  },
  {
    title: "💥 당황하면? “한 번 더 뒤집기” 찬스!",
    description:
      "→ 질문 바꾼다고 피할 순 없지만, 웃음은 일단 지켜드림 😆",
  },
  {
    title: "🎁 마무리는 은혜와 감사 타임으로",
    description:
      "→ “오늘 가장 마음에 남았던 나눔은?” 한 줄씩 나누며 마칩니다🙏",
  },
];

interface Question {
  id: number;
  question: string;
}

export default function ClientPage() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [drawnQuestions, setDrawnQuestions] = useState<number[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const storedSessionId = localStorage.getItem("ice_breaking_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
      const storedDrawn = localStorage.getItem("ice_breaking_drawn");
      if (storedDrawn) {
        setDrawnQuestions(JSON.parse(storedDrawn));
      }
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      setSessionId(newSessionId);
      localStorage.setItem("ice_breaking_session_id", newSessionId);
    }
  }, []);

  useEffect(() => {
    if (!showGuide) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowGuide(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showGuide]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const { style } = document.body;
    const previousOverflow = style.overflow;

    if (showGuide) {
      style.overflow = "hidden";
    }

    return () => {
      style.overflow = previousOverflow;
    };
  }, [showGuide]);

  useEffect(() => {
    return () => {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }
    };
  }, []);

  const handleCardClick = async () => {
    if (isLoading || isConnecting) return;

    if (!isFlipped) {
      setError(null);
      setIsLoading(true);
      setIsConnecting(true);

      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }

      try {
        const response = await fetch("/api/ice-breaking/draw", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            drawnQuestions,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "질문을 가져오는데 실패했습니다.");
        }

        if (data.question) {
          setCurrentQuestion(data.question);
          setDrawnQuestions([...drawnQuestions, data.question.id]);
          localStorage.setItem(
            "ice_breaking_drawn",
            JSON.stringify([...drawnQuestions, data.question.id])
          );
          setIsLoading(false);
          setIsFlipped(true);

          connectTimeoutRef.current = setTimeout(() => {
            setIsConnecting(false);
            connectTimeoutRef.current = null;
          }, 320);
        } else {
          throw new Error("더 이상 뽑을 질문이 없습니다!");
        }
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
        setIsConnecting(false);
      }
    } else {
      setIsFlipped(false);
      setIsConnecting(false);

      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
    }
  };

  const resetSession = () => {
    localStorage.removeItem("ice_breaking_session_id");
    localStorage.removeItem("ice_breaking_drawn");
    setSessionId("");
    setDrawnQuestions([]);
    setCurrentQuestion(null);
    setIsFlipped(false);
    setIsConnecting(false);

    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }

    const newSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setSessionId(newSessionId);
    localStorage.setItem("ice_breaking_session_id", newSessionId);
  };

  const backFooterText = isLoading
    ? "조금만 기다리면 새로운 질문이 펼쳐집니다"
    : error
      ? "다시 시도하거나 카드 초기화 후 이용해보세요"
      : currentQuestion
        ? "카드를 다시 터치하면 다음 질문을 만날 수 있어요"
        : "첫 질문은 바로 이 자리에서 시작해요";

  return (
    <>
      <Container>
        <Title>{GAME_NAME}</Title>
        <Subtitle>허브 공동체를 더 가깝게 이어주는 랜덤 질문 플레이</Subtitle>

        <GuideButtonContainer>
          <GuideButton
            type="button"
            onClick={() => setShowGuide(true)}
            aria-label="게임 방법 보기"
          >
            <GuideIcon>?</GuideIcon>
            게임 방법 보기
          </GuideButton>
        </GuideButtonContainer>

        <CardWrapper>
          <Card
            $isClickable={!isLoading && !isConnecting}
            onClick={handleCardClick}
            initial={false}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
            whileHover={!isLoading && !isConnecting ? { scale: 1.02 } : undefined}
            whileTap={!isLoading && !isConnecting ? { scale: 0.98 } : undefined}
          >
            <CardFront
              initial={false}
              animate={{ opacity: isFlipped ? 0 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <CardFrontContent>
                <CardBadge>랜덤 커넥션 카드</CardBadge>
                <CardIcon
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  ?
                </CardIcon>
                <CardText>
                  카드를 뒤집어
                  <br />
                  새로운 나눔을 시작해요
                </CardText>
              </CardFrontContent>
              <CardFooter>
                <CardFooterText $tone="light">
                  터치후 살짝 기다리면 카드가 열립니다
                </CardFooterText>
              </CardFooter>
              <AnimatePresence>
                {isConnecting && (
                  <CardConnectionOverlay
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <CardConnectionGlow
                      initial={{ scale: 0.85, opacity: 0.4 }}
                      animate={{ scale: 1.05, opacity: 0.8 }}
                      exit={{ scale: 1.15, opacity: 0 }}
                      transition={{ duration: 0.45 }}
                    />
                    <CardConnectionBeam
                      initial={{ rotate: -8, opacity: 0.25 }}
                      animate={{ rotate: 6, opacity: 0.6 }}
                      exit={{ rotate: 12, opacity: 0 }}
                      transition={{ duration: 0.45 }}
                    />
                  </CardConnectionOverlay>
                )}
              </AnimatePresence>
            </CardFront>
            <CardBack
              initial={false}
              animate={{ opacity: isFlipped ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent>
                {isLoading ? (
                  <CardLoadingState>
                    <CardLoadingSpinner />
                    <CardText>카드를 준비하는 중이에요...</CardText>
                  </CardLoadingState>
                ) : error ? (
                  <CardText style={{ color: "#d92a3d" }}>{error}</CardText>
                ) : currentQuestion ? (
                  <QuestionText>{currentQuestion.question}</QuestionText>
                ) : (
                  <CardText>카드를 뒤집으면 질문이 나타납니다</CardText>
                )}
              </CardContent>
              <CardFooter>
                <CardFooterText>{backFooterText}</CardFooterText>
              </CardFooter>
            </CardBack>
          </Card>
        </CardWrapper>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {drawnQuestions.length > 0 && (
          <SpinAgainButton type="button" onClick={resetSession}>
            카드 초기화 · {drawnQuestions.length}개 공개됨
          </SpinAgainButton>
        )}
      </Container>

      <Footer />

      <AnimatePresence>
        {showGuide && (
          <GuideOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowGuide(false)}
          >
            <GuideModal
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <GuideHeader>
                <GuideTitle>게임 방법</GuideTitle>
              </GuideHeader>
              <GuideContentArea>
                <GuideList>
                  {GUIDE_STEPS.map((step, index) => (
                    <GuideItem key={step.title}>
                      <GuideBadge>{index + 1}</GuideBadge>
                      <GuideContent>
                        <GuideHighlight>{step.title}</GuideHighlight>
                        {step.description.split("\n").map((line) => (
                          <GuideDescription key={line}>{line}</GuideDescription>
                        ))}
                      </GuideContent>
                    </GuideItem>
                  ))}
                </GuideList>
              </GuideContentArea>
              <GuideFooter>
                <CloseGuideButton
                  type="button"
                  onClick={() => setShowGuide(false)}
                >
                  닫기
                </CloseGuideButton>
              </GuideFooter>
            </GuideModal>
          </GuideOverlay>
        )}
      </AnimatePresence>
    </>
  );
}

