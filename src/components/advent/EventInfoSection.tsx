import React from 'react';
import styled from '@emotion/styled';

const SectionCard = styled.div`
  background: #000000;
  padding: 40px 40px;
  color: #ffffff;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);

  @media (max-width: 1024px) {
    padding: 32px 32px;
  }

  @media (max-width: 768px) {
    padding: 24px 24px;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const CandleIcon = styled.div`
  width: 46px;
  height: 45px;
  margin-bottom: 8px;

  img {
    width: 100%;
    height: 100%;
  }
`;

const EventTitle = styled.h2`
  font-size: 28px;
  font-weight: 800;
  color: #CEB2FF;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const DateText = styled.p`
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const DescriptionText = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  line-height: 1.8;
  white-space: pre-line;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const GiftText = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: #CEB2FF;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const NoticeText = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: #B5B5B5;
  margin: 0;
  line-height: 1.8;
  white-space: pre-line;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

export const EventInfoSection: React.FC = () => {
  return (
    <SectionCard>
      <ContentWrapper>
        <CandleIcon>
          <img src="/icons/candle.svg" alt="candle icon" />
        </CandleIcon>

        <EventTitle>허브 공동체 대림절 이벤트</EventTitle>

        <DateText>2025.11.30 - 2025.12.25</DateText>

        <DescriptionText>
          {`대림절 기간 동안 웹사이트에 올라오는 영상을 시청 후,
짧은 묵상을 올린 뒤, 출석까지 완료해주세요.`}
        </DescriptionText>

        <GiftText>매일 묵상+출석을 올려주신 분들께 선물을 드립니다 :)</GiftText>

        <NoticeText>
          {`*1일차부터 이벤트 참여가 시작됩니다.
*묵상을 올리시면 '출석하기' 버튼이 나옵니다.
*이 버튼까지 꼭 눌러주셔야 출석이 인정됩니다.`}
        </NoticeText>
      </ContentWrapper>
    </SectionCard>
  );
};

