// 파일 경로: src/pages/admin/advent/stats.tsx
// 리팩토링: 사이드바만 제거, 메인 콘텐츠는 유지

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import * as S from '@src/views/AdminPage/style';
import AdventStatsPage from '@src/views/AdminPage/advent/StatsContent';

export default function AdminAdventStatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const roles = session?.user?.roles || [];

  // 권한 체크
  useEffect(() => {
    if (status === 'authenticated') {
      if (!session?.user?.isAdmin) {
        alert('관리자만 접근 가능합니다.');
        router.replace('/');
      } else if (!roles.includes('목회자')) {
        alert('목회자 권한이 없습니다.');
        router.replace('/admin');
      }
    }

    if (status === 'unauthenticated') {
      const currentPath = router.asPath;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [status, session, router]);

  // 로딩 화면
  if (status === 'loading') {
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
              <S.PageTitle>대림절 통계</S.PageTitle>
              <S.Breadcrumb>관리자 페이지 / 대림절 통계</S.Breadcrumb>
            </div>
          </S.TopBarLeft>
        </S.TopBar>

        <S.ContentArea>
          <AdventStatsPage />
        </S.ContentArea>
      </S.MainContent>
    </S.AdminLayout>
  );
}

