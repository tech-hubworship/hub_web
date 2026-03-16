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
      <SuccessHeader>
        <CheckCircle>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </CheckCircle>
        <Title>신청이 완료되었습니다</Title>
        <SubTitle>아래에서 신청된 내역을 확인해주세요.</SubTitle>
      </SuccessHeader>

      <InfoBox>
        <InfoList>
          <InfoItem>
            <Label>이름</Label>
            <Value>{name}</Value>
          </InfoItem>
          <InfoItem>
            <Label>소속 그룹</Label>
            <Value>{group}</Value>
          </InfoItem>
        </InfoList>
      </InfoBox>

      <HighlightBox>
        <Label style={{ color: '#1e7046' }}>배정된 숙소</Label>
        <HighlightValue>{roomNumber}</HighlightValue>
      </HighlightBox>

      <InfoBox>
        <InfoList>
          <InfoItem>
            <Label>출발 버스</Label>
            <Value>{departureTime}</Value>
          </InfoItem>
          <InfoItem>
            <Label>복귀 버스</Label>
            <Value>{returnTime}</Value>
          </InfoItem>
        </InfoList>
      </InfoBox>

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
      <Suspense fallback={<LoadingText>결과를 불러오는 중입니다...</LoadingText>}>
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
  padding-top: 16px;
`;

const LoadingText = styled.div`
  color: #5f6368;
  font-size: 15px;
  padding: 40px;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 40px 24px;
  width: 100%;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
`;

const SuccessHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
`;

const CheckCircle = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #e6f4ea;
  color: #278f5a;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

const Title = styled.h2`
  text-align: center;
  color: #202124;
  margin: 0 0 8px 0;
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -0.5px;
`;

const SubTitle = styled.p`
  color: #5f6368;
  font-size: 15px;
  margin: 0;
`;

const InfoBox = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
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
  font-size: 14px;
  font-weight: 500;
`;

const Value = styled.div`
  color: #202124;
  font-size: 15px;
  font-weight: 600;
  text-align: right;
`;

const HighlightBox = styled.div`
  background: rgba(39, 143, 90, 0.08);
  border: 1px solid rgba(39, 143, 90, 0.2);
  border-radius: 12px;
  padding: 24px 20px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HighlightValue = styled(Value)`
  color: #278f5a;
  font-size: 22px;
  font-weight: 800;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 32px;
`;

const ChangeButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #dadce0;
  background: white;
  color: #3c4043;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f8f9fa;
    border-color: #bdc1c6;
  }
`;

const HomeButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 10px;
  border: none;
  background: #278f5a;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(39, 143, 90, 0.2);

  &:hover {
    background: #1e7046;
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(39, 143, 90, 0.3);
  }
`;