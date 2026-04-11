"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import Image from 'next/image';

const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

const SIZE_GUIDE = [
  { size: 'S',   sub: '(85)',  chest: '47', length: '62' },
  { size: 'M',   sub: '(90)',  chest: '49', length: '65' },
  { size: 'L',   sub: '(95)',  chest: '52', length: '68' },
  { size: 'XL',  sub: '(100)', chest: '54', length: '71' },
  { size: '2XL', sub: '(105)', chest: '56', length: '74' },
  { size: '3XL', sub: '(110)', chest: '59', length: '77' },
];

const COLOR_IMAGES: Record<string, string[]> = {
  white: ['/images/tshirt/tshirt_white.png', '/images/tshirt/tshirt_white2.png'],
  black: ['/images/tshirt/tshirt_black.png', '/images/tshirt/tshirt_black2.png'],
};

// 기간 상수 (KST)
const SALE_START    = new Date('2026-04-12T00:00:00+09:00');
const SALE_END      = new Date('2026-04-26T23:59:00+09:00');
const CHANGE_END    = new Date('2026-04-26T23:59:00+09:00');
const DISTRIBUTE_START = new Date('2026-05-10T00:00:00+09:00');

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
  const [imgIndex, setImgIndex] = useState(0);
  const touchStartX = useRef(0);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const now = new Date();
  const isSaleOpen      = now >= SALE_START && now <= SALE_END;
  const isChangeable    = now <= CHANGE_END;
  const isDistributing  = now >= DISTRIBUTE_START;

  useEffect(() => {
    autoTimer.current = setInterval(() => {
      setImgIndex((i) => (i + 1) % COLOR_IMAGES[activeColor].length);
    }, 5000);
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [activeColor]);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login?redirect=/hub_up/tshirt'); return; }
    if (status !== 'authenticated') return;
    Promise.all([
      fetch('/api/hub-up/config').then((r) => r.json()),
      fetch('/api/hub-up/tshirt').then((r) => r.json()),
    ]).then(([cfg, tshirt]) => {
      setConfig({ ...cfg, ...(tshirt.config || {}) });
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
    const price = Number(config[`tshirt_price_${item.color}`] || 20000);
    return sum + (price * item.quantity);
  }, 0);

  const handleSubmit = async () => {
    if (!totalCount) return;
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

  const currentPrice = Number(config[`tshirt_price_${activeColor}`] || 20000);
  const [copyToast, setCopyToast] = useState(false);

  const copyAccount = () => {
    const text = bankAccount;
    const copy = () => { setCopyToast(true); setTimeout(() => setCopyToast(false), 2000); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(copy).catch(() => {
        const el = document.createElement('textarea');
        el.value = text; el.style.position = 'fixed'; el.style.opacity = '0';
        document.body.appendChild(el); el.focus(); el.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(el); copy();
      });
    } else {
      const el = document.createElement('textarea');
      el.value = text; el.style.position = 'fixed'; el.style.opacity = '0';
      document.body.appendChild(el); el.focus(); el.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(el); copy();
    }
  };

  const bankName    = config.tshirt_bank_name    || '카카오뱅크';
  const bankAccount = config.tshirt_bank_account || '3333-06-3840721';
  const bankHolder  = config.tshirt_bank_holder  || '이지선';

  if (status === 'loading' || loading) {
    return <LoadingWrap><Spinner /></LoadingWrap>;
  }

  // 신청 완료 화면
  if (done) {
    return (
      <Wrap>
        <TopNav>
          <BackBtn onClick={() => router.push('/hub_up/myinfo')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 19L8 12L15 5" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </BackBtn>
        </TopNav>
        <DoneBox>
          <SuccessIcon>✓</SuccessIcon>
          <DoneTitle>{existingOrder ? '변경 완료!' : '신청 완료!'}</DoneTitle>
          <DoneSub>입금 후 최종 완료 처리됩니다</DoneSub>
          <AccountCard>
            <AccountRow><ALabel>금액</ALabel><AValue>{totalPrice.toLocaleString()}원</AValue></AccountRow>
            <AccountRow><ALabel>은행</ALabel><AValue>{bankName}</AValue></AccountRow>
            <AccountRow copyable onClick={copyAccount}>
              <ALabel>계좌</ALabel>
              <AValueCopy>
                {bankAccount}
                <CopyIcon>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="#2D478C" strokeWidth="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#2D478C" strokeWidth="2"/>
                  </svg>
                  복사
                </CopyIcon>
              </AValueCopy>
            </AccountRow>
            <AccountRow><ALabel>예금주</ALabel><AValue>{bankHolder}</AValue></AccountRow>
            <AccountRow><ALabel>입금 기한</ALabel><AValue>4월 26일 (일) 23:59까지</AValue></AccountRow>
          </AccountCard>
          {copyToast && <CopyToast>계좌번호가 복사되었습니다 ✓</CopyToast>}
          <ActionBtn onClick={() => router.push('/hub_up/myinfo')}>확인</ActionBtn>
        </DoneBox>
      </Wrap>
    );
  }

  // 판매 기간 외 화면
  if (!isSaleOpen && !existingOrder) {
    return (
      <Wrap>
        <TopNav>
          <BackBtn onClick={() => router.back()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 19L8 12L15 5" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </BackBtn>
          <NavTitle>티셔츠 예약</NavTitle>
        </TopNav>
        <ClosedBox>
          <ClosedIcon>👕</ClosedIcon>
          <ClosedTitle style={{ color: '#111' }}>
            {now < SALE_START ? '판매 예정' : '판매 종료'}
          </ClosedTitle>
          <ClosedDesc>
            {now < SALE_START
              ? `티셔츠 판매는 4월 12일(일)부터 시작됩니다.`
              : `티셔츠 판매가 종료되었습니다.\n판매 기간: 4월 12일 ~ 4월 26일`}
          </ClosedDesc>
          <ActionBtn onClick={() => router.push('/hub_up')}>홈으로</ActionBtn>
        </ClosedBox>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <TopNav>
        <BackBtn onClick={() => router.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 19L8 12L15 5" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </BackBtn>
        <NavTitle>신청하기</NavTitle>
      </TopNav>

      <SliderWrap
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          const imgs = COLOR_IMAGES[activeColor];
          if (diff > 40) setImgIndex((i) => Math.min(i + 1, imgs.length - 1));
          if (diff < -40) setImgIndex((i) => Math.max(i - 1, 0));
        }}
      >
        <SliderTrack style={{ transform: `translateX(-${imgIndex * 100}%)` }}>
          {COLOR_IMAGES[activeColor].map((src, i) => (
            <SliderSlide key={i}>
              <Image src={src} alt="ESSENCE 티셔츠" fill style={{ objectFit: 'cover', objectPosition: 'center' }} priority />
            </SliderSlide>
          ))}
        </SliderTrack>
        <DotRow>
          {COLOR_IMAGES[activeColor].map((_, i) => (
            <Dot key={i} active={imgIndex === i} onClick={() => setImgIndex(i)} />
          ))}
        </DotRow>
      </SliderWrap>

      <Body>
        <ProductName>ESSENCE 티셔츠</ProductName>
        <DeadlineRow>
          <DeadlineDot />
          <DeadlineText>
            {isDistributing
              ? '배부 기간 · 변경 불가'
              : isChangeable
              ? `변경 기한 · 4월 26일 23:59까지`
              : config.tshirt_deadline_text || '예약 종료'}
          </DeadlineText>
        </DeadlineRow>
        <ProductPrice>{currentPrice.toLocaleString()}원</ProductPrice>

        <HRule />

        <SectionTitle>사이즈 가이드</SectionTitle>
        <SizeGuideWrap>
          <SizeGuideTable>
            <thead>
              <tr>
                <SGTh isLabel />
                {SIZE_GUIDE.map((row) => (
                  <SGTh key={row.size}>{row.size}<br /><SizeSubText>{row.sub}</SizeSubText></SGTh>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <SGTd isLabel>가슴단면</SGTd>
                {SIZE_GUIDE.map((row) => <SGTd key={row.size}>{row.chest}</SGTd>)}
              </tr>
              <tr>
                <SGTd isLabel>총 길이</SGTd>
                {SIZE_GUIDE.map((row) => <SGTd key={row.size}>{row.length}</SGTd>)}
              </tr>
            </tbody>
          </SizeGuideTable>
        </SizeGuideWrap>

        <HRule />

        {/* 배부 기간엔 변경 불가 */}
        {!isDistributing && (
          <>
            <SectionTitle>색상 선택</SectionTitle>
            <ColorRow>
              {(['white', 'black'] as const).map((c) => (
                <ColorBtn key={c} active={activeColor === c} onClick={() => { setActiveColor(c); setImgIndex(0); }}>
                  <ColorDot isWhite={c === 'white'} active={activeColor === c} />
                  {c === 'white' ? 'White' : 'Black'}
                </ColorBtn>
              ))}
            </ColorRow>

            <SectionTitle style={{ marginTop: 24 }}>사이즈 / 수량</SectionTitle>
            <SizeList>
              {SIZES.map((size) => {
                const qty = getQty(activeColor, size);
                return (
                  <SizeItem key={size} selected={qty > 0}>
                    <SizeName selected={qty > 0}>{size}</SizeName>
                    <QtyWrap>
                      <QtyBtn selected={qty > 0} onClick={() => setQty(activeColor, size, Math.max(0, qty - 1))} disabled={qty === 0}>−</QtyBtn>
                      <QtyVal selected={qty > 0}>{qty}</QtyVal>
                      <QtyBtn selected={qty > 0} onClick={() => setQty(activeColor, size, qty + 1)}>+</QtyBtn>
                    </QtyWrap>
                  </SizeItem>
                );
              })}
            </SizeList>
          </>
        )}

        {/* 배부 기간: 주문 내역 표시 */}
        {isDistributing && existingOrder && (
          <>
            <SectionTitle style={{ marginTop: 24 }}>주문 내역</SectionTitle>
            <SizeList>
              {existingOrder.items?.map((item: OrderItem, i: number) => (
                <SizeItem key={i} selected>
                  <SizeName selected>{item.color === 'black' ? 'Black' : 'White'} {item.size}</SizeName>
                  <QtyVal selected>{item.quantity}개</QtyVal>
                </SizeItem>
              ))}
            </SizeList>
            <DistributeNotice>
              현장에서 QR을 제시하고 티셔츠를 수령하세요.<br />
              배부 일정: 5월 10일 (일)
            </DistributeNotice>
          </>
        )}

        <HRule style={{ marginTop: 24 }} />

        <SectionTitle>유의사항</SectionTitle>
        <NoticeText>옵션 선택 후, 가이드를 따라 입금을 진행해 주세요.</NoticeText>
        <NoticeText>입금은 기한(4월 26일 23:59) 내에 진행해 주셔야 완료 처리됩니다.</NoticeText>
        <NoticeText>사이즈 및 수량 변경은 4월 26일 23:59까지 가능합니다.</NoticeText>
      </Body>

      <BottomBar>
        {isDistributing ? (
          <ReserveBtn onClick={() => router.push('/hub_up/myinfo')}>내 정보에서 QR 확인하기</ReserveBtn>
        ) : (
          <ReserveBtn disabled={!totalCount || submitting || !isChangeable} onClick={handleSubmit}>
            {submitting ? '처리중...' : existingOrder ? '변경하기 →' : '예약하기 →'}
          </ReserveBtn>
        )}
      </BottomBar>
    </Wrap>
  );
}

const spin = keyframes`to { transform: rotate(360deg); }`;

const Wrap = styled.div`
  width: 100%; min-height: 100vh; background: #fff; color: #000;
  padding-bottom: calc(67px + env(safe-area-inset-bottom));
`;
const LoadingWrap = styled.div`
  display: flex; align-items: center; justify-content: center; min-height: 100vh;
`;
const Spinner = styled.div`
  width: 28px; height: 28px; border: 3px solid #eee; border-top-color: #000;
  border-radius: 50%; animation: ${spin} 0.8s linear infinite;
`;
const TopNav = styled.div`
  height: 60px; display: flex; align-items: center; padding: 0 20px;
  position: sticky; top: 0; background: #fff; z-index: 100;
`;
const BackBtn = styled.button`
  background: none; border: none; padding: 0; cursor: pointer;
  display: flex; align-items: center; margin-right: 8px;
`;
const NavTitle = styled.div`font-size: 14px; font-weight: 700; letter-spacing: -0.02em;`;

const ProductImageWrap = styled.div`
  position: relative; width: 100%; height: 340px; overflow: hidden; background: #f5f5f5;
`;
const SliderWrap = styled.div`
  position: relative; width: 100%; aspect-ratio: 4 / 5; overflow: hidden; background: #f5f5f5;
`;
const SliderTrack = styled.div`
  display: flex; height: 100%; transition: transform 0.3s ease;
`;
const SliderSlide = styled.div`
  position: relative; min-width: 100%; height: 100%; flex-shrink: 0;
`;
const DotRow = styled.div`
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 6px;
`;
const Dot = styled.button<{ active: boolean }>`
  width: ${p => p.active ? '20px' : '6px'}; height: 6px; border-radius: 3px;
  background: ${p => p.active ? '#fff' : 'rgba(255,255,255,0.5)'};
  border: none; padding: 0; cursor: pointer; transition: all 0.2s;
`;
const Body = styled.div`padding: 0 20px;`;

const ProductName = styled.div`
  margin-top: 20px; font-size: 16px; font-weight: 600; letter-spacing: -0.02em;
`;
const DeadlineRow = styled.div`display: flex; align-items: center; gap: 6px; margin-top: 4px;`;
const DeadlineDot = styled.div`width: 8px; height: 8px; border-radius: 50%; background: #777; flex-shrink: 0;`;
const DeadlineText = styled.div`font-size: 14px; font-weight: 500; color: #777; letter-spacing: -0.02em;`;
const ProductPrice = styled.div`
  margin-top: 8px; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;
`;
const HRule = styled.div`height: 4px; background: #ebebeb; margin: 20px -20px 0;`;
const SectionTitle = styled.div`
  font-size: 16px; font-weight: 700; letter-spacing: -0.02em; margin-top: 20px; margin-bottom: 12px;
`;

const SizeGuideWrap = styled.div`overflow-x: auto; margin: 0 -20px; padding: 0 20px;`;
const SizeGuideTable = styled.table`
  width: 100%; border-collapse: collapse; background: #f9f9f9; min-width: 320px;
`;
const SGTh = styled.th<{ isLabel?: boolean }>`
  padding: 6px 4px; font-size: 11px; font-weight: 700; letter-spacing: -0.02em;
  text-align: ${p => p.isLabel ? 'left' : 'center'}; border-bottom: 1px solid #ebebeb;
`;
const SizeSubText = styled.span`font-size: 9px; font-weight: 500; color: #888;`;
const SGTd = styled.td<{ isLabel?: boolean }>`
  padding: 6px 4px; font-size: 11px;
  font-weight: ${p => p.isLabel ? 700 : 500};
  text-align: ${p => p.isLabel ? 'left' : 'center'};
  border-bottom: 1px solid #ebebeb;
`;

const ColorRow = styled.div`display: flex; gap: 10px;`;
const ColorBtn = styled.button<{ active: boolean }>`
  flex: 1; height: 48px; border-radius: 8px;
  border: 1.5px solid ${p => p.active ? '#000' : '#e0e0e0'};
  background: ${p => p.active ? '#000' : '#fff'};
  color: ${p => p.active ? '#fff' : '#000'};
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 14px; font-weight: 700; letter-spacing: -0.02em; cursor: pointer; transition: all 0.15s;
`;
const ColorDot = styled.div<{ isWhite: boolean; active: boolean }>`
  width: 16px; height: 16px; border-radius: 50%;
  background: ${p => p.isWhite ? '#fff' : '#000'};
  border: ${p => p.isWhite ? `1.5px solid ${p.active ? '#fff' : '#ccc'}` : 'none'};
  flex-shrink: 0;
`;

const SizeList = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const SizeItem = styled.div<{ selected: boolean }>`
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-radius: 8px;
  background: ${p => p.selected ? '#000' : '#f9f9f9'}; transition: background 0.15s;
`;
const SizeName = styled.div<{ selected: boolean }>`
  font-size: 16px; font-weight: 700; color: ${p => p.selected ? '#fff' : '#000'};
`;
const QtyWrap = styled.div`display: flex; align-items: center; gap: 16px;`;
const QtyBtn = styled.button<{ selected: boolean }>`
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: ${p => p.selected ? 'rgba(255,255,255,0.15)' : '#e8e8e8'};
  color: ${p => p.selected ? '#fff' : '#000'};
  font-size: 18px; line-height: 1; display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  &:disabled { opacity: 0.25; }
`;
const QtyVal = styled.div<{ selected: boolean }>`
  font-size: 16px; font-weight: 700; min-width: 20px; text-align: center;
  color: ${p => p.selected ? '#fff' : '#ccc'};
`;
const NoticeText = styled.div`
  font-size: 12px; font-weight: 500; color: #5e5d5d; letter-spacing: -0.02em;
  line-height: 1.5; margin-bottom: 4px;
`;

const BottomBar = styled.div`
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px;
  padding: 8px 20px calc(8px + env(safe-area-inset-bottom));
  background: #fff; z-index: 1000;
`;
const ReserveBtn = styled.button`
  width: 100%; height: 51px; background: #000; color: #fff; border: none; border-radius: 4px;
  font-size: 18px; font-weight: 700; letter-spacing: -0.02em; cursor: pointer;
  &:disabled { background: #d1d1d6; cursor: not-allowed; }
`;

const DoneBox = styled.div`padding: 60px 24px 40px; text-align: center;`;
const SuccessIcon = styled.div`
  width: 56px; height: 56px; background: #000; color: #fff; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px; font-size: 24px; font-weight: 700;
`;
const DoneTitle = styled.h2`font-size: 24px; font-weight: 700; margin: 0 0 8px;`;
const DoneSub = styled.p`font-size: 14px; color: #888; margin: 0 0 32px;`;
const AccountCard = styled.div`
  background: #f9f9f9; padding: 20px; border-radius: 8px;
  display: flex; flex-direction: column; gap: 14px; margin-bottom: 32px; text-align: left;
`;
const AccountRow = styled.div<{ copyable?: boolean }>`
  display: flex; justify-content: space-between; font-size: 14px;
  cursor: ${p => p.copyable ? 'pointer' : 'default'};
  &:active { opacity: ${p => p.copyable ? 0.7 : 1}; }
`;
const ALabel = styled.div`color: #888;`;
const AValue = styled.div`font-weight: 700; color: #000;`;
const AValueCopy = styled.div`
  display: flex; align-items: center; gap: 6px;
  font-weight: 700; color: #2D478C;
`;
const CopyIcon = styled.span`
  display: flex; align-items: center; gap: 2px;
  font-size: 11px; font-weight: 600; color: #2D478C;
`;
const CopyToast = styled.div`
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.75); color: #fff; padding: 10px 20px;
  border-radius: 20px; font-size: 13px; font-weight: 500; z-index: 9999;
  white-space: nowrap;
`;
const ActionBtn = styled.button`
  width: 100%; background: #000; color: #fff; border: none; border-radius: 8px;
  height: 51px; font-size: 16px; font-weight: 700; cursor: pointer;
`;

const CopyAccountBtn = styled.button`
  width: 100%; background: #fff; color: #000; border: 1px solid #e0e0e0; border-radius: 8px;
  height: 44px; font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 12px;
`;

const ClosedBox = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: calc(100vh - 60px); padding: 40px 24px; text-align: center;
  background: #fff;
`;
const ClosedIcon = styled.div`font-size: 48px; margin-bottom: 16px;`;
const ClosedTitle = styled.h2`font-size: 22px; font-weight: 700; margin: 0 0 12px; color: #111 !important;`;
const ClosedDesc = styled.p`font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 32px; white-space: pre-line;`;

const DistributeNotice = styled.div`
  margin-top: 16px; padding: 16px; background: #f0f4ff; border-radius: 8px;
  font-size: 13px; color: #2D478C; line-height: 1.6; text-align: center;
`;
