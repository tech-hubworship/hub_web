// 파일 경로: src/pages/info/index.tsx

import PageLayout from "@src/components/common/PageLayout";
import { useRouter } from "next/router";
import Head from "next/head";
import * as S from "@src/views/InfoPage/style";
import { useSession, signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

// ⭐️ [수정] API로부터 받을 프로필 데이터 타입에 birth_date 추가
interface ProfileData {
  name: string;
  email: string;
  birth_date: string; // 생년월일 추가
  gender: 'M' | 'F';
  community: string;
  group_name: string;
  cell_name: string;
}

// 사용자 프로필을 가져오는 fetch 함수
const fetchProfile = async (): Promise<ProfileData> => {
  const response = await fetch('/api/user/profile');
  if (!response.ok) {
    throw new Error('프로필 정보를 가져오는데 실패했습니다.');
  }
  return response.json();
};

export default function MyInfoPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    },
  });

  const { data: profileData, error, isLoading } = useQuery<ProfileData, Error>({
    queryKey: ['userProfile', session?.user?.id],
    queryFn: fetchProfile,
    enabled: status === 'authenticated',
  });

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  const renderContent = () => {
    if (isLoading || status === 'loading') {
      return <S.LoadingText>정보를 불러오는 중...</S.LoadingText>;
    }

    if (error) {
      return <S.ErrorMessage>{error.message}</S.ErrorMessage>;
    }

    if (!profileData) {
      return <S.NoDataText>사용자 정보가 없습니다.</S.NoDataText>;
    }

    return (
      <S.Card>
        <S.InfoWrapper>
          <S.InfoItem><S.Label>이름</S.Label><S.Value>{profileData.name}</S.Value></S.InfoItem>
          <S.InfoItem><S.Label>이메일</S.Label><S.Value>{profileData.email}</S.Value></S.InfoItem>
          {/* ⭐️ [수정] 생년월일 항목을 화면에 표시 */}
          <S.InfoItem><S.Label>생년월일</S.Label><S.Value>{profileData.birth_date}</S.Value></S.InfoItem>
          <S.InfoItem><S.Label>공동체</S.Label><S.Value>{profileData.community}</S.Value></S.InfoItem>
          {/* '허브' 공동체일 때만 그룹과 다락방 정보 표시 */}
          {profileData.community === '허브' && (
            <>
              <S.InfoItem><S.Label>그룹</S.Label><S.Value>{profileData.group_name}</S.Value></S.InfoItem>
              <S.InfoItem><S.Label>다락방</S.Label><S.Value>{profileData.cell_name}</S.Value></S.InfoItem>
            </>
          )}
        </S.InfoWrapper>
        <S.LogoutButton onClick={handleLogout}>로그아웃</S.LogoutButton>
      </S.Card>
    );
  };

  return (
    <PageLayout>
      <Head><title>내 정보</title></Head>
      <S.Wrapper>
        <S.Title>내 정보</S.Title>
        {renderContent()}
      </S.Wrapper>
    </PageLayout>
  );
}