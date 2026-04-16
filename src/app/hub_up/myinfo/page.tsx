"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styled from '@emotion/styled';
import { QRCodeSVG } from 'qrcode.react';

interface Registration {
  id: string;
  name: string;
  group_name: string;
  departure_slot: string;
  return_slot: string;
  elective_lecture: string;
  intercessor_team: string;
  volunteer_team: string;
  admin_deposit_confirm: boolean;
  room_number: string | null;
  room_note: string | null;
}

interface TshirtOrder {
  id: string;
  items: { color: string; size: string; quantity: number }[];
  deposit_confirm: boolean;
  qr_code: string;
  status: string;
}

const PRIMARY = '#2D478C';

const slotLabel = (slot: string) => {
  if (!slot) return '-';
  if (slot === 'car') return '자차/대중교통';
  return slot.replace('bus-', '');
};

const colorLabel = (color: string) => {
  if (color === 'black') return 'Black';
  if (color === 'navy') return 'Navy';
  return 'White';
};

export default function MyInfoPage() {
  const router = useRouter();
  const { status } = useSession();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [tshirtOrder, setTshirtOrder] = useState<TshirtOrder | null>(null);
  const [tshirtConfig, setTshirtConfig] = useState<Record<string, string>>({});
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyToast, setCopyToast] = useState(false);

  const copyAccount = () => {
    const text = '573-910022-19605';
    const done = () => { setCopyToast(true); setTimeout(() => setCopyToast(false), 2000); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => {
        const el = document.createElement('textarea');
        el.value = text; el.style.position = 'fixed'; el.style.opacity = '0';
        document.body.appendChild(el); el.focus(); el.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(el); done();
      });
    } else {
      const el = document.createElement('textarea');
      el.value = text; el.style.position = 'fixed'; el.style.opacity = '0';
      document.body.appendChild(el); el.focus(); el.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(el); done();
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login?redirect=/hub_up/myinfo'); return; }
    if (status !== 'authenticated') return;

    Promise.all([
      fetch('/api/hub-up/myinfo').then((r) => r.json()),
      fetch('/api/hub-up/tshirt').then((r) => r.json()),
      fetch('/api/hub-up/config').then((r) => r.json()),
    ])
      .then(([myinfo, tshirt, config]) => {
        if (myinfo.error) { setError(myinfo.error); return; }
        setRegistration(myinfo.registration);
        setContactPhone(myinfo.contactPhone || '');
        setTshirtOrder(tshirt.order || null);
        setTshirtConfig({ ...(tshirt.config || {}), ...config });
      })
      .catch(() => setError('정보를 불러오는 중 오류가 발생했습니다.'))
      .finally(() => setLoading(false));
  }, [status, router]);

  if (status === 'loading' || loading) {
    return <LoadingWrap>정보를 불러오는 중입니다...</LoadingWrap>;
  }

  if (error) return <LoadingWrap style={{ color: '#d93025' }}>{error}</LoadingWrap>;

  const isTshirtChangeable = new Date() <= new Date('2026-04-26T23:59:00+09:00');
  const isDistributing = new Date() >= new Date('2026-05-10T00:00:00+09:00');

  const TshirtSection = () => (
    <Section>
      <SectionTitle>티셔츠</SectionTitle>
      {tshirtOrder ? (
        <>
          {tshirtOrder.items.map((item) => (
            <InfoRow key={`${item.color}-${item.size}`}>
              <InfoLabel>{colorLabel(item.color)} {item.size}</InfoLabel>
              <InfoValue>{item.quantity}개</InfoValue>
            </InfoRow>
          ))}
          <InfoRow>
            <InfoLabel>입금</InfoLabel>
            <StatusBadge ok={tshirtOrder.status === 'confirmed'}>
              {tshirtOrder.status === 'confirmed' ? '완료' : '미확인'}
            </StatusBadge>
          </InfoRow>
          {isDistributing && (
            <QRSection>
              <QRTitle>티셔츠 수령 QR</QRTitle>
              <QRDesc>현장에서 이 QR을 제시해주세요.</QRDesc>
              <QRWrap>
                <QRCodeSVG
                  value={tshirtOrder.items.map(item => `${colorLabel(item.color)} ${item.size}: ${item.quantity}개`).join('\n')}
                  size={180}
                />
              </QRWrap>
            </QRSection>
          )}
          {isTshirtChangeable && (
            <SecondaryBtn onClick={() => router.push('/hub_up/tshirt')}>
              티셔츠 옵션 변경하기
            </SecondaryBtn>
          )}
        </>
      ) : (
        <>
          <EmptyDesc style={{ marginBottom: '16px' }}>아직 티셔츠를 신청하지 않으셨습니다.</EmptyDesc>
          <PrimaryBtn onClick={() => router.push('/hub_up/tshirt')}>티셔츠 신청하러 가기</PrimaryBtn>
        </>
      )}
    </Section>
  );

  // 허브업 미신청 - 티셔츠 주문 여부와 관계없이 표시
  if (!registration) {
    return (
      <Wrap>
        <TopNav>
          <BackBtn onClick={() => router.push('/hub_up')}>←</BackBtn>
          <NavTitle>내 정보</NavTitle>
        </TopNav>
        <Content>
          {tshirtOrder && <TshirtSection />}

          <HubUpNudge>
            <NudgeTitle>허브업 신청을 아직 안 하셨나요?</NudgeTitle>
            <NudgeDesc>티셔츠와 함께 허브업도 신청해보세요!</NudgeDesc>
            <PrimaryBtn onClick={() => router.push('/hub_up/register')}>
              허브업 신청하러 가기
            </PrimaryBtn>
          </HubUpNudge>

          {!tshirtOrder && (
            <EmptyBox>
              <EmptyIcon>📋</EmptyIcon>
              <EmptyTitle>신청 내역이 없습니다</EmptyTitle>
              <EmptyDesc>아직 허브업 신청을 하지 않으셨습니다.</EmptyDesc>
            </EmptyBox>
          )}
        </Content>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <TopNav>
        <BackBtn onClick={() => router.push('/hub_up')}>←</BackBtn>
        <NavTitle>내 정보</NavTitle>
      </TopNav>
      <Content>
        {/* 기본 정보 */}
        <Section>
          <SectionTitle>기본 정보</SectionTitle>
          <InfoRow><InfoLabel>이름</InfoLabel><InfoValue>{registration.name}</InfoValue></InfoRow>
          <InfoRow><InfoLabel>그룹/다락방</InfoLabel><InfoValue>{registration.group_name}</InfoValue></InfoRow>
          <InfoRow><InfoLabel>선택강의</InfoLabel><InfoValue>{registration.elective_lecture}</InfoValue></InfoRow>
          <InfoRow><InfoLabel>자원봉사</InfoLabel><InfoValue>{registration.volunteer_team}</InfoValue></InfoRow>
          <InfoRow>
            <InfoLabel>입금</InfoLabel>
            <StatusBadge ok={registration.admin_deposit_confirm}>
              {registration.admin_deposit_confirm ? '확인완료' : '입금확인중'}
            </StatusBadge>
          </InfoRow>
          {!registration.admin_deposit_confirm && (
            <DepositInfoBox>
              <DepositInfoSection>
                <DepositInfoTitle>입금 계좌 정보</DepositInfoTitle>
                <DepositInfoRow>
                  <DepositInfoLabel>계좌번호</DepositInfoLabel>
                  <DepositAccountValue onClick={copyAccount}>
                    573-910022-19605
                    <CopyBadge>복사</CopyBadge>
                  </DepositAccountValue>
                </DepositInfoRow>
                <DepositInfoRow>
                  <DepositInfoLabel>예금주</DepositInfoLabel>
                  <DepositInfoValue>온누리교회(허브행사비)/하나은행</DepositInfoValue>
                </DepositInfoRow>
              </DepositInfoSection>
              <DepositDivider />
              <DepositInfoSection>
                <DepositInfoTitle>회비 안내</DepositInfoTitle>
                <DepositInfoRow>
                  <DepositInfoLabel>얼리버드 8만원</DepositInfoLabel>
                  <DepositInfoValue>4월 12일 - 4월 18일</DepositInfoValue>
                </DepositInfoRow>
                <DepositInfoRow>
                  <DepositInfoLabel>일반 8만 5천원</DepositInfoLabel>
                  <DepositInfoValue>4월 19일 - 4월 26일</DepositInfoValue>
                </DepositInfoRow>
              </DepositInfoSection>
              <DepositNote>※ 입금자명: 이름 + 연락처 끝 네자리 기입 요망{'\n'}(ex. 김허브 8572)</DepositNote>
            </DepositInfoBox>
          )}
        </Section>

        {/* 숙소 */}
        {registration.room_number && (
          <Section>
            <SectionTitle>숙소</SectionTitle>
            <RoomHighlight>
              <RoomLabel>배정된 숙소</RoomLabel>
              <RoomNumber>{registration.room_number}</RoomNumber>
              {registration.room_note && <RoomNote>{registration.room_note}</RoomNote>}
            </RoomHighlight>
          </Section>
        )}

        {/* 차량 */}
        <Section>
          <SectionTitle>차량</SectionTitle>
          <InfoRow><InfoLabel>출발 버스</InfoLabel><InfoValue>{slotLabel(registration.departure_slot)}</InfoValue></InfoRow>
          <InfoRow><InfoLabel>복귀 버스</InfoLabel><InfoValue>{slotLabel(registration.return_slot)}</InfoValue></InfoRow>
          <SecondaryBtn onClick={() => window.location.href = '/api/hub-up/bus-change-token'}>
            버스 시간 변경 문의하기
          </SecondaryBtn>
        </Section>

        {/* 티셔츠 */}
        <TshirtSection />

        {/* FAQ */}
        <FaqLink onClick={() => router.push('/hub_up/faq')}>
          FAQ 보러가기 →
        </FaqLink>
        {/* 접수 취소 */}
        <CancelSection>
          <CancelTitle>접수 취소</CancelTitle>
          <CancelDesc>5월 3일(일) 자정까지 환불 가능합니다.<br/>이후에는 예약금 지불로 인해 환불이 불가합니다.</CancelDesc>
          <CancelBtn onClick={() => window.open('https://open.kakao.com/o/s9CV4ipi', '_blank')}>
            접수 취소 문의하기
          </CancelBtn>
        </CancelSection>
      </Content>
      {copyToast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '10px 20px',
          borderRadius: 20, fontSize: 13, fontWeight: 500, zIndex: 9999, whiteSpace: 'nowrap',
        }}>
          계좌번호가 복사되었습니다 ✓
        </div>
      )}
    </Wrap>
  );
}

