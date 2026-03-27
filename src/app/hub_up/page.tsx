"use client";

import React from 'react';
import styled from '@emotion/styled';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function HubUpMainPage() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <Container>
      <HeroSection>
        <EventBadge>2025. 5. 15 – 17</EventBadge>
        <EventTitle>[24 허브업] Companion</EventTitle>
        <EventSubtitle>소망 수양관</EventSubtitle>
      </HeroSection>

      <CardGroup>
        <ActionCard onClick={() => router.push('/hub_up/register')}>
          <CardIcon>📝</CardIcon>
          <CardTitle>참가 신청하기</CardTitle>
          <CardDesc>허브업 Companion 신청서를 작성합니다</CardDesc>
          <CardArrow>→</CardArrow>
        </ActionCard>

        {session && (
          <ActionCard onClick={() => router.push('/hub_up/myinfo')}>
            <CardIcon>✅</CardIcon>
            <CardTitle>내 신청 확인</CardTitle>
            <CardDesc>신청 내역 및 배정 정보를 확인합니다</CardDesc>
            <CardArrow>→</CardArrow>
          </ActionCard>
        )}
      </CardGroup>

      <NoticeCard>
        <NoticeTitle>📅 신청 기간</NoticeTitle>
        <NoticeText>4월 12일 (주일) ~ 4월 26일 (주일) 또는 인원 마감 시 (700명)</NoticeText>
        <Divider />
        <NoticeTitle>💸 회비</NoticeTitle>
        <NoticeText>얼리버드 (4/12~4/18): 80,000원</NoticeText>
        <NoticeText>일반 (4/19~4/26): 85,000원</NoticeText>
        <Divider />
        <NoticeTitle>📞 문의</NoticeTitle>
        <NoticeText>서기MC (010-8284-3283)</NoticeText>
      </NoticeCard>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
`;

const HeroSection = styled.div`
  background: linear-gradient(135deg, #278f5a 0%, #1e7046 100%);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  color: white;
`;

const EventBadge = styled.div`
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 12px;
`;

const EventTitle = styled.h1`
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 6px 0;
  letter-spacing: -0.5px;
`;

const EventSubtitle = styled.p`
  font-size: 14px;
  margin: 0;
  opacity: 0.85;
`;

const CardGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ActionCard = styled.div`
  background: white;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
  &:active {
    transform: translateY(0);
  }
`;

const CardIcon = styled.div`
  font-size: 28px;
  flex-shrink: 0;
`;

const CardTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #202124;
  margin-bottom: 2px;
`;

const CardDesc = styled.div`
  font-size: 13px;
  color: #5f6368;
`;

const CardArrow = styled.div`
  margin-left: auto;
  font-size: 18px;
  color: #278f5a;
  font-weight: 600;
`;

const NoticeCard = styled.div`
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const NoticeTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #278f5a;
  margin-bottom: 6px;
`;

const NoticeText = styled.div`
  font-size: 14px;
  color: #3c4043;
  line-height: 1.6;
`;

const Divider = styled.div`
  height: 1px;
  background: #f1f3f4;
  margin: 14px 0;
`;
