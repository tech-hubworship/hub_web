"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styled from '@emotion/styled';

const SIZES = ['S', 'M', 'L', 'XL', '2XL'];
const COLORS = [
  { value: 'black', label: 'Black', bg: '#111', text: '#fff' },
  { value: 'white', label: 'White', bg: '#fff', text: '#111' },
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

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login?redirect=/hub_up/tshirt'); return; }
    if (status !== 'authenticated') return;
    fetch('/api/hub-up/tshirt')
      .then((r) => r.json())
      .then((d) => {
        setConfig(d.config || {});
        if (d.order) {
          setExistingOrder(d.order);
          setItems(d.order.items || []);
        }
      })
      .finally(() => setLoading(false));
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

  return (
    <Wrap>
      <TopNav><BackBtn onClick={() => router.back()}>←</BackBtn></TopNav>
      <Content>
        <PageTitle>티셔츠 {existingOrder ? '변경' : '신청'}</PageTitle>
        <PageDesc>사이즈와 수량을 선택해주세요.</PageDesc>

        {COLORS.map((color) => (
          <ColorSection key={color.value}>
            <ColorHeader bg={color.bg} text={color.text}>
              <ColorDot bg={color.bg} text={color.text} />
              {color.label}
              <ColorPrice>개당 {Number(config[`tshirt_price_${color.value}`] || 0).toLocaleString()}원</ColorPrice>
            </ColorHeader>
            <SizeGrid>
              {SIZES.map((size) => {
                const qty = getQty(color.value, size);
                return (
                  <SizeCard key={size} selected={qty > 0}>
                    <SizeName>{size}</SizeName>
                    <QtyControl>
                      <QtyBtn onClick={() => setQty(color.value, size, Math.max(0, qty - 1))}>−</QtyBtn>
                      <QtyNum>{qty}</QtyNum>
                      <QtyBtn onClick={() => setQty(color.value, size, qty + 1)}>+</QtyBtn>
                    </QtyControl>
                  </SizeCard>
                );
              })}
            </SizeGrid>
          </ColorSection>
        ))}

        {totalCount > 0 && (
          <SummaryBox>
            <SummaryTitle>선택 내역</SummaryTitle>
            {items.map((item) => (
              <SummaryRow key={`${item.color}-${item.size}`}>
                <span>{item.color === 'black' ? 'Black' : 'White'} {item.size}</span>
                <span>{item.quantity}개</span>
              </SummaryRow>
            ))}
            <SummaryTotal>총 {totalCount}개</SummaryTotal>
          </SummaryBox>
        )}

        <SubmitBtn disabled={!totalCount || submitting} onClick={handleSubmit}>
          {submitting ? '처리 중...' : existingOrder ? '변경하기' : '신청하기'}
        </SubmitBtn>

        {config.tshirt_change_deadline && (
          <DeadlineNote>변경 가능 기간: ~{config.tshirt_change_deadline}</DeadlineNote>
        )}
      </Content>
    </Wrap>
  );
}

const PRIMARY = '#F25246';
const Wrap = styled.div`width: 100%; min-height: 100vh; background: #FAFAFA; font-family: -apple-system, sans-serif;`;
const LoadingWrap = styled.div`display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #888;`;
const TopNav = styled.div`height: 56px; display: flex; align-items: center; padding: 0 16px; background: #fff;`;
const BackBtn = styled.button`background: none; border: none; font-size: 20px; cursor: pointer; padding: 8px;`;
const Content = styled.div`padding: 24px 20px 100px;`;
const PageTitle = styled.h1`font-size: 22px; font-weight: 700; color: #111; margin: 0 0 8px 0;`;
const PageDesc = styled.p`font-size: 14px; color: #888; margin: 0 0 28px 0;`;
const ColorSection = styled.div`margin-bottom: 28px;`;
const ColorHeader = styled.div<{ bg: string; text: string }>`
  display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700;
  color: #111; margin-bottom: 12px;
`;
const ColorDot = styled.div<{ bg: string; text: string }>`
  width: 20px; height: 20px; border-radius: 50%; background: ${(p) => p.bg};
  border: 1px solid #E5E5EA;
`;
const ColorPrice = styled.span`font-size: 13px; color: #888; font-weight: 400; margin-left: auto;`;
const SizeGrid = styled.div`display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;`;
const SizeCard = styled.div<{ selected: boolean }>`
  border: 1.5px solid ${(p) => p.selected ? PRIMARY : '#E5E5EA'};
  border-radius: 10px; padding: 10px 4px; text-align: center;
  background: ${(p) => p.selected ? '#FFF5F5' : '#fff'};
`;
const SizeName = styled.div`font-size: 13px; font-weight: 600; color: #111; margin-bottom: 8px;`;
const QtyControl = styled.div`display: flex; align-items: center; justify-content: center; gap: 4px;`;
const QtyBtn = styled.button`width: 22px; height: 22px; border-radius: 50%; border: 1px solid #E5E5EA; background: #fff; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;`;
const QtyNum = styled.span`font-size: 13px; font-weight: 600; min-width: 16px; text-align: center;`;
const SummaryBox = styled.div`background: #fff; border-radius: 12px; padding: 16px; margin: 20px 0;`;
const SummaryTitle = styled.div`font-size: 14px; font-weight: 700; color: #111; margin-bottom: 12px;`;
const SummaryRow = styled.div`display: flex; justify-content: space-between; font-size: 14px; color: #444; margin-bottom: 6px;`;
const SummaryTotal = styled.div`font-size: 15px; font-weight: 700; color: ${PRIMARY}; text-align: right; margin-top: 8px; padding-top: 8px; border-top: 1px solid #F0F0F0;`;
const SubmitBtn = styled.button`width: 100%; padding: 16px; background: ${PRIMARY}; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; &:disabled { background: #E5E5EA; cursor: not-allowed; }`;
const DeadlineNote = styled.p`font-size: 12px; color: #888; text-align: center; margin-top: 12px;`;
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