const Wrap = styled.div`width: 100%; min-height: 100vh; background: #FAFAFA; font-family: -apple-system, sans-serif;`;
const LoadingWrap = styled.div`display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #888; font-size: 15px;`;
const TopNav = styled.div`height: 56px; display: flex; align-items: center; padding: 0 16px; background: #fff; gap: 12px; justify-content: space-between; position: relative;`;
const BackBtn = styled.button`background: none; border: none; font-size: 20px; cursor: pointer; padding: 8px;`;
const NavTitle = styled.div`font-size: 17px; font-weight: 700; color: #111; position: absolute; left: 50%; transform: translateX(-50%);`;
const Content = styled.div`padding: 16px 20px 80px;`;
const Section = styled.div`background: #fff; border-radius: 16px; padding: 20px; margin-bottom: 12px;`;
const SectionTitle = styled.div`font-size: 13px; font-weight: 700; color: ${PRIMARY}; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.05em;`;
const InfoRow = styled.div`display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #F5F5F5; &:last-child { border-bottom: none; }`;
const InfoLabel = styled.div`font-size: 14px; color: #888;`;
const InfoValue = styled.div`font-size: 14px; font-weight: 600; color: #111;`;
const StatusBadge = styled.span<{ ok: boolean }>`
  padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700;
  background: ${(p) => p.ok ? '#E6F4EA' : '#FEF3C7'};
  color: ${(p) => p.ok ? '#278f5a' : '#D97706'};
`;
const RoomHighlight = styled.div`background: #FFF5F5; border-radius: 12px; padding: 16px; text-align: center;`;
const RoomLabel = styled.div`font-size: 12px; color: #888; margin-bottom: 4px;`;
const RoomNumber = styled.div`font-size: 28px; font-weight: 800; color: ${PRIMARY};`;
const RoomNote = styled.div`font-size: 12px; color: #888; margin-top: 4px;`;
const SecondaryBtn = styled.button`width: 100%; padding: 12px; background: #F5F5F5; color: #111; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 14px;`;
const PrimaryBtn = styled.button`width: 100%; padding: 14px; background: ${PRIMARY}; color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer;`;
const DeadlineNote = styled.p`font-size: 12px; color: #888; text-align: center; margin: 8px 0 0 0;`;
const QRSection = styled.div`margin-top: 16px; text-align: center;`;
const QRTitle = styled.div`font-size: 15px; font-weight: 700; color: #111; margin-bottom: 4px;`;
const QRDesc = styled.div`font-size: 12px; color: #888; margin-bottom: 16px;`;
const QRWrap = styled.div`display: inline-block; padding: 16px; background: #fff; border-radius: 12px; border: 1px solid #E5E5EA;`;
const EmptyBox = styled.div`display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center;`;
const EmptyIcon = styled.div`font-size: 48px; margin-bottom: 16px;`;
const EmptyTitle = styled.h3`font-size: 18px; font-weight: 700; color: #111; margin: 0 0 8px 0;`;
const EmptyDesc = styled.p`font-size: 14px; color: #888; margin: 0;`;
const FaqLink = styled.button`width: 100%; padding: 16px; background: none; border: 1px solid #E5E5EA; border-radius: 12px; font-size: 14px; color: #888; cursor: pointer; text-align: center;`;
const HubUpNudge = styled.div`background: #EEF2FF; border-radius: 16px; padding: 20px; margin-top: 12px; text-align: center;`;
const NudgeTitle = styled.div`font-size: 15px; font-weight: 700; color: #2D478C; margin-bottom: 6px;`;
const NudgeDesc = styled.p`font-size: 13px; color: #5a6a8a; margin: 0 0 14px 0;`;
const CancelSection = styled.div`background: #fff; border-radius: 16px; padding: 20px; margin-top: 12px;`;
const CancelTitle = styled.div`font-size: 13px; font-weight: 700; color: #d93025; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;`;
const CancelDesc = styled.p`font-size: 13px; color: #888; line-height: 1.6; margin: 0 0 14px 0;`;
const CancelBtn = styled.button`width: 100%; padding: 12px; background: #fff; color: #d93025; border: 1px solid #d93025; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;`;
const DepositInfoBox = styled.div`background: #fefdf5; border-radius: 16px; padding: 20px; margin-top: 10px;`;
const DepositInfoSection = styled.div`margin-bottom: 4px;`;
const DepositInfoTitle = styled.div`font-size: 15px; font-weight: 700; color: #111; margin-bottom: 12px;`;
const DepositInfoRow = styled.div`display: flex; justify-content: space-between; align-items: center; padding: 6px 0;`;
const DepositInfoLabel = styled.div`font-size: 14px; color: #999;`;
const DepositInfoValue = styled.div`font-size: 14px; font-weight: 600; color: #111; text-align: right;`;
const DepositAccountValue = styled.div`display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #2D478C; cursor: pointer; &:active { opacity: 0.7; }`;
const CopyBadge = styled.span`font-size: 11px; font-weight: 600; color: #2D478C; background: #dce8ff; padding: 2px 7px; border-radius: 10px;`;
const DepositDivider = styled.div`height: 1px; background: #e8e8e0; margin: 12px 0;`;
const DepositNote = styled.div`font-size: 12px; color: #999; line-height: 1.6; margin-top: 12px; white-space: pre-line;`;
