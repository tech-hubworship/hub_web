"use client";

import React from 'react';
import styled from '@emotion/styled';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const PRIMARY = '#F25246';

export default function HubUpMainPage() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <Wrap>
      <TopNav>
        <NavTitle>[허브업] Companion</NavTitle>
      </TopNav>

      {/* 히어로 배너 */}
      <HeroBanner>
        <HeroDate>5월 15일 (금) - 5월 17일 (일)</HeroDate>
        <HeroTitle>Title Title Title</HeroTitle>
        <HeroSub>(메인 메세지)</HeroSub>
        <HeroImageBox>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#BDBDBD">
            <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z"/>
          </svg>
          <span>키비주얼</span>
        </HeroImageBox>
      </HeroBanner>

      {/* 행사 정보 카드 */}
      <InfoCard>
        <InfoGrid>
          <InfoLabel>일정</InfoLabel>
          <InfoData>
            <strong>5월 15일 (금) - 5월 17일 (일)</strong>
            <p>Companion1은 5월 15일, 추후 공지 예정 시간에 시작됩니다.</p>
          </InfoData>

          <InfoLabel>장소</InfoLabel>
          <InfoData>
            <strong>소망 수양관</strong>
            <p>경기도 광주시 곤지암읍 건업길 122-83</p>
          </InfoData>

          <InfoLabel>신청</InfoLabel>
          <InfoData>
            <strong>4월 12일 (일) - 4월 26일 (토)</strong>
            <p>최대 700명 신청 가능</p>
          </InfoData>

          <InfoLabel>회비</InfoLabel>
          <InfoData>
            <FeeGrid>
              <div>
                <strong>얼리버드 8만원</strong>
                <p>4월 12일 - 4월 18일</p>
              </div>
              <div>
                <strong>일반 8만 5천원</strong>
                <p>4월 19일 - 4월 26일</p>
              </div>
            </FeeGrid>
            <p className="account">하나은행 계좌번호 / 예금주</p>
          </InfoData>
        </InfoGrid>
      </InfoCard>

      {/* 액션 버튼들 */}
      <ActionSection>
        <PrimaryBtn onClick={() => router.push('/hub_up/register')}>
          신청서 작성하기
        </PrimaryBtn>

        {session && (
          <SecondaryBtn onClick={() => router.push('/hub_up/myinfo')}>
            내 신청 확인하기
          </SecondaryBtn>
        )}

        {/* 티셔츠 배너 */}
        <TshirtBanner onClick={() => router.push('/hub_up/tshirt')}>
          <TshirtLeft>
            <TshirtLabel>허브업 티셔츠</TshirtLabel>
            <TshirtTitle>지금 구매하기 →</TshirtTitle>
          </TshirtLeft>
          <TshirtEmoji>👕</TshirtEmoji>
        </TshirtBanner>

        {/* FAQ */}
        <OutlineBtn onClick={() => router.push('/hub_up/faq')}>
          자주 묻는 질문 (FAQ)
        </OutlineBtn>
      </ActionSection>
    </Wrap>
  );
}

const Wrap = styled.div`width: 100%; min-height: 100vh; background: #FAFAFA; font-family: -apple-system, sans-serif;`;
const TopNav = styled.div`height: 56px; display: flex; align-items: center; padding: 0 20px; background: #fff;`;
const NavTitle = styled.div`font-size: 17px; font-weight: 700; color: #111;`;
const HeroBanner = styled.div`background: #fff; padding: 32px 20px; text-align: center; border-bottom: 1px solid #F0F0F0;`;
const HeroDate = styled.p`font-size: 13px; color: #888; margin: 0 0 8px 0;`;
const HeroTitle = styled.h1`font-size: 26px; font-weight: 800; color: #111; margin: 0 0 6px 0; letter-spacing: -0.5px;`;
const HeroSub = styled.p`font-size: 16px; color: #444; margin: 0 0 24px 0;`;
const HeroImageBox = styled.div`width: 120px; height: 120px; background: #F0F0F0; border-radius: 16px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #888; font-size: 12px; gap: 6px;`;
const InfoCard = styled.div`background: #fff; margin: 12px 0; padding: 24px 20px;`;
const InfoGrid = styled.div`display: grid; grid-template-columns: 36px 1fr; gap: 20px 12px; align-items: start;`;
const InfoLabel = styled.div`font-size: 13px; font-weight: 700; color: ${PRIMARY}; padding-top: 2px;`;
const InfoData = styled.div`
  font-size: 14px; color: #111; line-height: 1.5;
  strong { display: block; font-weight: 700; margin-bottom: 2px; }
  p { margin: 0; color: #888; font-size: 13px; }
  .account { color: #666; margin-top: 6px; }
`;
const FeeGrid = styled.div`display: flex; gap: 16px; div { flex: 1; }`;
const ActionSection = styled.div`padding: 16px 20px 40px; display: flex; flex-direction: column; gap: 10px;`;
const PrimaryBtn = styled.button`width: 100%; padding: 16px; background: ${PRIMARY}; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer;`;
const SecondaryBtn = styled.button`width: 100%; padding: 14px; background: #111; color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer;`;
const OutlineBtn = styled.button`width: 100%; padding: 14px; background: #fff; color: #888; border: 1px solid #E5E5EA; border-radius: 12px; font-size: 14px; cursor: pointer;`;
const TshirtBanner = styled.div`background: #111; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;`;
const TshirtLeft = styled.div``;
const TshirtLabel = styled.div`font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 4px;`;
const TshirtTitle = styled.div`font-size: 16px; font-weight: 700; color: #fff;`;
const TshirtEmoji = styled.div`font-size: 32px;`;
