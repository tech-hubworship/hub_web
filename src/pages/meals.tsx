import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import { format, parseISO, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import PageLayout from '../components/common/PageLayout';
import { useAuthStore, initializeAuthState } from '../store/auth';
import { supabase } from '../lib/supabase';
import Head from 'next/head';
import { NextPage } from 'next';

interface Meal {
  id: number;
  date: string;
  meal_type: string; // 'breakfast', 'lunch', 'dinner'
  menu: string;
  allergies?: string;
}

// 로딩 컴포넌트 구현
const Loading = ({ text }: { text: string }) => (
  <LoadingContainer>
    <LoadingText>{text}</LoadingText>
  </LoadingContainer>
);

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

const LoadingText = styled.div`
  font-size: 15px;
  color: #555;
`;

const MealsPage: NextPage = () => {
  const router = useRouter();
  const { phoneNumber, isAuthenticated } = useAuthStore();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllergies, setShowAllergies] = useState(false);
  
  // 화면에 표시할 고정 날짜 (2025년 5월 16일, 17일, 18일)
  const fixedDates = ['2025-05-16', '2025-05-17', '2025-05-18'];
  
  // 현재 선택된 날짜 인덱스 (0: 5월 16일, 1: 5월 17일, 2: 5월 18일)
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  
  useEffect(() => {
    // 인증 상태 확인
    if (typeof window !== 'undefined') {
      const isAuth = initializeAuthState();
      if (!isAuth && !useAuthStore.getState().isAuthenticated) {
        localStorage.setItem('login_redirect', '/meals');
        router.replace('/login');
        return;
      }
    }
    
    fetchMeals();
  }, [router]);
  
  const fetchMeals = async () => {
    setIsLoading(true);
    try {
      // 5월 16일~18일 식단만 가져오기
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .in('date', fixedDates)
        .order('date', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setMeals(data);
      }
    } catch (error) {
      console.error('식단 정보를 불러오는 중 오류가 발생했습니다:', error);
      alert('식단 정보를 불러오지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 날짜별로 식단을 그룹화
  const getMealsByDate = () => {
    const mealsByDate: { [key: string]: Meal[] } = {};
    
    // 빈 날짜를 먼저 초기화 (데이터가 없는 날짜도 표시하기 위함)
    fixedDates.forEach(date => {
      mealsByDate[date] = [];
    });
    
    // 가져온 식단 데이터 추가
    meals.forEach(meal => {
      const dateStr = meal.date;
      if (fixedDates.includes(dateStr)) {
        mealsByDate[dateStr].push(meal);
      }
    });
    
    return mealsByDate;
  };
  
  // 한글로 식사 유형 변환
  const getMealTypeName = (type: string) => {
    switch (type) {
      case 'breakfast': return '아침';
      case 'lunch': return '점심';
      case 'dinner': return '저녁';
      default: return type;
    }
  };
  
  const renderAllergies = (allergies?: string) => {
    if (!allergies || !showAllergies) return null;
    
    return (
      <AllergiesInfo>
        <AllergiesLabel>알레르기 정보:</AllergiesLabel>
        {allergies}
      </AllergiesInfo>
    );
  };
  
  const formattedDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'yyyy년 MM월 dd일 (eee)', { locale: ko });
    } catch (e) {
      return dateStr;
    }
  };
  
  const isToday = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return isSameDay(date, new Date());
    } catch (e) {
      return false;
    }
  };
  
  const mealsByDate = getMealsByDate();
  
  // 이전 날짜로 이동
  const goToPreviousDay = () => {
    if (currentDateIndex > 0) {
      setCurrentDateIndex(currentDateIndex - 1);
    }
  };
  
  // 다음 날짜로 이동
  const goToNextDay = () => {
    if (currentDateIndex < fixedDates.length - 1) {
      setCurrentDateIndex(currentDateIndex + 1);
    }
  };
  
  // 현재 선택된 날짜
  const currentDate = fixedDates[currentDateIndex];
  
  return (
    <PageLayout>
      <Head>
        <title>식단표 - 허브 커뮤니티</title>
      </Head>
      
      <Container>
        <Header>
          <Title>식단표</Title>
          <AllergyToggle>
            <input 
              type="checkbox" 
              id="showAllergies" 
              checked={showAllergies}
              onChange={() => setShowAllergies(!showAllergies)}
            />
            <label htmlFor="showAllergies">알레르기 정보 보기</label>
          </AllergyToggle>
        </Header>
        
        {isLoading ? (
          <Loading text="식단표 정보를 불러오는 중..." />
        ) : meals.length === 0 ? (
          <EmptyMessage>등록된 식단 정보가 없습니다.</EmptyMessage>
        ) : (
          <>
            <DateControls>
              <Button 
                onClick={goToPreviousDay} 
                disabled={currentDateIndex === 0}
              >
                &lt;
              </Button>
              <DateDisplay>{formattedDate(currentDate)}</DateDisplay>
              <Button 
                onClick={goToNextDay} 
                disabled={currentDateIndex === fixedDates.length - 1}
              >
                &gt;
              </Button>
            </DateControls>
            
            <DateSection isToday={isToday(currentDate)}>
              <MealsContainer>
                {mealsByDate[currentDate] && mealsByDate[currentDate].length > 0 ? 
                  mealsByDate[currentDate]
                    .sort((a, b) => {
                      const typeOrder = { breakfast: 1, lunch: 2, dinner: 3 };
                      return typeOrder[a.meal_type as keyof typeof typeOrder] - typeOrder[b.meal_type as keyof typeof typeOrder];
                    })
                    .map(meal => (
                      <MealCard key={meal.id}>
                        <MealType>{getMealTypeName(meal.meal_type)}</MealType>
                        <MealMenu>{meal.menu}</MealMenu>
                        {renderAllergies(meal.allergies)}
                      </MealCard>
                    ))
                  : (
                    <EmptyMealCard>
                      이 날짜의 식단 정보가 없습니다.
                    </EmptyMealCard>
                  )
                }
              </MealsContainer>
            </DateSection>
          </>
        )}
      </Container>
    </PageLayout>
  );
};

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
  padding-top: 88px; /* 헤더 높이만큼 상단 패딩 */
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: #222;
`;

const EventPeriod = styled.div`
  font-weight: bold;
  font-size: 22px;
  margin-bottom: 22px;
  color: #3a5fcc;
  padding: 8px 20px;
  background-color: #f0f5ff;
  border-radius: 20px;
