// 파일 경로: src/pages/admin/advent/index.tsx
// 리팩토링: 사이드바만 제거, 메인 콘텐츠는 유지

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import * as S from '@src/views/AdminPage/style';
import AdventPostsAdminPage from '@src/views/AdminPage/advent';

export default function AdminAdventPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      if (!session?.user?.isAdmin) {
        alert('⛔️ 관리자만 접근할 수 있는 페이지입니다.');
        router.replace('/');
        return;
      }
    }
    
    if (status === 'unauthenticated') {
      const currentPath = router.asPath;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [status, session, router]);

  if (status === 'loading' || !session?.user?.isAdmin) {
    return (
      <S.AdminLayout>
        <S.LoadingContainer>
          <S.LoadingSpinner />
          <S.LoadingText>Loading...</S.LoadingText>
        </S.LoadingContainer>
      </S.AdminLayout>
    );
  }

  return (
    <S.AdminLayout>
      {/* 사이드바 제거됨 - MDI 시스템 사용 */}
      
      {/* 메인 콘텐츠 영역 - 전체 너비 사용 */}
      <S.MainContent style={{ marginLeft: 0 }}>
        <S.TopBar>
          <S.TopBarLeft>
            <div>
              <S.PageTitle>대림절 관리</S.PageTitle>
              <S.Breadcrumb>관리자 페이지 / 대림절 관리</S.Breadcrumb>
            </div>
          </S.TopBarLeft>
        </S.TopBar>

        <S.ContentArea>
          <AdventPostsAdminPage />
        </S.ContentArea>
      </S.MainContent>
    </S.AdminLayout>
  );
}
