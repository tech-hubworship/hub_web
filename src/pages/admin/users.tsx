// 파일 경로: src/pages/admin/users.tsx
// 리팩토링: 사이드바만 제거, 메인 콘텐츠는 유지

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import * as S from '@src/views/AdminPage/style';
import UsersAdminPage from '@src/views/AdminPage/users';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      if (!session?.user?.isAdmin) {
        alert('⛔️ 관리자만 접근할 수 있는 페이지입니다.');
        router.replace('/');
        return;
      }
      
      // MC 권한 확인
      const roles = session.user.roles || [];
      if (!roles.includes('MC')) {
        alert('⛔️ MC 권한이 있는 관리자만 접근할 수 있습니다.');
        router.replace('/admin');
        return;
      }
    }
    
    if (status === 'unauthenticated') {
      const currentPath = router.asPath;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [status, session, router]);

  const roles = session?.user?.roles || [];
  const hasMCPermission = roles.includes('MC');

  if (status === 'loading' || !session?.user?.isAdmin || !hasMCPermission) {
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
              <S.PageTitle>회원관리</S.PageTitle>
              <S.Breadcrumb>관리자 페이지 / 회원관리</S.Breadcrumb>
            </div>
          </S.TopBarLeft>
        </S.TopBar>

        <S.ContentArea>
          <UsersAdminPage />
        </S.ContentArea>
      </S.MainContent>
    </S.AdminLayout>
  );
}

