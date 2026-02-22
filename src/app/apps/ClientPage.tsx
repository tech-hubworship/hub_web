"use client";

import React, { useState } from "react";
import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@src/components/Header";

const Footer = dynamic(() => import("@src/components/Footer"), { ssr: true });

const Container = styled.div`
  min-height: 100vh;
  background: #f5f6fa;
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
`;

const AppScreen = styled(motion.div)`
  width: 100%;
  background: #ffffff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 100px;
`;

const AppHeader = styled.div`
  padding: 100px 24px 20px;
  text-align: left;

  @media (max-width: 768px) {
    padding: 60px 20px 16px;
  }
`;

const AppTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #191f28;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const AppSubtitle = styled.p`
  font-size: 16px;
  color: #8b95a1;
  margin: 0;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const AppsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(12px, 3vw, 24px);
  padding: 0 clamp(12px, 4vw, 24px);
  width: 100%;
`;

const AppIcon = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
`;

/* 앱 아이콘 크기: 항상 4열 유지, 화면에 따라 축소 */
const APP_ICON_SIZE = "clamp(48px, 16vw, 72px)";

/* 커넥션 카드: 앱 카드 앞면과 동일한 파란 배경(#0066ff) + 흰색 카드·물음표 */
const CONNECTION_CARD_BLUE = "#0066ff";

const RandomCardIconLayout = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4%;
`;

function RandomCardIconContent() {
  return (
    <RandomCardIconLayout>
      <svg
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", maxWidth: 52, maxHeight: 52 }}
        aria-hidden
      >
        <rect x="8" y="6" width="40" height="44" rx="5" stroke="#ffffff" strokeWidth="2.5" fill="none" />
        <text x="28" y="32" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="700" fontFamily="system-ui, sans-serif">?</text>
      </svg>
    </RandomCardIconLayout>
  );
}

const RandomCardIconImage = styled(motion.div)`
  width: ${APP_ICON_SIZE};
  height: ${APP_ICON_SIZE};
  min-width: 48px;
  min-height: 48px;
  background: ${CONNECTION_CARD_BLUE};
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 102, 255, 0.35);
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
`;

const CardIcon = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const AppLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #191f28;
  text-align: center;
  line-height: 1.3;
  word-break: keep-all;

  @media (max-width: 768px) {
    font-size: 12px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

/* 기도시간 앱 아이콘: 다크 배경 + 흰색 십자가 아이콘 */
const PrayerIconLayout = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14%;
`;

function PrayerIconContent() {
  return (
    <PrayerIconLayout>
      <svg
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", maxWidth: 40, maxHeight: 40 }}
        aria-hidden
      >
        {/* 라틴 십자가: 세로 막대 + 가로 막대(위쪽 1/3) */}
        <path d="M28 2v52M14 18h28" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </PrayerIconLayout>
  );
}

const PrayerIconImage = styled(motion.div)`
  width: ${APP_ICON_SIZE};
  height: ${APP_ICON_SIZE};
  min-width: 48px;
  min-height: 48px;
  background: #121212;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
`;

/* 용어사전: 네이버 느낌 그린 배경 + 두꺼운 흰색 돋보기 */
const GLOSSARY_NAVER_GREEN = "#03C75A";

const GlossaryIconLayout = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6%;
`;

function GlossaryIconContent() {
  return (
    <GlossaryIconLayout>
      <svg
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", maxWidth: 52, maxHeight: 52 }}
        aria-hidden
      >
        {/* 원: 더 크게, 손잡이는 원 가장자리에서 시작 (45° 방향) */}
        <circle cx="26" cy="26" r="18" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <path d="M38.7 38.7L50 50" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </GlossaryIconLayout>
  );
}

const GlossaryIconImage = styled(motion.div)`
  width: ${APP_ICON_SIZE};
  height: ${APP_ICON_SIZE};
  min-width: 48px;
  min-height: 48px;
  background: ${GLOSSARY_NAVER_GREEN};
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(3, 199, 90, 0.25);
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
`;

const DAY_NAMES_KO = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

/* 아이폰 캘린더 아이콘: 하나의 둥근 사각형, 위쪽 요일 띠 + 아래 큰 날짜 */
const CalendarIconLayout = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
  overflow: hidden;
  border-radius: inherit;
`;

const CalendarIconStrip = styled.div`
  flex-shrink: 0;
  margin-top: 6px;
  padding: 0;
  margin-bottom: -4px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #191f28;
  letter-spacing: -0.02em;
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 11px;
    margin-top: 5px;
    margin-bottom: -3px;
  }

  @media (max-width: 480px) {
    font-size: 10px;
    margin-top: 4px;
    margin-bottom: -2px;
  }
`;

const CalendarIconDate = styled.span`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: 600;
  color: #191f28;
  line-height: 1;
  margin-top: -2px;

  @media (max-width: 768px) {
    font-size: 34px;
  }

  @media (max-width: 480px) {
    font-size: 28px;
  }
`;

function CalendarIconContent() {
  const [today, setToday] = React.useState<{
    dayName: string;
    date: number;
  } | null>(null);
  React.useEffect(() => {
    const d = new Date();
    setToday({
      dayName: DAY_NAMES_KO[d.getDay()],
      date: d.getDate(),
    });
  }, []);
  const dayName = today?.dayName ?? "일요일";
  const date = today?.date ?? 1;
  return (
    <CalendarIconLayout>
      <CalendarIconStrip>{dayName}</CalendarIconStrip>
      <CalendarIconDate>{date}</CalendarIconDate>
    </CalendarIconLayout>
  );
}

