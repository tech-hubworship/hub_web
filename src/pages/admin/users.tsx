// 파일 경로: src/pages/admin/users.tsx

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import * as S from '@src/views/AdminPage/style';
import UsersAdminPage from '@src/views/AdminPage/users';
import Link from 'next/link';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

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
        <S.SidebarOverlay visible={!sidebarCollapsed} onClick={() => setSidebarCollapsed(true)} />
        <S.Sidebar collapsed={sidebarCollapsed}>
          <S.SidebarHeader>
            <S.Logo>
              {!sidebarCollapsed && <S.LogoText>HUB Admin</S.LogoText>}
              <S.ToggleButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                {sidebarCollapsed ? '→' : '←'}
              </S.ToggleButton>
            </S.Logo>
          </S.SidebarHeader>

          <S.NavMenu>
            <Link href="/admin" passHref legacyBehavior>
              <S.NavItem as="a">
                <S.NavIcon>🏠</S.NavIcon>
                {!sidebarCollapsed && <S.NavText>대시보드</S.NavText>}
              </S.NavItem>
            </Link>

            <S.NavItem active>
              <S.NavIcon>👥</S.NavIcon>
              {!sidebarCollapsed && <S.NavText>회원관리</S.NavText>}
            </S.NavItem>

            {roles.includes('사진팀') && (
              <Link href="/admin/photos" passHref legacyBehavior>
                <S.NavItem as="a">
                  <S.NavIcon>📷</S.NavIcon>
                  {!sidebarCollapsed && <S.NavText>사진팀 관리</S.NavText>}
                </S.NavItem>
              </Link>
            )}

            {(roles.includes('디자인팀') || roles.includes('양육MC')) && (
              <Link href="/admin/design" passHref legacyBehavior>
                <S.NavItem as="a">
                  <S.NavIcon>🎨</S.NavIcon>
                  {!sidebarCollapsed && <S.NavText>디자인 관리</S.NavText>}
                </S.NavItem>
              </Link>
            )}

            {roles.includes('서기') && (
              <Link href="/admin/secretary" passHref legacyBehavior>
                <S.NavItem as="a">
                  <S.NavIcon>✍️</S.NavIcon>
                  {!sidebarCollapsed && <S.NavText>서기 관리</S.NavText>}
                </S.NavItem>
              </Link>
            )}
          </S.NavMenu>
        </S.Sidebar>

        <S.MainContent>
          <S.TopBar>
            <S.TopBarLeft>
              <S.MobileMenuButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                ☰
              </S.MobileMenuButton>
              <div>
                <S.PageTitle>회원관리</S.PageTitle>
                <S.Breadcrumb>관리자 페이지 / 회원관리</S.Breadcrumb>
              </div>
            </S.TopBarLeft>
            <S.TopBarRight>
              <S.UserInfo>
                <S.UserAvatar>
                  {session.user.name?.charAt(0) || 'U'}
                </S.UserAvatar>
                <S.UserDetails>
                  <S.UserName>{session.user.name || '관리자'}</S.UserName>
                  <S.UserRole>{roles.join(', ') || '관리자'}</S.UserRole>
                </S.UserDetails>
              </S.UserInfo>
            </S.TopBarRight>
          </S.TopBar>

          <S.ContentArea>
            <UsersAdminPage />
          </S.ContentArea>
        </S.MainContent>
    </S.AdminLayout>
  );
}

