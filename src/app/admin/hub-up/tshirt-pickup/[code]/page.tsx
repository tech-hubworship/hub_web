"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styled from '@emotion/styled';

const PRIMARY = '#2D478C';

const COLOR_LABELS: Record<string, string> = {
  white: 'White',
  black: 'Black',
  navy: 'Navy',
};

interface OrderInfo {
  id: string;
  name: string;
  group_name: string;
  cell_name: string;
  phone: string;
  community: string;
  items: { color: string; size: string; quantity: number }[];
  deposit_confirm: boolean;
  status: string;
  received_at: string | null;
}

export default function TshirtPickupPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const code = params?.code as string;

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (authStatus !== 'authenticated') return;
    if (!(session?.user as any)?.isAdmin) {
      setError('관리자만 접근할 수 있습니다.');
      setLoading(false);
      return;
    }

    fetch(`/api/admin/hub-up/tshirt-pickup/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setOrder(data);
      })
      .catch(() => setError('정보를 불러오는 중 오류가 발생했습니다.'))
      .finally(() => setLoading(false));
  }, [authStatus, code, router, session]);

  const handleConfirm = async () => {
    if (!order) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/admin/hub-up/tshirt-pickup/${code}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { alert(data.error || '오류가 발생했습니다.'); return; }
      setOrder((prev) => prev ? { ...prev, received_at: new Date().toISOString(), status: 'distributed' } : prev);
      setDone(true);
    } finally {
      setConfirming(false);
    }
  };

  const handleUndo = async () => {
    if (!order) return;
    if (!confirm('수령 처리를 취소하시겠습니까?')) return;
    setUndoing(true);
    try {
      const res = await fetch(`/api/admin/hub-up/tshirt-pickup/${code}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { alert(data.error || '오류가 발생했습니다.'); return; }
      setOrder((prev) => prev ? { ...prev, received_at: null, status: 'confirmed' } : prev);
      setDone(false);
    } finally {
      setUndoing(false);
    }
  };

  if (authStatus === 'loading' || loading) {
    return <CenterWrap><Spinner /><LoadingText>확인 중...</LoadingText></CenterWrap>;
  }

  if (error) {
    return (
      <CenterWrap>
        <ErrorIcon>⚠️</ErrorIcon>
        <ErrorText>{error}</ErrorText>
        <BackBtn onClick={() => router.back()}>돌아가기</BackBtn>
      </CenterWrap>
    );
  }

  if (!order) return null;

  const isReceived = !!order.received_at;
  const isDeposited = order.status === 'confirmed' || order.status === 'distributed';

  return (
    <Wrap>
      {/* 상태 헤더 */}
      <StatusHeader received={isReceived}>
        <StatusIcon>{isReceived ? '✅' : '📦'}</StatusIcon>
        <StatusTitle>{isReceived ? '수령 완료' : '수령 대기'}</StatusTitle>
        {isReceived && order.received_at && (
          <StatusTime>
            {new Date(order.received_at).toLocaleString('ko-KR', {
              month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </StatusTime>
        )}
      </StatusHeader>

      <Content>
        {/* 인적 사항 */}
        <Card>
          <CardTitle>수령자 정보</CardTitle>
          <Row><Label>이름</Label><Value bold>{order.name}</Value></Row>
          <Row><Label>그룹</Label><Value>{order.group_name}{order.cell_name ? ` / ${order.cell_name}` : ''}</Value></Row>
          {order.community && <Row><Label>공동체</Label><Value>{order.community}</Value></Row>}
          {order.phone && <Row><Label>연락처</Label><Value>{order.phone}</Value></Row>}
          <Row>
            <Label>입금</Label>
            <Badge ok={isDeposited}>{isDeposited ? '확인완료' : '미확인'}</Badge>
          </Row>
        </Card>

        {/* 주문 내역 */}
        <Card>
          <CardTitle>주문 내역</CardTitle>
          {order.items.map((item) => (
            <Row key={`${item.color}-${item.size}`}>
              <Label>{COLOR_LABELS[item.color] || item.color} {item.size}</Label>
              <Value bold>{item.quantity}개</Value>
            </Row>
          ))}
          <TotalRow>
            <Label>총 수량</Label>
            <TotalValue>{order.items.reduce((s, i) => s + i.quantity, 0)}개</TotalValue>
          </TotalRow>
        </Card>

        {/* 입금 미확인 경고 */}
        {!isDeposited && (
          <WarningBox>
            <WarningIcon>⚠️</WarningIcon>
            <WarningText>입금이 확인되지 않은 주문입니다. 수령 처리 전 확인해주세요.</WarningText>
          </WarningBox>
        )}

        {/* 액션 버튼 */}
        {!isReceived ? (
          <ConfirmBtn onClick={handleConfirm} disabled={confirming}>
            {confirming ? '처리 중...' : '✅ 수령 완료 처리'}
          </ConfirmBtn>
        ) : (
          <>
            <ReceivedBanner>
              <ReceivedText>수령 처리가 완료되었습니다</ReceivedText>
            </ReceivedBanner>
            <UndoBtn onClick={handleUndo} disabled={undoing}>
              {undoing ? '취소 중...' : '↩ 수령 처리 취소'}
            </UndoBtn>
          </>
        )}
      </Content>
    </Wrap>
  );
}

/* ── Styled Components ── */
const Wrap = styled.div`
  min-height: 100vh;
  background: #F5F5F7;
  font-family: -apple-system, sans-serif;
`;

const CenterWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 12px;
  padding: 24px;
`;

const Spinner = styled.div`
  width: 36px;
  height: 36px;
  border: 3px solid #E5E5EA;
  border-top-color: ${PRIMARY};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const LoadingText = styled.div`font-size: 14px; color: #888;`;
const ErrorIcon = styled.div`font-size: 48px;`;
const ErrorText = styled.div`font-size: 16px; color: #d93025; text-align: center; font-weight: 600;`;
const BackBtn = styled.button`
  margin-top: 8px;
  padding: 10px 24px;
  background: #F5F5F5;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const StatusHeader = styled.div<{ received: boolean }>`
  background: ${(p) => p.received ? '#1a7f4b' : PRIMARY};
  color: #fff;
  padding: 32px 24px 28px;
  text-align: center;
  transition: background 0.3s;
`;

const StatusIcon = styled.div`font-size: 40px; margin-bottom: 8px;`;
const StatusTitle = styled.div`font-size: 22px; font-weight: 800;`;
const StatusTime = styled.div`font-size: 13px; opacity: 0.85; margin-top: 6px;`;

const Content = styled.div`padding: 16px 16px 80px;`;

const Card = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
`;

const CardTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: ${PRIMARY};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 14px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #F5F5F5;
  &:last-child { border-bottom: none; }
`;

const TotalRow = styled(Row)`
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid #E5E5EA;
  border-bottom: none;
`;

const Label = styled.div`font-size: 14px; color: #888;`;
const Value = styled.div<{ bold?: boolean }>`
  font-size: 14px;
  font-weight: ${(p) => p.bold ? 700 : 500};
  color: #111;
`;
const TotalValue = styled.div`font-size: 16px; font-weight: 800; color: ${PRIMARY};`;

const Badge = styled.span<{ ok: boolean }>`
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  background: ${(p) => p.ok ? '#E6F4EA' : '#FEF3C7'};
  color: ${(p) => p.ok ? '#278f5a' : '#D97706'};
`;

const WarningBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #FFF8E1;
  border: 1px solid #FFD54F;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
`;
const WarningIcon = styled.div`font-size: 18px; flex-shrink: 0;`;
const WarningText = styled.div`font-size: 13px; color: #7a5c00; line-height: 1.5;`;

const ConfirmBtn = styled.button`
  width: 100%;
  padding: 16px;
  background: ${PRIMARY};
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
  margin-top: 4px;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const ReceivedBanner = styled.div`
  background: #E6F4EA;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  margin-bottom: 10px;
`;
const ReceivedText = styled.div`font-size: 15px; font-weight: 700; color: #1a7f4b;`;

const UndoBtn = styled.button`
  width: 100%;
  padding: 13px;
  background: #fff;
  color: #888;
  border: 1px solid #E5E5EA;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
