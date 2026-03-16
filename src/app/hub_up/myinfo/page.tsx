"use client";

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styled from '@emotion/styled';

function MyInfoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const name = searchParams?.get('name') || '홍길동';
  const group = searchParams?.get('group') || '새가족-새가족1순';
  const departureTime = searchParams?.get('departureTime') || '자차/대중교통';
  const returnTime = searchParams?.get('returnTime') || '11:30';

  // Mock Logic for Room Assignment based on group
  // Assume if group has "새본", they go to Room 101, else Room 102
  const roomNumber = group.includes('새본') ? '101호' : '102호';

  const handleChangeBusTime = () => {
    const confirmChange = window.confirm(
      '버스 시간은 최대 1번만 변경할 수 있으며, 추가 변경 시 별도의 웹사이트에서 진행해야 합니다. 변경하시겠습니까?'
    );
    if (confirmChange) {
      window.open('https://forms.gle/example-bus-change', '_blank');
    }
  };

  return (
    <Card>
      <Title>내 신청 정보</Title>
      <InfoList>
        <InfoItem>
          <Label>이름</Label>
          <Value>{name}</Value>
        </InfoItem>
        <InfoItem>
          <Label>소속 그룹</Label>
          <Value>{group}</Value>
        </InfoItem>
        <Divider />
        <InfoItem>
          <Label>배정된 숙소</Label>
          <HighlightValue>{roomNumber}</HighlightValue>
        </InfoItem>
        <Divider />
        <InfoItem>
          <Label>출발 버스</Label>
          <Value>{departureTime}</Value>
        </InfoItem>
        <InfoItem>
          <Label>복귀 버스</Label>
          <Value>{returnTime}</Value>
        </InfoItem>
      </InfoList>

      <ButtonGroup>
        <ChangeButton onClick={handleChangeBusTime}>버스 시간 변경하기</ChangeButton>
        <HomeButton onClick={() => router.push('/')}>홈으로 돌아가기</HomeButton>
      </ButtonGroup>
    </Card>
  );
}

export default function MyInfoPage() {
  return (
    <Container>
      <Suspense fallback={<div>Loading...</div>}>
        <MyInfoContent />
      </Suspense>
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px 24px;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const Title = styled.h2`
  text-align: center;
  color: #278f5a;
  margin-top: 0;
  margin-bottom: 24px;
  font-weight: 700;
  font-size: 20px;
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled.div`
  color: #5f6368;
  font-size: 15px;
  font-weight: 500;
`;

const Value = styled.div`
  color: #202124;
  font-size: 16px;
  font-weight: 500;
  text-align: right;
`;

const HighlightValue = styled(Value)`
  color: #278f5a;
  font-size: 20px;
  font-weight: 700;
`;

const Divider = styled.div`
  height: 1px;
  background: #f1f3f4;
  margin: 8px 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 32px;
`;

const ChangeButton = styled.button`
  width: 100%;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid #278f5a;
  background: white;
  color: #278f5a;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(39, 143, 90, 0.05);
  }
`;

const HomeButton = styled.button`
  width: 100%;
  padding: 14px;
  border-radius: 8px;
  border: none;
  background: #278f5a;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1e7046;
  }
`;
