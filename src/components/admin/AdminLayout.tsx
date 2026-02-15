// 파일 경로: src/components/admin/AdminLayout.tsx

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import { useAdminMDI, TabInfo } from '@src/contexts/AdminMDIContext';
import * as S from '@src/views/AdminPage/mdi-style';

interface AdminLayoutProps {
  children?: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  const {
    openTabs,
    activeTabId,
    openTab,
    closeTab,
    setActiveTab,
    getAccessibleMenus,
  } = useAdminMDI();

  useEffect(() => {
    if (status === 'authenticated' && !session?.user?.isAdmin) {
      alert("⛔️ 관리자만 접근할 수 있는 페이지입니다.");
      router.replace('/');
    }
    if (status === 'unauthenticated') {
      const currentPath = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [status, session, router]);

  if (status === 'loading' || !session?.user?.isAdmin) {
    return (
      <S.LoadingContainer>
        <S.LoadingSpinner />
        <S.LoadingText>Loading...</S.LoadingText>
      </S.LoadingContainer>
    );
  }

  const roles = session.user.roles || [];
  // AdminLayout은 더 이상 사용되지 않으므로 빈 배열 반환 (MDIAdminPage 사용)
  const accessibleMenus: TabInfo[] = [];

  // 메뉴 클릭 핸들러
  const handleMenuClick = (menu: TabInfo) => {
    openTab(menu);
  };

  // 탭 클릭 핸들러
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  // 탭 닫기 핸들러
  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  // 모바일 메뉴 토글
  const handleMobileMenuToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // 현재 활성 탭 정보
  const activeTab = openTabs.find(tab => tab.id === activeTabId);

  return (
    <S.MDILayout>
      {/* 사이드바 오버레이 (모바일) */}
      <S.SidebarOverlay 
        visible={!sidebarCollapsed} 
        onClick={() => setSidebarCollapsed(true)} 
      />

      {/* 사이드바 */}
      <S.MDISidebar collapsed={sidebarCollapsed}>
        <S.SidebarHeader>
          <S.Logo>
            <S.LogoIcon>⚡</S.LogoIcon>
            {!sidebarCollapsed && <S.LogoText>HUB Admin</S.LogoText>}
            <S.ToggleButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              {sidebarCollapsed ? '→' : '←'}
            </S.ToggleButton>
          </S.Logo>
        </S.SidebarHeader>

        <S.NavSection>
          <S.NavGroup>
            {!sidebarCollapsed && <S.NavGroupTitle>메뉴</S.NavGroupTitle>}
            {accessibleMenus
              .filter(menu => !menu.path.includes('/admin/photos/') && !menu.path.includes('/admin/video-event/'))
              .map((menu) => (
                <S.NavItem
                  key={menu.id}
                  active={activeTabId === menu.id}
                  onClick={() => handleMenuClick(menu)}
                >
                  <S.NavIcon collapsed={sidebarCollapsed}>{menu.icon}</S.NavIcon>
                  {!sidebarCollapsed && <S.NavText>{menu.title}</S.NavText>}
                </S.NavItem>
              ))}
          </S.NavGroup>

        </S.NavSection>

        {/* 사용자 정보 */}
        <S.UserSection>
          <S.UserCard collapsed={sidebarCollapsed}>
            <S.UserAvatar>
              {session.user.name?.charAt(0) || 'U'}
            </S.UserAvatar>
            {!sidebarCollapsed && (
              <S.UserInfo>
                <S.UserName>{session.user.name || '관리자'}</S.UserName>
                <S.UserRole>{roles.join(', ') || '관리자'}</S.UserRole>
              </S.UserInfo>
            )}
          </S.UserCard>
        </S.UserSection>
      </S.MDISidebar>

      {/* 메인 콘텐츠 영역 */}
      <S.MDIMain sidebarCollapsed={sidebarCollapsed}>
        {/* 탭 바 */}
        <S.TabBar>
          <S.MobileMenuButton onClick={handleMobileMenuToggle}>
            ☰
          </S.MobileMenuButton>
          {openTabs.map((tab) => (
            <S.Tab
              key={tab.id}
              active={activeTabId === tab.id}
              onClick={() => handleTabClick(tab.id)}
            >
              <S.TabIcon>{tab.icon}</S.TabIcon>
              <S.TabTitle>{tab.title}</S.TabTitle>
              {openTabs.length > 1 && (
                <S.TabCloseButton onClick={(e) => handleTabClose(e, tab.id)}>
                  ×
                </S.TabCloseButton>
              )}
            </S.Tab>
          ))}
        </S.TabBar>

        {/* 콘텐츠 패널 */}
        <S.ContentPanel key={activeTabId}>
          {activeTabId === 'dashboard' && (
            <DashboardContent 
              session={session} 
              accessibleMenus={accessibleMenus}
              onMenuClick={handleMenuClick}
            />
          )}
          {activeTabId !== 'dashboard' && children}
        </S.ContentPanel>
      </S.MDIMain>
    </S.MDILayout>
  );
}

// 대시보드 콘텐츠 컴포넌트
interface DashboardContentProps {
  session: any;
  accessibleMenus: TabInfo[];
  onMenuClick: (menu: TabInfo) => void;
}

function DashboardContent({ session, accessibleMenus, onMenuClick }: DashboardContentProps) {
  const menuItems = accessibleMenus.filter(m => m.id !== 'dashboard');

  return (
    <>
      <S.DashboardWelcome>
        <S.WelcomeTitle>환영합니다, {session.user.name || '관리자'}님! 👋</S.WelcomeTitle>
        <S.WelcomeSubtitle>
          HUB 관리자 대시보드에서 시스템을 관리할 수 있습니다.
        </S.WelcomeSubtitle>
      </S.DashboardWelcome>

      <S.SectionTitle>📋 빠른 액세스</S.SectionTitle>
      <S.MenuGrid>
        {menuItems.map((menu) => (
          <S.MenuCard key={menu.id} onClick={() => onMenuClick(menu)}>
            <S.MenuCardIcon>{menu.icon}</S.MenuCardIcon>
            <S.MenuCardTitle>{menu.title}</S.MenuCardTitle>
            <S.MenuCardDescription>
              관리 메뉴
            </S.MenuCardDescription>
          </S.MenuCard>
        ))}
      </S.MenuGrid>
    </>
  );
}

