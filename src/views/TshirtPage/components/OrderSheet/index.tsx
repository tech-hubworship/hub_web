import { useState, useEffect } from 'react';
import { supabase } from '@src/lib/supabase';
import { useAuthStore } from '@src/store/auth';
import * as S from './style';
import { useRouter } from 'next/router';
import OrderConfirmation from '../OrderConfirmation';
import { getCachedBankAccount, BankAccount } from '@src/lib/api/bank';

interface TshirtOption {
  id: number;
  size: string;
  color: string;
  stock: number;
  price: number;
}

interface PriceInfo {
  basePrice: number;
  bulkDiscountAmount: number;
  bulkDiscountMinQuantity: number;
  specialSizePrice: {
    size: string;
    price: number;
  }[];
}

interface CartItem {
  id: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface OrderSheetProps {
  tshirtId: number;
  options: TshirtOption[];
  priceInfo: PriceInfo;
  onClose: () => void;
}

// 장바구니 데이터 관련 로컬스토리지 키
const CART_STORAGE_KEY = 'tshirt_cart_data';
const REDIRECT_STORAGE_KEY = 'login_redirect';

export default function OrderSheet({ tshirtId, options, priceInfo, onClose }: OrderSheetProps) {
  const router = useRouter();
  const { phoneNumber, isAuthenticated } = useAuthStore();
  const [userName, setUserName] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [hasPendingOrders, setHasPendingOrders] = useState(false);
  const [isCheckingOrders, setIsCheckingOrders] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [bankAccount, setBankAccount] = useState<BankAccount>({
    bank: '',
    account: '',
    holder: ''
  });

  // 계좌 정보 불러오기
  useEffect(() => {
    async function loadBankAccount() {
      const account = await getCachedBankAccount();
      setBankAccount(account);
    }
    
    loadBankAccount();
  }, []);

  // 컴포넌트 마운트 시 로컬스토리지에서 장바구니 데이터 복원
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            setCartItems(parsedCart);
            calculateTotalPrice(parsedCart);
            console.log('장바구니 데이터 복원 완료:', parsedCart);
            localStorage.removeItem(CART_STORAGE_KEY); // 복원 후 삭제
          }
        } catch (e) {
          console.error('장바구니 데이터 복원 실패:', e);
        }
      }
    }
  }, []);

  // 사용자 이름 가져오기
  useEffect(() => {
    async function fetchUserName() {
      if (!isAuthenticated || !phoneNumber) return;
      try {
        // 1. 일반 회원 테이블에서 확인
        const { data, error } = await supabase
          .from('users')
          .select('name')
          .eq('phone_number', phoneNumber)
          .single();
        
        if (!error && data && data.name) {
          setUserName(data.name);
          return;
        }

        // 2. 티셔츠 구매 회원 테이블에서 확인
        const { data: tshirtUserData, error: tshirtUserError } = await supabase
          .from('tshirt_users')
          .select('name')
          .eq('phone_number', phoneNumber)
          .single();
        
        if (tshirtUserError) {
          console.error('사용자 정보 조회 중 오류:', tshirtUserError);
          return;
        }

        if (tshirtUserData && tshirtUserData.name) {
          setUserName(tshirtUserData.name);
        }
      } catch (err) {
        console.error('사용자 이름 조회 중 오류 발생:', err);
      }
    }
    
    fetchUserName();
  }, [isAuthenticated, phoneNumber]);

  // 총 가격 계산 함수
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

  // cartItems가 변경될 때마다 totalPrice 업데이트
  useEffect(() => {
    const { finalTotal } = calculateTotalPrice(cartItems);
    setTotalPrice(finalTotal);
  }, [cartItems]);

  // 사용자가 로그인되어 있는 경우 미입금/입금확인중 주문이 있는지 확인
  useEffect(() => {
    async function checkPendingOrders() {
      if (!isAuthenticated || !phoneNumber) return;
      
      setIsCheckingOrders(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('status')
          .eq('user_phone', phoneNumber)
          .in('status', ['미입금', '입금확인중']);
        
        if (error) throw error;
        
        setHasPendingOrders(data && data.length > 0);
      } catch (err) {
        console.error('주문 상태 확인 중 오류 발생:', err);
      } finally {
        setIsCheckingOrders(false);
      }
    }
    
    checkPendingOrders();
  }, [isAuthenticated, phoneNumber]);

  const calculateItemPrice = (size: string, quantity: number) => {
    const basePrice = size === '3XL' ? priceInfo.specialSizePrice[0].price : priceInfo.basePrice;
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0) + quantity;
    
    if (totalQuantity >= priceInfo.bulkDiscountMinQuantity) {
      return basePrice - priceInfo.bulkDiscountAmount;
    }
    return basePrice;
  };

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor || quantity === 0) return;
    
    const newItem: CartItem = {
      id: `${selectedColor}-${selectedSize}`,
      color: selectedColor,
      size: selectedSize,
      quantity: quantity,
      price: selectedSize === '3XL' ? 11000 : priceInfo.basePrice // 3XL은 11,000원, 나머지는 기본 가격
    };

    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === newItem.id);
      if (existingItem) {
        return prev.map(item => 
          item.id === newItem.id 
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prev, newItem];
    });

    setSelectedColor('');
    setSelectedSize('');
    setQuantity(0);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const saveCartAndRedirect = () => {
    // 장바구니 데이터를 로컬스토리지에 저장
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    
    // 현재 경로를 저장하여 로그인 후 돌아올 수 있도록 함
    localStorage.setItem(REDIRECT_STORAGE_KEY, '/tshirt');
    console.log('리다이렉션 경로 저장:', '/tshirt', REDIRECT_STORAGE_KEY);
    
    // 로그인 후 자동으로 주문 시트를 열기 위한 플래그 저장
    localStorage.setItem('open_order_sheet', 'true');
    
    // 로그인 페이지로 이동
    router.push('/login');
  };

  const handleProceedToConfirmation = async () => {
    if (cartItems.length === 0) {
      setError('장바구니가 비어있습니다.');
      return;
    }

    if (!isAuthenticated || !phoneNumber) {
      saveCartAndRedirect();
      return;
    }

    // 미입금이나 입금확인중 상태의 주문이 있는지 다시 확인
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status, order_id')
        .eq('user_phone', phoneNumber)
        .in('status', ['미입금', '입금확인중']);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // 미입금이나 입금확인중 상태의 주문이 있는 경우
        const orderIds = data.map(order => order.order_id).join(', ');
        setError(`이전 주문(#${orderIds})의 입금 처리가 완료되지 않았습니다. 입금 확인 후 다시 시도해주세요.`);
        return;
      }

      // 주문 확인 페이지로 이동
      setShowConfirmation(true);
      
    } catch (err) {
      console.error('주문 상태 확인 중 오류 발생:', err);
      setError('주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleOrder = async (depositorName: string) => {
    if (cartItems.length === 0) {
      setError('장바구니가 비어있습니다.');
      return;
    }

    try {
      // 1. 주문 생성
      const now = new Date().toISOString();
      const totalQuantity = getTotalQuantity();
      const { baseTotal, discountAmount, finalTotal } = calculateTotalPrice(cartItems);
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_phone: phoneNumber,
            order_date: now,
            status: '입금확인중',
            total_price: finalTotal,
            name: depositorName,
          }
        ])
        .select('order_id')
        .single();
      
      if (orderError) throw orderError;
      
      const orderId = orderData.order_id;
      
      // 2. 주문 항목 추가 (price 필드 제외)
      const orderItems = cartItems.map((item, index) => ({
        order_id: orderId,
        item_id: index + 1,
        tshirt_id: tshirtId,
        size: item.size,
        color: item.color,
        quantity: item.quantity
        // price 필드 제거
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;
      
      alert('주문이 완료되었습니다. 주문번호: ' + orderId + '\n입금 후 확인까지 시간이 소요될 수 있습니다.');
      setShowConfirmation(false);
      onClose();
    } catch (error: any) {
      console.error('주문 처리 중 오류 발생:', error);
      setError('주문 처리 중 오류가 발생했습니다.');
    }
  };

  const getTotalQuantity = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원';
  };

  const availableSizes = Array.from(new Set(options.map(option => option.size)));
  const availableColors = Array.from(new Set(options.map(option => option.color)));

  // 주문 확인 페이지
  if (showConfirmation) {
    return (
      <OrderConfirmation
        cartItems={cartItems}
        totalPrice={totalPrice}
        onCancel={() => setShowConfirmation(false)}
        onConfirm={handleOrder}
        bankAccount={bankAccount}
        formatPrice={formatPrice}
        userName={userName}
        userPhone={phoneNumber || undefined}
      />
    );
  }

  return (
    <S.Container>
      <S.Sheet>
        <S.Title>주문하기</S.Title>
        
        {hasPendingOrders && (
          <S.WarningMessage>
            입금 확인이 필요한 주문이 있습니다. 입금 확인 후 추가 주문이 가능합니다.
          </S.WarningMessage>
        )}
        
        <S.Section>
          <S.Label>사이즈</S.Label>
          <S.OptionGroup>
            {availableSizes.map(size => (
              <S.OptionButton
                key={size}
                selected={selectedSize === size}
                onClick={() => setSelectedSize(size)}
                disabled={hasPendingOrders}
              >
                {size}
              </S.OptionButton>
            ))}
          </S.OptionGroup>
        </S.Section>

        <S.Section>
          <S.Label>색상</S.Label>
          <S.OptionGroup>
            {availableColors.map(color => (
              <S.OptionButton
                key={color}
                selected={selectedColor === color}
                onClick={() => setSelectedColor(color)}
                disabled={hasPendingOrders}
              >
                {color}
              </S.OptionButton>
            ))}
          </S.OptionGroup>
        </S.Section>

        <S.Section>
          <S.Label>수량</S.Label>
          <S.QuantityControl>
            <S.QuantityButton
              onClick={() => handleQuantityChange(-1)}
              disabled={hasPendingOrders}
            >
              -
            </S.QuantityButton>
            <S.QuantityDisplay>{quantity}</S.QuantityDisplay>
            <S.QuantityButton
              onClick={() => handleQuantityChange(1)}
              disabled={hasPendingOrders}
            >
              +
            </S.QuantityButton>
          </S.QuantityControl>
        </S.Section>

        <S.AddToCartButton 
          onClick={handleAddToCart}
          disabled={hasPendingOrders}
        >
          장바구니 담기
        </S.AddToCartButton>

        {cartItems.length > 0 && (
          <S.CartSection>
            <S.CartTitle>장바구니 ({getTotalQuantity()}개)</S.CartTitle>
            {cartItems.map((item, index) => (
              <S.CartItem key={index}>
                <S.CartItemInfo>
                  <span>{item.color}</span>
                  <span>{item.size}</span>
                  <span>{item.quantity}개</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </S.CartItemInfo>
                <S.RemoveButton onClick={() => handleRemoveFromCart(index)}>
                  삭제
                </S.RemoveButton>
              </S.CartItem>
            ))}
            <S.TotalPriceSection>
              {getTotalQuantity() >= 2 && (
                <>
                  <S.DiscountNotice>
                    (2장 이상 구매 할인 적용: 장당 1,000원 할인)
                  </S.DiscountNotice>
                  <S.DiscountAmount>
                    할인 금액: -₩{calculateTotalPrice(cartItems).discountAmount.toLocaleString()}원
                  </S.DiscountAmount>
                </>
              )}
              <S.TotalPrice>
                총 결제금액: ₩{calculateTotalPrice(cartItems).finalTotal.toLocaleString()}원
              </S.TotalPrice>
            </S.TotalPriceSection>
          </S.CartSection>
        )}

        {error && <S.Error>{error}</S.Error>}

        <S.ButtonGroup>
          <S.CancelButton onClick={onClose}>취소</S.CancelButton>
          <S.OrderButton 
            onClick={handleProceedToConfirmation}
            disabled={hasPendingOrders || isCheckingOrders || cartItems.length === 0}
          >
            {!isAuthenticated ? '로그인 후 주문하기' : 
              hasPendingOrders ? '입금 확인 필요' :
              (cartItems.length > 0 ? `주문서 작성하기` : '주문하기')}
          </S.OrderButton>
        </S.ButtonGroup>
      </S.Sheet>
      <S.Overlay onClick={onClose} />
    </S.Container>
  );
} 