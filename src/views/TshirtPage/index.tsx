import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@src/lib/supabase';
import * as S from './style';
import PageLayout from '@src/components/common/PageLayout';
import OrderSheet from './components/OrderSheet';
import ImageSlider from './components/ImageSlider';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import styled from '@emotion/styled';

interface TshirtData {
  id: number;
  name: string;
  description: string;
  deadline: string;
}

interface TshirtOption {
  id: number;
  size: string;
  color: string;
  stock: number;
  price: number;
}

interface DeadlineInfo {
  display: string;
  rawDate: string;
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

interface OrderSheetItem {
  id: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

// 가격 정보는 컴포넌트 외부에 상수로 정의하여 불필요한 재생성 방지
const PRICE_INFO: PriceInfo = {
  basePrice: 10000,
  bulkDiscountAmount: 1000,
  bulkDiscountMinQuantity: 2,
  specialSizePrice: [
    { size: '3XL', price: 11000 }
  ]
};

const OrderButton = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background-color: #40a9ff;
  }
  
  &:disabled {
    background-color: #d9d9d9;
    color: rgba(0, 0, 0, 0.25);
    cursor: not-allowed;
  }
`;

export default function TshirtPage() {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);
  const router = useRouter();

  // YYYYMMDD 형식의 문자열을 Date 객체로 변환하는 함수 (메모이제이션)
  const parseDateFromString = useCallback((dateString: string) => {
    if (dateString.length !== 8) return null;
    
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1; // 월은 0-11로 표현
    const day = parseInt(dateString.substring(6, 8));
    
    return new Date(year, month, day);
  }, []);

  // 남은 날짜 계산 및 표시 형식 생성 함수 (메모이제이션)
  const formatDeadline = useCallback((dateString: string, dayInfo?: string): DeadlineInfo => {
    const deadlineDate = parseDateFromString(dateString);
    
    if (!deadlineDate) {
      return {
        display: dateString,
        rawDate: dateString
      };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 괄호 안에 표시할 날짜 정보. 우선 day 값을 사용하고, 없으면 날짜 형식 사용
    const displayDate = dayInfo || `${deadlineDate.getFullYear()}년 ${(deadlineDate.getMonth() + 1).toString().padStart(2, '0')}월 ${deadlineDate.getDate().toString().padStart(2, '0')}일`;
    
    let displayText = '';
    if (diffDays < 0) {
      displayText = `예약 마감됨 (${displayDate})`;
    } else if (diffDays === 0) {
      displayText = `오늘 마감! (${displayDate})`;
    } else {
      displayText = `예약 종료 ${diffDays}일 남음 (${displayDate})`;
    }
    
    return {
      display: displayText,
      rawDate: dateString
    };
  }, [parseDateFromString]);

  // React Query를 사용한 데이터 페칭
  const { data: tshirtData, isLoading: isTshirtLoading } = useQuery({
    queryKey: ['tshirt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tshirts')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as TshirtData;
    },
    staleTime: 5 * 60 * 1000, // 5분 동안 데이터를 신선하게 유지
  });

  // 옵션 데이터 페칭
  const { data: options = [], isLoading: isOptionsLoading } = useQuery({
    queryKey: ['tshirtOptions', tshirtData?.id],
    queryFn: async () => {
      if (!tshirtData?.id) return [];
      
      const { data, error } = await supabase
        .from('tshirt_options')
        .select('*')
        .eq('tshirt_id', tshirtData.id);
      
      if (error) throw error;
      
      // 옵션별 가격 설정
      return data.map(option => ({
        ...option,
        price: option.size === '3XL' ? PRICE_INFO.specialSizePrice[0].price : PRICE_INFO.basePrice
      })) as TshirtOption[];
    },
    enabled: !!tshirtData?.id, // tshirtData가 있을 때만 실행
    staleTime: 5 * 60 * 1000, // 5분 동안 데이터를 신선하게 유지
  });

  // 마감일 정보 페칭
  const { data: deadlineInfo, isLoading: isDeadlineLoading } = useQuery({
    queryKey: ['deadline'],
    queryFn: async () => {
      // 스케줄에서 티셔츠 예약 마감일 가져오기
      const { data, error } = await supabase
        .from('schedules')
        .select('title, day, end_time')
        .eq('title', '티셔츠 예약 마감')
        .single();
      
      if (!error && data) {
        // end_time으로 남은 날짜 계산하고, day 값을 괄호 안에 표시
        return formatDeadline(data.end_time, data.day);
      } else if (tshirtData) {
        return formatDeadline(tshirtData.deadline);
      }
      
      return null;
    },
    enabled: !!tshirtData, // tshirtData가 있을 때만 실행
    staleTime: 5 * 60 * 1000, // 5분 동안 데이터를 신선하게 유지
  });

  // 컴포넌트 마운트 시 로컬스토리지에서 주문 시트 상태 확인
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shouldOpenOrderSheet = localStorage.getItem('open_order_sheet') === 'true';
      if (shouldOpenOrderSheet) {
        // 주문 시트를 열고 플래그 제거
        setIsOrderSheetOpen(true);
        localStorage.removeItem('open_order_sheet');
      }
    }
  }, []);

  // Order Sheet를 열어주는 함수 (메모이제이션)
  const handleOrder = useCallback(() => {
    setIsOrderSheetOpen(true);
  }, []);

  // Order Sheet를 닫는 함수 (메모이제이션)
  const handleCloseOrderSheet = useCallback(() => {
    setIsOrderSheetOpen(false);
  }, []);

  // 로딩 상태 (메모이제이션)
  const isLoading = useMemo(() => 
    isTshirtLoading || isOptionsLoading || isDeadlineLoading,
  [isTshirtLoading, isOptionsLoading, isDeadlineLoading]);

  if (isLoading) {
    return (
      <PageLayout>
        <S.LoadingContainer>
          <S.LoadingSpinner />
          <S.LoadingText>티셔츠 정보를 불러오는 중...</S.LoadingText>
        </S.LoadingContainer>
      </PageLayout>
    );
  }

  if (!tshirtData) {
    return (
      <PageLayout>
        <S.ErrorContainer>
          <S.ErrorText>티셔츠 정보를 불러올 수 없습니다.</S.ErrorText>
          <S.RetryButton onClick={() => window.location.reload()}>
            다시 시도
          </S.RetryButton>
        </S.ErrorContainer>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <S.Container>
        <S.Content>
          <ImageSlider />

          <S.InfoSection>
            <S.ProductTitle>{tshirtData.name}</S.ProductTitle>
            <S.Deadline>{deadlineInfo?.display || tshirtData.deadline}</S.Deadline>
            <S.Price>{PRICE_INFO.basePrice.toLocaleString()}원~</S.Price>
            <S.Notice>
              ⭐️ 2장 이상 구매시 장당 {PRICE_INFO.bulkDiscountAmount.toLocaleString()}원 할인<br/>
              ⭐️ 3XL 사이즈는 {PRICE_INFO.specialSizePrice[0].price.toLocaleString()}원<br/>
              📞 4XL 이상 사이즈 및 기타 문의:  <br/><S.Link href="https://open.kakao.com/o/scWel1ph" target="_blank" rel="noopener noreferrer">https://open.kakao.com/o/scWel1ph</S.Link>
            </S.Notice>

            <S.SizeGuide>
              <S.SizeGuideTitle>사이즈 가이드</S.SizeGuideTitle>
              <S.SizeGuideContent>기쁨홀 안내데스크 옆에서 실제 티셔츠 사이즈를 확인해보세요! <br/> ⚠️정사이즈핏으로 여유 있는 사이즈 선택 추천드립니다.</S.SizeGuideContent>
              <S.Table>
                <thead>
                  <tr>
                    <th></th>
                    <th>S<br/>(85)</th>
                    <th>M<br/>(90)</th>
                    <th>L<br/>(95)</th>
                    <th>XL<br/>(100)</th>
                    <th>2XL<br/>(105)</th>
                    <th>3XL<br/>(110)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>가슴단면</th>
                    <td>47</td>
                    <td>49</td>
                    <td>52</td>
                    <td>54</td>
                    <td>56</td>
                    <td>59</td>
                  </tr>
                  <tr>
                    <th>총 길이</th>
                    <td>62</td>
                    <td>65</td>
                    <td>68</td>
                    <td>71</td>
                    <td>74</td>
                    <td>77</td>
                  </tr>
                </tbody>
              </S.Table>
            </S.SizeGuide>

            <S.ButtonGroup>
              <S.OrderButton onClick={handleOrder}>예약하기</S.OrderButton>
            </S.ButtonGroup>
          </S.InfoSection>
        </S.Content>
      </S.Container>

      {isOrderSheetOpen && (
        <OrderSheet 
          tshirtId={tshirtData.id}
          options={options}
          priceInfo={PRICE_INFO}
          onClose={handleCloseOrderSheet}
        />
      )}
    </PageLayout>
  );
} 