const CalendarIconImage = styled(motion.div)`
  width: ${APP_ICON_SIZE};
  height: ${APP_ICON_SIZE};
  min-width: 48px;
  min-height: 48px;
  background: #ffffff;
  border-radius: 16px;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
`;

/* 분실물 찾기: 남색 배경 + 흰색 노트북 가방·물음표, 아이콘 크게 */
const LOST_FOUND_NAVY = "#1e3a5f";

const LostFoundIconLayout = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2%;
`;

function LostFoundIconContent() {
  return (
    <LostFoundIconLayout>
      <svg
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", maxWidth: 68, maxHeight: 68 }}
        aria-hidden
      >
        {/* 노트북 가방: 흰색 */}
        <rect x="12" y="18" width="32" height="28" rx="2" stroke="#ffffff" strokeWidth="2.5" fill="none" />
        <path d="M18 18v-4a2 2 0 012-2h16a2 2 0 012 2v4" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M20 14h16" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        {/* 물음표: 흰색 원 + ? */}
        <circle cx="28" cy="32" r="9" fill="none" stroke="#ffffff" strokeWidth="2.5" />
        <text x="28" y="37" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="700" fontFamily="system-ui, sans-serif">?</text>
      </svg>
    </LostFoundIconLayout>
  );
}

const LostFoundIconImage = styled(motion.div)`
  width: ${APP_ICON_SIZE};
  height: ${APP_ICON_SIZE};
  min-width: 48px;
  min-height: 48px;
  background: ${LOST_FOUND_NAVY};
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.35);
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
`;

const RestaurantIconInner = styled.div`
  width: 80%;
  height: 80%;
  background: #ffffff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &::before {
    content: "🗺️";
    font-size: 24px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  @media (max-width: 768px) {
    &::before {
      font-size: 20px;
    }
  }

  @media (max-width: 480px) {
    &::before {
      font-size: 18px;
    }
  }
`;

const RestaurantIconImage = styled(motion.div)`
  width: ${APP_ICON_SIZE};
  height: ${APP_ICON_SIZE};
  min-width: 48px;
  min-height: 48px;
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.2);
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
`;

export default function AppsClientPage() {
  const router = useRouter();
  const [hoveredApp, setHoveredApp] = useState<number | null>(null);

  const handleAppClick = (path: string) => {
    router.push(path);
  };

  return (
    <>
      <Header />

      <Container>
        <AppScreen initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <AppHeader>
            <AppTitle>APPS</AppTitle>
            <AppSubtitle>허브 공동체를 더 가깝게 이어주는 앱</AppSubtitle>
          </AppHeader>

          <AppsGrid>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <AppIcon
                onClick={() => handleAppClick("/ice-breaking")}
                onMouseEnter={() => setHoveredApp(0)}
                onMouseLeave={() => setHoveredApp(null)}
              >
                <RandomCardIconImage
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <RandomCardIconContent />
                </RandomCardIconImage>
                <AppLabel>커넥션 카드</AppLabel>
              </AppIcon>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <AppIcon
                onClick={() => handleAppClick("/apps/prayer-time")}
                onMouseEnter={() => setHoveredApp(1)}
                onMouseLeave={() => setHoveredApp(null)}
              >
                <PrayerIconImage
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <PrayerIconContent />
                </PrayerIconImage>
                <AppLabel>기도 시간</AppLabel>
              </AppIcon>
            </motion.div>

            {/* 용어사전 — 비노출 (주석 해제 시 복구) */}
            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <AppIcon
                onClick={() => handleAppClick("/apps/glossary")}
                onMouseEnter={() => setHoveredApp(2)}
                onMouseLeave={() => setHoveredApp(null)}
              >
                <GlossaryIconImage
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlossaryIconContent />
                </GlossaryIconImage>
                <AppLabel>용어사전</AppLabel>
              </AppIcon>
            </motion.div> */}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <AppIcon
                onClick={() => handleAppClick("/apps/calendar")}
                onMouseEnter={() => setHoveredApp(3)}
                onMouseLeave={() => setHoveredApp(null)}
              >
                <CalendarIconImage
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <CalendarIconContent />
                </CalendarIconImage>
                <AppLabel>캘린더</AppLabel>
              </AppIcon>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <AppIcon
                onClick={() => handleAppClick("/apps/lost-found")}
                onMouseEnter={() => setHoveredApp(4)}
                onMouseLeave={() => setHoveredApp(null)}
              >
                <LostFoundIconImage
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <LostFoundIconContent />
                </LostFoundIconImage>
                <AppLabel>분실물 찾기</AppLabel>
              </AppIcon>
            </motion.div>

            {/* 맛집지도 — 비노출 (주석 해제 시 복구) */}
            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              <AppIcon
                onClick={() => handleAppClick("/apps/restaurant")}
                onMouseEnter={() => setHoveredApp(5)}
                onMouseLeave={() => setHoveredApp(null)}
              >
                <RestaurantIconImage
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardIcon>
                    <RestaurantIconInner />
                  </CardIcon>
                </RestaurantIconImage>
                <AppLabel>맛집지도</AppLabel>
              </AppIcon>
            </motion.div> */}
          </AppsGrid>
        </AppScreen>
      </Container>

      <Footer />
    </>
  );
}

