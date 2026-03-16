"use client";

import React, { useState } from "react";
import styled from "@emotion/styled";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Header } from "@src/components/Header";
import { supabase } from "@src/lib/supabase";

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

/* Q&A: 보라 계열 배경 + 흰색 말풍선/메시지 아이콘 */
const QA_ICON_PURPLE = "#6366f1";

const QAIconLayout = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10%;
`;

function QAIconContent() {
  return (
    <QAIconLayout>
      <svg
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", maxWidth: 44, maxHeight: 44 }}
        aria-hidden
      >
        {/* 말풍선 */}
        <path
          d="M28 8C16 8 8 16 8 26c0 6 4 10 8 14v8l8-6c2 0 4 0 6-1 12 0 20-8 20-18S40 8 28 8z"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </QAIconLayout>
  );
}

const QAIconImage = styled(motion.div)`
  width: ${APP_ICON_SIZE};
  height: ${APP_ICON_SIZE};
  min-width: 48px;
  min-height: 48px;
  background: ${QA_ICON_PURPLE};
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
`;

/* 허브업: 허브 그린 배경 + 흰색 텐트 아이콘 */
const HUBUP_GREEN = "#278f5a";

const HubUpIconLayout = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10%;
`;

function HubUpIconContent() {
  return (
    <HubUpIconLayout>
      <svg
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", maxWidth: 44, maxHeight: 44 }}
        aria-hidden
      >
        {/* Tent / camp shape */}
        <path d="M4 44L28 8L52 44H4Z" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
        <path d="M28 44V28" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M21 44V38C21 34.686 24.134 32 28 32C31.866 32 35 34.686 35 38V44" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </HubUpIconLayout>
  );
}

const HubUpIconImage = styled(motion.div)`
  width: ${APP_ICON_SIZE};
  height: ${APP_ICON_SIZE};
  min-width: 48px;
  min-height: 48px;
  background: ${HUBUP_GREEN};
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(39, 143, 90, 0.4);
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

/* 우리 다락방: 핑크/레드 그라데이션 + 하트/새싹 아이콘 등 */
const MyDarakbangIconLayout = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12%;
`;

function MyDarakbangIconContent() {
  return (
    <MyDarakbangIconLayout>
      <svg
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", maxWidth: 46, maxHeight: 46 }}
        aria-hidden
      >
        <path d="M28 50C28 50 10 36 10 22C10 14.5 16.5 8 24 8C26 8 28 8.8 28 8.8C28 8.8 30 8 32 8C39.5 8 46 14.5 46 22C46 36 28 50 28 50Z"
          fill="#ffffff" />
        <path d="M28 34C28 34 18 25 18 16.5C18 13.5 20.5 11 23.5 11C25 11 26.5 11.5 28 13C29.5 11.5 31 11 32.5 11C35.5 11 38 13.5 38 16.5C38 25 28 34 28 34Z"
          fill="#ff4b6e" />
      </svg>
    </MyDarakbangIconLayout>
  );
}

const MyDarakbangIconImage = styled(motion.div)`
  width: ${APP_ICON_SIZE};
  height: ${APP_ICON_SIZE};
  min-width: 48px;
  min-height: 48px;
  background: linear-gradient(135deg, #ff4b6e 0%, #ff8fa3 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(255, 75, 110, 0.3);
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
`;

const LoadingOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 75, 110, 0.2);
  border-radius: 50%;
  border-top-color: #ff4b6e;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default function AppsClientPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [hoveredApp, setHoveredApp] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  // 새가족 그룹(group_id=5)인 경우에만 '우리 다락방' 아이콘 노출
  const [isDarakbangUser, setIsDarakbangUser] = useState<boolean | null>(null);
  // 허브업 당일(2026-05-24) 이후에만 아이콘 활성화
  const [isHubUpActive, setIsHubUpActive] = useState(false);

  React.useEffect(() => {
    const eventDate = new Date('2026-05-24T00:00:00+09:00');
    setIsHubUpActive(new Date() >= eventDate);
  }, []);

  React.useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(result => {
          setIsDarakbangUser(
            result?.name === '김수진' ||
            (result?.group_id === 5 &&
              (result?.responsible_cell_id !== null || result?.responsible_group_id !== null || result?.is_sunjang === true))
          );
        })
        .catch(() => setIsDarakbangUser(false));
    }
  }, [sessionStatus]);

  const handleAppClick = (path: string) => {
    router.push(path);
  };

  const handleMyDarakbangClick = async () => {
    setIsRedirecting(true);
    try {
      if (sessionStatus === "loading") {
        // Wait for session to load implicitly by user trying again later if needed
        setIsRedirecting(false);
        return;
      }

      if (!session || !session.user || !session.user.id) {
        alert("로그인이 필요합니다.");
        setIsRedirecting(false);
        router.push("/login?redirect=/apps");
        return;
      }

      // 프로필 API 호출
      const res = await fetch("/api/user/profile");
      const result = await res.json();

      if (!res.ok || !result) {
        alert("원활한 서비스 이용을 위해 소속 다락방 정보가 필요합니다. 다시 로그인해주세요.");
        setIsRedirecting(false);
        return;
      }

      const { group_id, cell_id, group_name, cell_name, name } = result;

      if (name === '김수진') {
        router.push('/apps/새가족/새본');
        return;
      }

      if (!group_name || !cell_name || group_id === 7 || cell_id === 26 || cell_id === 99) {
        alert("현재 소속된 다락방이 없습니다.");
        setIsRedirecting(false);
        return;
      }

      router.push(`/apps/${encodeURIComponent(group_name)}/${encodeURIComponent(cell_name)}`);
    } catch (err) {
      console.error(err);
      alert("다락방 접속 중 문제가 발생했습니다.");
      setIsRedirecting(false);
    }
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
            {/* 허브업 아이콘 — 5/24 이후 활성화 */}
            {isHubUpActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                <AppIcon
                  onClick={() => handleAppClick("/hub_up")}
                  onMouseEnter={() => setHoveredApp(-2)}
                  onMouseLeave={() => setHoveredApp(null)}
                >
                  <HubUpIconImage
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HubUpIconContent />
                  </HubUpIconImage>
                  <AppLabel>허브업</AppLabel>
                </AppIcon>
              </motion.div>
            )}

            {/* 우리 다락방 먼저 배치 - 새가족 그룹(group_id=5)에만 표시 */}
            {isDarakbangUser === true && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <AppIcon
                  onClick={handleMyDarakbangClick}
                  onMouseEnter={() => setHoveredApp(-1)}
                  onMouseLeave={() => setHoveredApp(null)}
                >
                  <MyDarakbangIconImage
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MyDarakbangIconContent />
                  </MyDarakbangIconImage>
                  <AppLabel>우리 다락방</AppLabel>
                </AppIcon>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
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

            <motion.div
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
            </motion.div>

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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.3 }}
            >
              <AppIcon
                onClick={() => handleAppClick("/apps/qa")}
                onMouseEnter={() => setHoveredApp(5)}
                onMouseLeave={() => setHoveredApp(null)}
              >
                <QAIconImage
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <QAIconContent />
                </QAIconImage>
                <AppLabel>Q&A</AppLabel>
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

      <AnimatePresence>
        {isRedirecting && (
          <LoadingOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Spinner />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ marginTop: 16, fontSize: 15, fontWeight: 600, color: "#ff4b6e" }}
            >
              우리 다락방으로 이동 중...🌸
            </motion.p>
          </LoadingOverlay>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}

