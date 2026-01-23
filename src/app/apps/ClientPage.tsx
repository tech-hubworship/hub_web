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
  gap: 24px;
  padding: 0 24px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    padding: 0 20px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
`;

const AppIcon = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
`;

const AppIconImage = styled(motion.div)`
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #3182f6 0%, #1e5fff 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(49, 130, 246, 0.2);
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 64px;
    height: 64px;
    border-radius: 18px;
  }

  @media (max-width: 480px) {
    width: 56px;
    height: 56px;
    border-radius: 16px;
  }
`;

const CardIcon = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const CardIconInner = styled.div`
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
    content: "";
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    width: 50%;
    height: 4px;
    background: linear-gradient(135deg, #3182f6 0%, #1e5fff 100%);
    border-radius: 2px;
  }

  &::after {
    content: "?";
    font-size: 20px;
    font-weight: 700;
    color: #3182f6;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin-top: 8px;
  }

  @media (max-width: 768px) {
    &::after {
      font-size: 18px;
      margin-top: 6px;
    }
  }

  @media (max-width: 480px) {
    &::after {
      font-size: 16px;
      margin-top: 5px;
    }
  }
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

const PrayerIconInner = styled.div`
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
    content: "✝";
    font-size: 24px;
    color: #8b4513;
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

const PrayerIconImage = styled(motion.div)`
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #8b4513 0%, #a0522d 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.2);
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 64px;
    height: 64px;
    border-radius: 18px;
  }

  @media (max-width: 480px) {
    width: 56px;
    height: 56px;
    border-radius: 16px;
  }
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
                <AppIconImage
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardIcon>
                    <CardIconInner />
                  </CardIcon>
                </AppIconImage>
                <AppLabel>
                  랜덤
                  <br />
                  커넥션 카드
                </AppLabel>
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
                  <CardIcon>
                    <PrayerIconInner />
                  </CardIcon>
                </PrayerIconImage>
                <AppLabel>
                  기도
                  <br />
                  시간
                </AppLabel>
              </AppIcon>
            </motion.div>
          </AppsGrid>
        </AppScreen>
      </Container>

      <Footer />
    </>
  );
}

