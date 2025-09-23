// 파일 경로: src/pages/Info/index.tsx

import PageLayout from "@src/components/common/PageLayout";
import { useRouter } from "next/router";
import Head from "next/head";
import * as S from "@src/views/InfoPage/style";
import { useSession, signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

// 추가: API로부터 받을 프로필 데이터 타입
interface ProfileData {
  id: number;
  name: string;
  email: string;
  birth_date: string;
  phone_number: string;
  cell_name: string;
  leader_name: string;
}

// 추가: 사용자 프로필을 가져오는 fetch 함수
const fetchProfile = async (): Promise<ProfileData> => {
  const response = await fetch('/api/user/profile');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '프로필 정보를 가져오는데 실패했습니다.');
  }
  return response.json();
};

export default function MyInfoPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true, // 변경: 세션 없으면 로그인 페이지로 자동 이동
    onUnauthenticated() {
      router.push('/login');
    },
  });

  // 변경: React Query를 사용하여 API로부터 데이터를 가져옵니다.
  const { data: profileData, error, isLoading } = useQuery<ProfileData, Error>({
    queryKey: ['userProfile', session?.user?.email],
    queryFn: fetchProfile,
    enabled: status === 'authenticated', // 세션이 있을 때만 쿼리 실행
  });

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  // 렌더링 로직을 함수로 분리
  const renderContent = () => {
    if (isLoading || status === 'loading') {
      return <S.LoadingText>정보를 불러오는 중...</S.LoadingText>;
    }

    if (error) {
      return (
        <>
          <S.ErrorMessage>{error.message}</S.ErrorMessage>
          <S.LogoutButton onClick={handleLogout}>로그인 페이지로</S.LogoutButton>
        </>
      );
    }

    if (!profileData) {
      return (
        <>
          <S.NoDataText>사용자 정보가 없습니다.</S.NoDataText>
          <S.LogoutButton onClick={handleLogout}>로그아웃</S.LogoutButton>
        </>
      );
    }

    return (
      <S.Card>
        <S.ProfileImage
          src={session?.user?.image || `https://www.gravatar.com/avatar/?d=retro`}
          alt="프로필 이미지"
        />
        <S.InfoWrapper>
          <S.InfoItem><S.Label>이름</S.Label><S.Value>{profileData.name}</S.Value></S.InfoItem>
          <S.InfoItem><S.Label>이메일</S.Label><S.Value>{profileData.email}</S.Value></S.InfoItem>
          <S.InfoItem><S.Label>전화번호</S.Label><S.Value>{profileData.phone_number}</S.Value></S.InfoItem>
          <S.InfoItem><S.Label>생년월일</S.Label><S.Value>{profileData.birth_date}</S.Value></S.InfoItem>
          <S.InfoItem><S.Label>다락방</S.Label><S.Value>{profileData.cell_name}</S.Value></S.InfoItem>
          <S.InfoItem><S.Label>순장</S.Label><S.Value>{profileData.leader_name}</S.Value></S.InfoItem>
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