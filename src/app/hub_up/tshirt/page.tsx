"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styled from '@emotion/styled';

const SIZES = ['S', 'M', 'L', 'XL', '2XL'];
const COLORS = [
  { value: 'white', label: 'WHITE', bg: '#fff', text: '#111' },
  { value: 'black', label: 'BLACK', bg: '#111', text: '#fff' },
];

interface OrderItem { color: string; size: string; quantity: number; }

export default function TshirtPage() {
  const router = useRouter();
  const { status } = useSession();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [existingOrder, setExistingOrder] = useState<any>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeColor, setActiveColor] = useState<'white' | 'black'>('white');

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login?redirect=/hub_up/tshirt'); return; }
    if (status !== 'authenticated') return;
    // config는 캐싱된 공개 API, 주문은 인증 API - 병렬 fetch
    Promise.all([
      fetch('/api/hub-up/config').then((r) => r.json()),
      fetch('/api/hub-up/tshirt').then((r) => r.json()),
    ]).then(([config, tshirt]) => {
      setConfig({ ...config, ...(tshirt.config || {}) });
      if (tshirt.order) {
        setExistingOrder(tshirt.order);
        setItems(tshirt.order.items || []);
      }
    }).finally(() => setLoading(false));
  }, [status, router]);

  const getQty = (color: string, size: string) =>
    items.find((i) => i.color === color && i.size === size)?.quantity || 0;

  const setQty = (color: string, size: string, qty: number) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => !(i.color === color && i.size === size));
      if (qty > 0) return [...filtered, { color, size, quantity: qty }];
      return filtered;
    });
  };

  const totalCount = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const price = Number(config[`tshirt_price_${item.color}`] || 0);
    return sum + (price * item.quantity);
  }, 0);

  const handleSubmit = async () => {
    if (!totalCount) { alert('수량을 선택해주세요.'); return; }
    setSubmitting(true);
    const res = await fetch('/api/hub-up/tshirt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { alert(data.error || '오류가 발생했습니다.'); return; }
    setDone(true);
  };

  if (status === 'loading' || loading) return <LoadingWrap>불러오는 중...</LoadingWrap>;

  // 테스트를 위해 판매 기간 체크 주석 처리
  // if (config.tshirt_sale_open !== 'true') {
  //   return (
  //     <Wrap>
  //       <TopNav><BackBtn onClick={() => router.back()}>←</BackBtn></TopNav>
  //       <ClosedBox>
  //         <ClosedIcon>👕</ClosedIcon>
  //         <ClosedTitle>티셔츠 판매 준비 중</ClosedTitle>
  //         <ClosedDesc>판매 기간이 되면 이 페이지에서 신청할 수 있어요.</ClosedDesc>
  //       </ClosedBox>
  //     </Wrap>
  //   );
  // }

  if (done) {
    return (
      <Wrap>
        <TopNav><BackBtn onClick={() => router.push('/hub_up/myinfo')}>←</BackBtn></TopNav>
        <DoneBox>
          <DoneIcon>✅</DoneIcon>
          <DoneTitle>{existingOrder ? '변경이 완료되었습니다' : '신청이 완료되었습니다'}</DoneTitle>
          <AccountBox>
            <AccountLabel>입금 계좌</AccountLabel>
            <AccountValue>{config.tshirt_bank_name} {config.tshirt_bank_account}</AccountValue>
            <AccountHolder>예금주: {config.tshirt_bank_holder}</AccountHolder>
            <AccountNote>입금 시 이름+연락처 끝 네자리 기입 필수</AccountNote>
          </AccountBox>
          <GoBtn onClick={() => router.push('/hub_up/myinfo')}>내 정보 확인하기</GoBtn>
        </DoneBox>
      </Wrap>
    );
  }

  const currentColor = COLORS.find(c => c.value === activeColor)!;
  const price = Number(config[`tshirt_price_${activeColor}`] || 10000);

  return (
    <Wrap>
      <TopNav>
        <BackBtn onClick={() => router.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 19L8 12L15 5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </BackBtn>
      </TopNav>

      {/* Hero Banner */}
      <HeroBanner bg={currentColor.bg}>
        <BannerTop>
          <EssenceLogo color={currentColor.text}>2026 Be Holy</EssenceLogo>
          <ColorBadge color={currentColor.text}>{currentColor.label}</ColorBadge>
        </BannerTop>
        <TshirtTitle color={currentColor.text}>T-SHIRTS</TshirtTitle>
        <BannerDots color={currentColor.text}>• • •</BannerDots>
      </HeroBanner>

      <Content>
        {/* 제품 정보 */}
        <ProductInfo>
          <ProductTitle>ESSENCE TSHIR</ProductTitle>
          <ProductSubtitle>2025 HUBUP ESSENCE</ProductSubtitle>
          <ProductPrice>{price.toLocaleString()}원</ProductPrice>
        </ProductInfo>

        {/* 색상 탭 */}
        <ColorTabs>
          <ColorTab 
            active={activeColor === 'white'} 
            onClick={() => setActiveColor('white')}
          >
            WHITE
          </ColorTab>
          <ColorTab 
            active={activeColor === 'black'} 
            onClick={() => setActiveColor('black')}
          >
            BLACK
          </ColorTab>
        </ColorTabs>

        {/* 사이즈 선택 테이블 */}
        <SizeSection>
          <SizeLabel>사이즈 [SIZE]</SizeLabel>
          <SizeTable>
            <SizeTableHeader>
              <SizeHeaderCell></SizeHeaderCell>
              {SIZES.map(size => (
                <SizeHeaderCell key={size}>{size}</SizeHeaderCell>
              ))}
            </SizeTableHeader>
            <SizeTableRow>
              <SizeRowLabel>수량</SizeRowLabel>
              {SIZES.map(size => {
                const qty = getQty(activeColor, size);
                return (
                  <SizeCell key={size}>
                    <QtyControl>
                      <QtyBtn onClick={() => setQty(activeColor, size, Math.max(0, qty - 1))}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </QtyBtn>
                      <QtyDisplay>{qty}</QtyDisplay>
                      <QtyBtn onClick={() => setQty(activeColor, size, qty + 1)}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </QtyBtn>
                    </QtyControl>
                  </SizeCell>
                );
              })}
            </SizeTableRow>
          </SizeTable>
        </SizeSection>

        {/* 안내사항 */}
        <NoticeBox>
          <NoticeTitle>안내사항</NoticeTitle>
          <NoticeText>
            • 티셔츠는 허브업 현장에서 수령 가능합니다.<br/>
            • 입금 후 신청이 완료됩니다.<br/>
            • 변경 가능 기간: {config.tshirt_change_deadline || '추후 공지'}
          </NoticeText>
        </NoticeBox>

        <BottomSpacer />
      </Content>

      {/* 하단 고정 버튼 */}
      <BottomBar>
        <PriceInfo>
          <PriceLabel>총 {totalCount}개</PriceLabel>
          <TotalPrice>{totalPrice.toLocaleString()}원</TotalPrice>
        </PriceInfo>
        <SubmitBtn disabled={!totalCount || submitting} onClick={handleSubmit}>
          {submitting ? '처리 중...' : existingOrder ? '변경하기 →' : '신청하기 →'}
        </SubmitBtn>
      </BottomBar>
    </Wrap>
  );
}

const PRIMARY = '#2D478C';
const Wrap = styled.div`width: 100%; min-height: 100vh; background: #FAFAFA; font-family: -apple-system, sans-serif; padding-bottom: 100px;`;
const LoadingWrap = styled.div`display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #888;`;
const TopNav = styled.div`height: 56px; display: flex; align-items: center; padding: 0 16px; background: #fff; position: sticky; top: 0; z-index: 10;`;
const BackBtn = styled.button`background: none; border: none; cursor: pointer; padding: 8px; display: flex; align-items: center;`;

const HeroBanner = styled.div<{ bg: string }>`
  background: ${p => p.bg};
  padding: 24px 24px 28px;
  border-bottom: 1px solid #E5E5EA;
`;
const BannerTop = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;`;
const EssenceLogo = styled.div<{ color: string }>`
  font-size: 16px;
  font-weight: 700;
  color: ${p => p.color};
  letter-spacing: 0.05em;
`;
const ColorBadge = styled.div<{ color: string }>`
  font-size: 11px;
  font-weight: 700;
  color: ${p => p.color};
  border: 1.5px solid ${p => p.color};
  padding: 4px 12px;
  border-radius: 4px;
  letter-spacing: 0.1em;
`;
const TshirtTitle = styled.h1<{ color: string }>`
  font-size: 36px;
  font-weight: 900;
  color: ${p => p.color};
  margin: 8px 0 0 0;
  letter-spacing: -0.02em;
  line-height: 1;
`;
const BannerDots = styled.div<{ color: string }>`
  font-size: 20px;
  color: ${p => p.color};
  margin-top: 16px;
  letter-spacing: 4px;
`;

const Content = styled.div`padding: 0 20px;`;

const ProductInfo = styled.div`
  background: #fff;
  padding: 24px 20px;
  margin: 16px -20px 0;
`;
const ProductTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #111;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
`;
const ProductSubtitle = styled.p`
  font-size: 13px;
  color: #888;
  margin: 0 0 12px 0;
`;
const ProductPrice = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: #111;
  margin: 0;
`;

const ColorTabs = styled.div`
  display: flex;
  gap: 8px;
  margin: 20px 0;
`;
const ColorTab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 12px;
  background: ${p => p.active ? '#111' : '#fff'};
  color: ${p => p.active ? '#fff' : '#888'};
  border: 1.5px solid ${p => p.active ? '#111' : '#E5E5EA'};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
`;

const SizeSection = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
`;
const SizeLabel = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #111;
  margin-bottom: 16px;
`;
const SizeTable = styled.div`
  width: 100%;
`;
const SizeTableHeader = styled.div`
  display: grid;
  grid-template-columns: 60px repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 8px;
`;
const SizeHeaderCell = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #888;
  text-align: center;
  padding: 8px 4px;
`;
const SizeTableRow = styled.div`
  display: grid;
  grid-template-columns: 60px repeat(5, 1fr);
  gap: 8px;
  align-items: center;
`;
const SizeRowLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #111;
  text-align: center;
`;
const SizeCell = styled.div`
  background: #FAFAFA;
  border-radius: 8px;
  padding: 8px 4px;
`;
const QtyControl = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;
const QtyBtn = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #E5E5EA;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: all 0.15s;
  &:active { transform: scale(0.95); }
`;
const QtyDisplay = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #111;
  min-width: 20px;
  text-align: center;
`;

const NoticeBox = styled.div`
  background: #FFF9F0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
`;
const NoticeTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #111;
  margin-bottom: 8px;
`;
const NoticeText = styled.div`
  font-size: 12px;
  color: #666;
  line-height: 1.6;
`;

const BottomSpacer = styled.div`height: 20px;`;

const BottomBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-top: 1px solid #E5E5EA;
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  align-items: center;
  z-index: 100;
`;
const PriceInfo = styled.div`
  flex: 1;
`;
const PriceLabel = styled.div`
  font-size: 12px;
  color: #888;
  margin-bottom: 2px;
`;
const TotalPrice = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: #111;
`;
const SubmitBtn = styled.button`
  padding: 16px 32px;
  background: #2D478C;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  &:disabled {
    background: #E6E6E6;
    cursor: not-allowed;
  }
  &:not(:disabled):active {
    transform: scale(0.98);
  }
