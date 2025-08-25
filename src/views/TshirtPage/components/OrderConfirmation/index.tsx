import React, { useState, useRef, useEffect } from 'react';
import * as S from './style';
import { useRouter } from 'next/router';

interface CartItem {
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface BankAccount {
  bank: string;
  account: string;
  holder: string;
}

interface OrderConfirmationProps {
  cartItems: CartItem[];
  totalPrice: number;
  bankAccount: BankAccount;
  onCancel: () => void;
  onConfirm: (depositorName: string) => void;
  formatPrice: (price: number) => string;
  userName?: string;
  userPhone?: string;
}

export default function OrderConfirmation({
  cartItems,
  totalPrice,
  bankAccount,
  onCancel,
  onConfirm,
  formatPrice,
  userName = '',
  userPhone = ''
}: OrderConfirmationProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [depositorName, setDepositorName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  
  // 초기 입금자명 설정
  useEffect(() => {
    // 사용자 이름과 전화번호 뒷자리(있는 경우)를 합쳐서 입금자명 생성
    const phoneLastDigits = userPhone ? userPhone.slice(-4) : '';
    const initialDepositorName = userName + (phoneLastDigits ? phoneLastDigits : '');
    setDepositorName(initialDepositorName);
  }, [userName, userPhone]);

  const copyToClipboard = (text: string, type: string) => {
    try {
      let copyText = '';
      
      if (type === 'account') {
        copyText = `${bankAccount.bank} ${bankAccount.account}`;
      } else if (type === 'depositor') {
        copyText = depositorName;
      }
      
      if (textAreaRef.current) {
        textAreaRef.current.value = copyText;
        textAreaRef.current.select();
        textAreaRef.current.setSelectionRange(0, 99999);

        if (document.execCommand('copy')) {
          textAreaRef.current.blur();
          setCopiedText(type);
          setTimeout(() => setCopiedText(null), 2000);
          return;
        }
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(copyText)
          .then(() => {
            setCopiedText(type);
            setTimeout(() => setCopiedText(null), 2000);
          })
          .catch(err => {
            console.error('클립보드 복사 중 오류가 발생했습니다:', err);
            alert('복사하지 못했습니다. 텍스트를 직접 선택하여 복사해주세요.');
          });
      } else {
        alert('이 브라우저에서는 자동 복사가 지원되지 않습니다. 텍스트를 직접 선택하여 복사해주세요.');
      }
    } catch (err) {
      console.error('복사 중 오류가 발생했습니다:', err);
      alert('복사 중 오류가 발생했습니다. 텍스트를 직접 선택하여 복사해주세요.');
    }
  };

  const calculateTotalPrice = (items: CartItem[]) => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const baseTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // 2장 이상 주문 시 장당 1,000원 할인
    const discountAmount = totalQuantity >= 2 ? totalQuantity * 1000 : 0;
    const finalTotal = baseTotal - discountAmount;
    
    return {
      baseTotal,
      discountAmount,
      finalTotal
    };
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onConfirm(depositorName);
      router.push('/myinfo');
    } catch (error) {
      console.error('주문 확인 처리 중 오류 발생:', error);
      alert('주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  return (
    <S.Container>
      <S.Sheet>
        <textarea
          ref={textAreaRef}
          readOnly
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '0',
            opacity: 0,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />
        
        <S.Title>주문 확인</S.Title>
        
        <S.Section>
          <S.SectionTitle>주문 상품</S.SectionTitle>
          <S.OrderList>
            {cartItems.map((item, index) => (
              <S.OrderItem key={index}>
                <S.OrderInfo>
                  <S.ProductName>
                    {item.color} / {item.size}
                  </S.ProductName>
                  <S.ProductDetails>
                    수량: {item.quantity}개
                  </S.ProductDetails>
                </S.OrderInfo>
                <S.ItemPrice>
                  {formatPrice(item.price * item.quantity)}
                </S.ItemPrice>
              </S.OrderItem>
            ))}
          </S.OrderList>
        </S.Section>
        
        <S.Section>
          <S.SectionTitle>결제 정보</S.SectionTitle>

            <S.PaymentDetail>
              <S.PaymentRow>
                <S.PaymentLabel>상품 금액</S.PaymentLabel>
                <S.PaymentValue>₩{calculateTotalPrice(cartItems).baseTotal.toLocaleString()}원</S.PaymentValue>
              </S.PaymentRow>
              {calculateTotalPrice(cartItems).discountAmount > 0 && (
                <>
                  <S.PaymentRow>
                    <S.PaymentLabel>할인 금액</S.PaymentLabel>
                    <S.PaymentValue style={{ color: '#E23D3D' }}>
                      -₩{calculateTotalPrice(cartItems).discountAmount.toLocaleString()}원
                    </S.PaymentValue>
                  </S.PaymentRow>
              
                </>
              )}
              <S.PaymentRow>
                <S.PaymentLabel>총 결제금액</S.PaymentLabel>
                <S.PaymentValue style={{ fontWeight: 'bold' }}>
                  ₩{calculateTotalPrice(cartItems).finalTotal.toLocaleString()}원
                </S.PaymentValue>
              </S.PaymentRow>
            </S.PaymentDetail>
        </S.Section>
        
        <S.Section>
          <S.SectionTitle>입금 계좌 정보</S.SectionTitle>
          <S.BankInfo>
            <S.StaticInfoRow>
              <S.InfoLabel>은행</S.InfoLabel>
              <S.InfoValue>{bankAccount.bank}</S.InfoValue>
            </S.StaticInfoRow>
            <S.StaticInfoRow>
              <S.InfoLabel>계좌번호</S.InfoLabel>
              <S.InfoValue>{bankAccount.account}</S.InfoValue>
            </S.StaticInfoRow>
            <S.StaticInfoRow>
              <S.InfoLabel>예금주</S.InfoLabel>
              <S.InfoValue>{bankAccount.holder}</S.InfoValue>
            </S.StaticInfoRow>
            <S.CopyButton onClick={() => copyToClipboard('', 'account')}>
              계좌정보 복사하기
              {copiedText === 'account' && <S.CopiedBadge>복사됨</S.CopiedBadge>}
            </S.CopyButton>
          </S.BankInfo>
        </S.Section>
        
        <S.Section>
          <S.SectionTitle>입금자 정보</S.SectionTitle>
          <S.DepositorInfo>
            <S.InfoInputRow>
              <S.InfoLabel>입금자명</S.InfoLabel>
              <S.DepositorInput 
                value={depositorName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositorName(e.target.value)}
                placeholder="이름+전화번호 뒷자리 (예: 홍길동1234)"
              />
            </S.InfoInputRow>
            <S.InfoNote>* 이미 송금했을 경우 실제 송금자명으로 수정 요망</S.InfoNote>
            <S.CopyButton onClick={() => copyToClipboard('', 'depositor')}>
              입금자명 복사하기
              {copiedText === 'depositor' && <S.CopiedBadge>복사됨</S.CopiedBadge>}
            </S.CopyButton>
          </S.DepositorInfo>
        </S.Section>
        
        <S.Notice>
          * 입금 확인 후 주문이 확정됩니다.<br />
          * 입금자명은 동일해야합니다. ex.홍길동1234 or 홍길동 <br />
        </S.Notice>
        
        <S.ButtonGroup>
          <S.CancelButton onClick={isSubmitting ? undefined : onCancel} disabled={isSubmitting}>뒤로가기</S.CancelButton>
          <S.ConfirmButton 
            onClick={handleConfirm} 
            disabled={isSubmitting}
          >
            {isSubmitting ? '처리중...' : '예약하기'}
          </S.ConfirmButton>
        </S.ButtonGroup>
      </S.Sheet>
      <S.Overlay onClick={onCancel} />
    </S.Container>
  );
} 