// 파일 경로: src/pages/admin/advent/stats.tsx

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import * as L from '@src/views/AdminPage/style';
import Link from 'next/link';
import AdventStatsPage from '@src/views/AdminPage/advent/StatsContent';

export default function AdminAdventStatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const roles = session?.user?.roles || [];

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

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
      router.replace('/login');
    }
  }, [status, session]);

  // 로딩 화면
  if (status === 'loading') {
    return (
      <L.AdminLayout>
        <L.LoadingContainer>
          <L.LoadingSpinner />
          <L.LoadingText>Loading...</L.LoadingText>
        </L.LoadingContainer>
      </L.AdminLayout>
    );
  }

  return (
    <L.AdminLayout>
      {/* --- Sidebar --- */}
      <L.SidebarOverlay
        visible={!sidebarCollapsed}
        onClick={() => setSidebarCollapsed(true)}
      />

      <L.Sidebar collapsed={sidebarCollapsed}>
        <L.SidebarHeader>
          <L.Logo>
            {!sidebarCollapsed && <L.LogoText>HUB Admin</L.LogoText>}
            <L.ToggleButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              {sidebarCollapsed ? '→' : '←'}
            </L.ToggleButton>
          </L.Logo>
        </L.SidebarHeader>

        <L.NavMenu>
          <Link href="/admin" passHref legacyBehavior>
            <L.NavItem as="a">
              <L.NavIcon>🏠</L.NavIcon>
              {!sidebarCollapsed && <L.NavText>대시보드</L.NavText>}
            </L.NavItem>
          </Link>

          {roles.includes('목회자') && (
            <>
              <Link href="/admin/advent" passHref legacyBehavior>
                <L.NavItem as="a">
                  <L.NavIcon>🎄</L.NavIcon>
                  {!sidebarCollapsed && <L.NavText>대림절 관리</L.NavText>}
                </L.NavItem>
              </Link>

              <Link href="/admin/advent/attendance" passHref legacyBehavior>
                <L.NavItem as="a">
                  <L.NavIcon>📅</L.NavIcon>
                  {!sidebarCollapsed && <L.NavText>대림절 출석 현황</L.NavText>}
                </L.NavItem>
              </Link>

              <Link href="/admin/advent/stats" passHref legacyBehavior>
                <L.NavItem as="a" active>
                  <L.NavIcon>📊</L.NavIcon>
                  {!sidebarCollapsed && <L.NavText>대림절 통계</L.NavText>}
                </L.NavItem>
              </Link>
            </>
          )}
        </L.NavMenu>
      </L.Sidebar>

      {/* --- Main Content --- */}
      <L.MainContent>
        <L.TopBar>
          <L.TopBarLeft>
            <L.MobileMenuButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              ☰
            </L.MobileMenuButton>
            <div>
              <L.PageTitle>대림절 통계</L.PageTitle>
              <L.Breadcrumb>관리자 페이지 / 대림절 통계</L.Breadcrumb>
            </div>
          </L.TopBarLeft>
        </L.TopBar>

        <L.ContentArea>
          <AdventStatsPage />
        </L.ContentArea>
      </L.MainContent>
    </L.AdminLayout>
  );
}

