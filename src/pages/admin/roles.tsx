// 파일 경로: src/pages/admin/roles.tsx

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import * as S from '@src/views/AdminPage/style';
import RolesAdminPage from '@src/views/AdminPage/roles';
import Link from 'next/link';

export default function AdminRolesPage() {
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
    }

    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, session, router]);

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

  const roles = session?.user?.roles || [];

  return (
    <S.AdminLayout>
      {/* 사이드바 오버레이 */}
      <S.SidebarOverlay
        visible={!sidebarCollapsed}
        onClick={() => setSidebarCollapsed(true)}
      />

      {/* 사이드바 */}
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

          <Link href="/admin/users" passHref legacyBehavior>
            <S.NavItem as="a">
              <S.NavIcon>👥</S.NavIcon>
              {!sidebarCollapsed && <S.NavText>회원관리</S.NavText>}
            </S.NavItem>
          </Link>

          <Link href="/admin/roles" passHref legacyBehavior>
            <S.NavItem as="a" active>
              <S.NavIcon>🔐</S.NavIcon>
              {!sidebarCollapsed && <S.NavText>권한 관리</S.NavText>}
            </S.NavItem>
          </Link>

          {roles.includes('목회자') && (
            <>
              <Link href="/admin/advent" passHref legacyBehavior>
                <S.NavItem as="a">
                  <S.NavIcon>🎄</S.NavIcon>
                  {!sidebarCollapsed && <S.NavText>대림절 관리</S.NavText>}
                </S.NavItem>
              </Link>

              <Link href="/admin/advent/attendance" passHref legacyBehavior>
                <S.NavItem as="a">
                  <S.NavIcon>📅</S.NavIcon>
                  {!sidebarCollapsed && <S.NavText>대림절 출석 현황</S.NavText>}
                </S.NavItem>
              </Link>
            </>
          )}

          {roles.includes('MC') && (
            <>
              <Link href="/admin/photos" passHref legacyBehavior>
                <S.NavItem as="a">
                  <S.NavIcon>📷</S.NavIcon>
                  {!sidebarCollapsed && <S.NavText>사진 관리</S.NavText>}
                </S.NavItem>
              </Link>

              <Link href="/admin/tech-inquiries" passHref legacyBehavior>
                <S.NavItem as="a">
                  <S.NavIcon>💬</S.NavIcon>
                  {!sidebarCollapsed && <S.NavText>기술 문의</S.NavText>}
                </S.NavItem>
              </Link>
            </>
          )}
        </S.NavMenu>
      </S.Sidebar>

      {/* 메인 콘텐츠 */}
      <S.MainContent>
        <S.TopBar>
          <S.TopBarLeft>
            <S.MobileMenuButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              ☰
            </S.MobileMenuButton>
            <div>
              <S.PageTitle>권한 관리</S.PageTitle>
              <S.Breadcrumb>관리자 페이지 / 권한 관리</S.Breadcrumb>
            </div>
          </S.TopBarLeft>
        </S.TopBar>

        <S.ContentArea>
          <RolesAdminPage />
        </S.ContentArea>
      </S.MainContent>
    </S.AdminLayout>
  );
}

