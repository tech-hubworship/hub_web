"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styled from '@emotion/styled';

interface Registration {
  id: string;
  name: string;
  group_name: string;
  departure_slot: string;
  return_slot: string;
  elective_lecture: string;
  intercessor_team: string;
  volunteer_team: string;
  deposit_confirm: boolean;
  room_number: string | null;
  room_note: string | null;
}

export default function MyInfoPage() {
  const router = useRouter();
  const { status } = useSession();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/hub_up/myinfo');
      return;
    }
    if (status !== 'authenticated') return;

    fetch('/api/hub-up/myinfo')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setRegistration(data.registration);
        setContactPhone(data.contactPhone || '');
      })
      .catch(() => setError('정보를 불러오는 중 오류가 발생했습니다.'))
      .finally(() => setLoading(false));
  }, [status, router]);

  if (status === 'loading' || loading) {
    return <LoadingText>정보를 불러오는 중입니다...</LoadingText>;
  }

  if (error) {
    return <LoadingText style={{ color: '#d93025' }}>{error}</LoadingText>;
  }

  if (!registration) {
    return (
      <Container>
        <Card>
          <EmptyState>
            <EmptyIcon>📋</EmptyIcon>
            <EmptyTitle>신청 내역이 없습니다</EmptyTitle>
            <EmptyDesc>아직 허브업 신청을 하지 않으셨습니다.</EmptyDesc>
            <HomeButton onClick={() => router.push('/hub_up/register')}>
              신청하러 가기
            </HomeButton>
          </EmptyState>
        </Card>
      </Container>
    );
  }

  const slotLabel = (slot: string) => {
    if (slot === 'car') return '자차/대중교통';
    return slot.replace('bus-', '');
  };

  return (
    <Container>
      <Card>
        <SuccessHeader>
          <CheckCircle>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </CheckCircle>
          <Title>신청이 완료되었습니다</Title>
          <SubTitle>아래에서 신청된 내역을 확인해주세요.</SubTitle>
        </SuccessHeader>

        <InfoBox>
          <InfoList>
            <InfoItem>
              <InfoLabel>이름</InfoLabel>
              <Value>{registration.name}</Value>
            </InfoItem>
            <InfoItem>
              <InfoLabel>소속 그룹</InfoLabel>
              <Value>{registration.group_name}</Value>
            </InfoItem>
            <InfoItem>
              <InfoLabel>선택강의</InfoLabel>
              <Value>{registration.elective_lecture}</Value>
            </InfoItem>
            <InfoItem>
              <InfoLabel>중보팀</InfoLabel>
              <Value>{registration.intercessor_team}</Value>
            </InfoItem>
            <InfoItem>
              <InfoLabel>자원봉사</InfoLabel>
              <Value>{registration.volunteer_team}</Value>
            </InfoItem>
            <InfoItem>
              <InfoLabel>입금 확인</InfoLabel>
              <Value style={{ color: registration.deposit_confirm ? '#278f5a' : '#d93025' }}>
                {registration.deposit_confirm ? '완료' : '미확인'}
              </Value>
            </InfoItem>
          </InfoList>
        </InfoBox>

        {registration.room_number && (
          <HighlightBox>
            <InfoLabel style={{ color: '#1e7046' }}>배정된 숙소</InfoLabel>
            <HighlightValue>{registration.room_number}</HighlightValue>
            {registration.room_note && (
              <RoomNote>{registration.room_note}</RoomNote>
            )}
          </HighlightBox>
        )}

        <InfoBox>
          <InfoList>
            <InfoItem>
              <InfoLabel>출발 버스</InfoLabel>
              <Value>{slotLabel(registration.departure_slot)}</Value>
            </InfoItem>
            <InfoItem>
              <InfoLabel>복귀 버스</InfoLabel>
              <Value>{slotLabel(registration.return_slot)}</Value>
            </InfoItem>
          </InfoList>
        </InfoBox>

        <ButtonGroup>
          <ChangeButton onClick={() => {
              window.location.href = '/api/hub-up/bus-change-token';
            }}>
            버스 시간 변경 문의하기
          </ChangeButton>
          <HomeButton onClick={() => router.push('/hub_up')}>
            홈으로 돌아가기
          </HomeButton>
        </ButtonGroup>
      </Card>
    </Container>
  );
}

const LoadingText = styled.div`
  color: #5f6368; font-size: 15px; padding: 40px; text-align: center;
`;
const Container = styled.div`
  width: 100%; display: flex; justify-content: center; padding-top: 16px;
`;
const Card = styled.div`
  background: white; border-radius: 16px; padding: 40px 24px;
  width: 100%; box-shadow: 0 8px 24px rgba(0,0,0,0.06);
`;
const SuccessHeader = styled.div`
  display: flex; flex-direction: column; align-items: center; margin-bottom: 32px;
`;
const CheckCircle = styled.div`
  width: 56px; height: 56px; border-radius: 50%; background: #e6f4ea;
  color: #278f5a; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
`;
const Title = styled.h2`
  text-align: center; color: #202124; margin: 0 0 8px 0;
  font-weight: 700; font-size: 22px; letter-spacing: -0.5px;
`;
const SubTitle = styled.p`color: #5f6368; font-size: 15px; margin: 0;`;
const InfoBox = styled.div`
  background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 16px;
`;
const InfoList = styled.div`display: flex; flex-direction: column; gap: 16px;`;
const InfoItem = styled.div`display: flex; justify-content: space-between; align-items: center;`;
const InfoLabel = styled.div`color: #5f6368; font-size: 14px; font-weight: 500;`;
const Value = styled.div`color: #202124; font-size: 15px; font-weight: 600; text-align: right;`;
const HighlightBox = styled.div`
  background: rgba(39, 143, 90, 0.08); border: 1px solid rgba(39, 143, 90, 0.2);
  border-radius: 12px; padding: 24px 20px; margin-bottom: 16px;
`;
const HighlightValue = styled.div`
  color: #278f5a; font-size: 22px; font-weight: 800; text-align: right;
`;
const RoomNote = styled.div`
  color: #5f6368; font-size: 13px; margin-top: 8px; text-align: right;
`;
const ButtonGroup = styled.div`display: flex; flex-direction: column; gap: 12px; margin-top: 32px;`;
const ChangeButton = styled.button`
  width: 100%; padding: 16px; border-radius: 10px; border: 1px solid #dadce0;
  background: white; color: #3c4043; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  &:hover { background: #f8f9fa; border-color: #bdc1c6; }
`;
const HomeButton = styled.button`
  width: 100%; padding: 16px; border-radius: 10px; border: none; background: #278f5a;
  color: white; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(39, 143, 90, 0.2);
  &:hover { background: #1e7046; transform: translateY(-1px); box-shadow: 0 6px 12px rgba(39, 143, 90, 0.3); }
`;
const EmptyState = styled.div`
  display: flex; flex-direction: column; align-items: center; padding: 40px 0; text-align: center;
`;
const EmptyIcon = styled.div`font-size: 48px; margin-bottom: 16px;`;
const EmptyTitle = styled.h3`font-size: 18px; font-weight: 700; color: #202124; margin: 0 0 8px 0;`;
const EmptyDesc = styled.p`font-size: 14px; color: #5f6368; margin: 0 0 24px 0;`;