`;

const ClosedBox = styled.div`display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; padding: 40px 20px; text-align: center;`;
const ClosedIcon = styled.div`font-size: 56px; margin-bottom: 16px;`;
const ClosedTitle = styled.h2`font-size: 20px; font-weight: 700; color: #111; margin: 0 0 8px 0;`;
const ClosedDesc = styled.p`font-size: 14px; color: #888; margin: 0;`;
const DoneBox = styled.div`padding: 40px 20px; display: flex; flex-direction: column; align-items: center;`;
const DoneIcon = styled.div`font-size: 56px; margin-bottom: 16px;`;
const DoneTitle = styled.h2`font-size: 20px; font-weight: 700; color: #111; margin: 0 0 24px 0;`;
const AccountBox = styled.div`background: #fff; border-radius: 12px; padding: 20px; width: 100%; margin-bottom: 24px;`;
const AccountLabel = styled.div`font-size: 12px; color: #888; margin-bottom: 6px;`;
const AccountValue = styled.div`font-size: 16px; font-weight: 700; color: #111; margin-bottom: 4px;`;
const AccountHolder = styled.div`font-size: 14px; color: #444; margin-bottom: 8px;`;
const AccountNote = styled.div`font-size: 12px; color: ${PRIMARY};`;
const GoBtn = styled.button`width: 100%; padding: 16px; background: ${PRIMARY}; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer;`;