`;

const DateControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
  padding: 0 10px;
`;

const DateDisplay = styled.div`
  font-weight: bold;
  font-size: 18px;
  color: #222;
  text-align: center;
  padding: 6px 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`;

const Button = styled.button`
  background-color: transparent;
  color: #222;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 700;
  transition: all 0.2s ease;
  min-width: 40px;
  
  &:hover:not(:disabled) {
    color: #4a6fdc;
    transform: translateY(-2px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    color: #cccccc;
    cursor: not-allowed;
  }
`;

const AllergyToggle = styled.div`
  display: flex;
  align-items: center;
  background-color: #fff8e6;
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid #ffe0b2;
  
  input {
    margin-right: 8px;
    width: 16px;
    height: 16px;
  }
  
  label {
    cursor: pointer;
    font-size: 14px;
    color: #d35400;
    font-weight: 600;
  }
`;

const DateSection = styled.div<{ isToday: boolean }>`
  background-color: ${props => props.isToday ? '#f0f8ff' : '#fff'};
  border-radius: 10px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: ${props => props.isToday ? '2px solid #4a90e2' : '1px solid #eee'};
  width: 100%;
`;

const MealsContainer = styled.div`
  padding: 28px 42px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;

const MealCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 24px 48px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  border: 1px solid #eee;
  transition: transform 0.2s ease;
  width: 100%;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
`;

const EmptyMealCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 28px 48px;
  text-align: center;
  color: #777;
  font-style: italic;
  font-size: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  width: 100%;
`;

const MealType = styled.div`
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 10px;
  color: #2980b9;
  display: inline-block;
  padding: 4px 10px;
  background-color: #e6f0ff;
  border-radius: 12px;
`;

const MealMenu = styled.div`
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-line;
  color: #222;
  margin-top: 10px;
  font-weight: 500;
`;

const AllergiesInfo = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #ddd;
  font-size: 14px;
  color: #444;
  line-height: 1.4;
`;

const AllergiesLabel = styled.span`
  font-weight: 700;
  margin-right: 6px;
  color: #c0392b;
  background-color: #ffecec;
  padding: 2px 6px;
  border-radius: 4px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 50px 0;
  font-size: 16px;
  color: #555;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #ddd;
`;

export default MealsPage; 