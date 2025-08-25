import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useRouter } from 'next/router';
import { supabase } from '@src/lib/supabase';
import { useAuthStore, initializeAuthState } from '@src/store/auth';
import PageLayout from '@src/components/common/PageLayout';
import Head from 'next/head';

interface Accommodation {
  id: number;
  building: string;
  room_number: string;
  capacity: number;
  floor: number;
  description: string;
  image_url?: string;
}

interface UserAccommodation {
  id: number;
  user_phone: string;
  accommodation_id: number;
  accommodation?: Accommodation;
}

export default function AccommodationPage() {
  const router = useRouter();
  const { phoneNumber, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [userAccommodation, setUserAccommodation] = useState<UserAccommodation | null>(null);
  const [generalInfo, setGeneralInfo] = useState<string>('');
  const [roommates, setRoommates] = useState<{ name: string; phone_number: string }[]>([]);
  const [showPhone, setShowPhone] = useState(false);

  useEffect(() => {
    // 인증 상태 확인
    if (typeof window !== 'undefined') {
      const isAuth = initializeAuthState();
      if (!isAuth && !useAuthStore.getState().isAuthenticated) {
        localStorage.setItem('login_redirect', '/accommodation');
        router.replace('/login');
        return;
      }
    }

    const fetchAccommodationInfo = async () => {
      try {
        setLoading(true);
        
        if (!phoneNumber) {
          console.error('전화번호 정보가 없습니다.');
          setLoading(false);
          return;
        }
        
        // 일반 정보 가져오기
        const { data: infoData, error: infoError } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'accommodation_info')
          .single();
          
        if (!infoError && infoData) {
          setGeneralInfo(infoData.value);
        }
        
        // 사용자의 숙소 정보 가져오기
        const { data: userAccData, error: userAccError } = await supabase
          .from('user_accommodations')
          .select(`
            id,
            user_phone,
            accommodation_id,
            accommodations:accommodation_id (
              id,
              building,
              room_number,
              capacity,
              floor,
              description,
              image_url
            )
          `)
          .eq('user_phone', phoneNumber)
          .single();
          
        if (userAccError) {
          console.error('숙소 정보 로딩 중 오류 발생:', userAccError);
        } else if (userAccData) {
          // 데이터 형식 변환
          setUserAccommodation({
            id: userAccData.id,
            user_phone: userAccData.user_phone,
            accommodation_id: userAccData.accommodation_id,
            accommodation: userAccData.accommodations as unknown as Accommodation
          });
          
          // 같은 방 사용자 가져오기
          if (userAccData.accommodation_id) {
            const { data: roommatesData, error: roommatesError } = await supabase
              .from('user_accommodations')
              .select(`
                users:user_phone (
                  name,
                  phone_number
                )
              `)
              .eq('accommodation_id', userAccData.accommodation_id)
              .neq('user_phone', phoneNumber);
              
            if (!roommatesError && roommatesData) {
              // TypeScript 타입 문제를 해결하기 위해 타입 단언 사용
              const roommates: { name: string; phone_number: string }[] = [];
              
              // Supabase 응답 데이터를 any 타입으로 처리
              const data = roommatesData as any[];
              
              // 안전하게 데이터 추출
              for (let i = 0; i < data.length; i++) {
                const item = data[i];
                if (item && item.users) {
                  const user = item.users;
                  if (user && typeof user.name === 'string' && typeof user.phone_number === 'string') {
                    roommates.push({
                      name: user.name,
                      phone_number: user.phone_number
                    });
                  }
                }
              }
              
              setRoommates(roommates);
            }
          }
        }
      } catch (error) {
        console.error('숙소 정보 로딩 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccommodationInfo();
  }, [phoneNumber, router]);
  
  const formatPhoneNumber = (phone: string) => {
    if (!phone || phone.length < 10) return phone;
    
    // 전화번호 형식에 맞게 변환 (예: 010-1234-5678)
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  };

  return (
    <PageLayout>
      <Head>
        <title>숙소 정보 | 허브 커뮤니티</title>
      </Head>
      
      <Container>
        <Title>숙소 정보</Title>
        
        {loading ? (
          <LoadingWrapper>로딩 중...</LoadingWrapper>
        ) : userAccommodation && userAccommodation.accommodation ? (
          <>
            <AccommodationCard>
              {userAccommodation.accommodation.image_url && (
                <AccommodationImage 
                  src={userAccommodation.accommodation.image_url} 
                  alt="숙소 이미지" 
                />
              )}
              
              <AccommodationDetails>
                <BuildingInfo>
                  <BuildingName>{userAccommodation.accommodation.building}</BuildingName>
                  <RoomNumber>{userAccommodation.accommodation.room_number}호</RoomNumber>
                </BuildingInfo>
                
                <InfoRow>
                  <InfoLabel>층</InfoLabel>
                  <InfoValue>{userAccommodation.accommodation.floor}층</InfoValue>
                </InfoRow>
                
                <InfoRow>
                  <InfoLabel>정원</InfoLabel>
                  <InfoValue>{userAccommodation.accommodation.capacity}인실</InfoValue>
                </InfoRow>
                
                {userAccommodation.accommodation.description && (
                  <Description>
                    {userAccommodation.accommodation.description}
                  </Description>
                )}
              </AccommodationDetails>
            </AccommodationCard>
            
            {roommates.length > 0 && (
              <RoommatesSection>
                <SectionTitle>룸메이트</SectionTitle>
                <RoommateList>
                  {roommates.map((roommate, index) => (
                    <RoommateItem key={index}>
                      <RoommateName>{roommate.name}</RoommateName>
                      {showPhone && (
                        <RoommatePhone>{formatPhoneNumber(roommate.phone_number)}</RoommatePhone>
                      )}
                    </RoommateItem>
                  ))}
                </RoommateList>
                <TogglePhoneButton onClick={() => setShowPhone(!showPhone)}>
                  {showPhone ? '전화번호 숨기기' : '전화번호 보기'}
                </TogglePhoneButton>
              </RoommatesSection>
            )}
          </>
        ) : (
          <NoAccommodationMessage>
            아직 배정된 숙소 정보가 없습니다.
          </NoAccommodationMessage>
        )}
        
        {generalInfo && (
          <GeneralInfoSection>
            <SectionTitle>안내사항</SectionTitle>
            <GeneralInfoContent dangerouslySetInnerHTML={{ __html: generalInfo }} />
          </GeneralInfoSection>
        )}
        
        <BackButton onClick={() => router.back()}>
          돌아가기
        </BackButton>
      </Container>
    </PageLayout>
  );
}

// 스타일 컴포넌트
const Container = styled.div`
  max-width: 768px;
  margin: 0 auto;
  padding: 20px;
  padding-top: 88px; /* 헤더 높이만큼 상단 패딩 추가 */
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 24px;
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #6b7280;
`;

const AccommodationCard = styled.div`
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const AccommodationImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const AccommodationDetails = styled.div`
  padding: 16px;
`;

const BuildingInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
`;

const BuildingName = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
`;

const RoomNumber = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #3b82f6;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const InfoLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const InfoValue = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
`;

const Description = styled.div`
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  line-height: 1.5;
  color: #4b5563;
`;

const RoommatesSection = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
`;

const RoommateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const RoommateItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
`;

const RoommateName = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
`;

const RoommatePhone = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const TogglePhoneButton = styled.button`
  background-color: transparent;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const NoAccommodationMessage = styled.div`
  background-color: #f3f4f6;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  color: #6b7280;
  margin-bottom: 20px;
`;

const GeneralInfoSection = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const GeneralInfoContent = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: #4b5563;
  
  p {
    margin-bottom: 12px;
  }
  
  ul, ol {
    margin-left: 20px;
    margin-bottom: 16px;
  }
  
  li {
    margin-bottom: 8px;
  }
`;

const BackButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #f3f4f6;
  color: #4b5563;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e5e7eb;
  }
`; 