// 파일 경로: src/views/AdminPage/MDIAdminPage.tsx

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAdminMDI, TabInfo } from '@src/contexts/AdminMDIContext';
import * as S from './mdi-style';

// 동적으로 로드할 콘텐츠 컴포넌트들
import UsersAdminPage from '@src/views/AdminPage/users';
import RolesAdminPage from '@src/views/AdminPage/roles';
import TechInquiriesPage from '@src/views/AdminPage/tech-inquiries';
import AdventPostsAdminPage from '@src/views/AdminPage/advent';
import AttendanceContent from '@src/views/AdminPage/advent/AttendanceContent';
import AdventStatsPage from '@src/views/AdminPage/advent/StatsContent';
import ManageContent from '@src/views/AdminPage/photos/ManageContent';
import ReservationsContent from '@src/views/AdminPage/photos/ReservationsContent';
import MenuManagementPage from '@src/views/AdminPage/menu-management';
import BibleCardAdminPage from '@src/views/AdminPage/bible-card';
import BibleCardPastorPage from '@src/views/AdminPage/bible-card/PastorPage';
import BibleCardCompletePage from '@src/views/AdminPage/bible-card/CompletePage';

// 메뉴 ID와 컴포넌트 매핑 (동적 렌더링용)
const MENU_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'users': UsersAdminPage,
  'roles': RolesAdminPage,
  'tech-inquiries': TechInquiriesPage,
  'advent-posts': AdventPostsAdminPage,
  'advent-attendance': AttendanceContent,
  'advent-stats': AdventStatsPage,
  'photos-manage': ManageContent,
  'photos-reservations': ReservationsContent,
  'bible-card-applications': BibleCardAdminPage,
  'bible-card-pastor': BibleCardPastorPage,
  'bible-card-complete': BibleCardCompletePage,
  'menu-management': MenuManagementPage,
};

// 확장된 TabInfo 타입 (description 포함)
interface ExtendedTabInfo extends TabInfo {
  description?: string;
  parent_id?: number | null;
}

export default function MDIAdminPage() {
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
      const currentPath = router.asPath;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [status, session, router]);

  const roles = session?.user?.roles || [];

  // DB에서 메뉴 목록 조회 (hooks는 항상 early return 이전에 호출되어야 함)
  const { data: dbMenus } = useQuery<Array<{
    id: number;
    menu_id: string;
    title: string;
    icon: string;
    path: string;
    parent_id: number | null;
    order_index: number;
    is_active: boolean;
    roles: string[];
    description?: string;
  }>>({
    queryKey: ['admin-menus'],
    queryFn: async () => {
      const response = await fetch('/api/admin/menus');
      if (!response.ok) throw new Error('메뉴 목록을 가져오는 데 실패했습니다.');
      return response.json();
    },
    enabled: !!session?.user?.isAdmin,
  });

  // DB 메뉴를 TabInfo 형식으로 변환하고 권한 필터링 (hooks는 항상 early return 이전에 호출되어야 함)
  const accessibleMenus = React.useMemo(() => {
    if (!dbMenus) {
      // DB 메뉴가 없으면 빈 배열 반환 (하위 호환성 제거)
      return [];
    }

    // 활성화된 메뉴만 필터링
    const activeMenus = dbMenus.filter(menu => menu.is_active);

    // 사용자 권한과 메뉴 권한을 비교하여 접근 가능한 메뉴만 반환
    return activeMenus
      .filter(menu => {
        // 권한이 설정되지 않은 메뉴는 모든 관리자에게 표시
        if (!menu.roles || menu.roles.length === 0) {
          return true;
        }
        // 사용자가 가진 권한 중 하나라도 메뉴 권한에 포함되면 표시
        return menu.roles.some(menuRole => roles.includes(menuRole));
      })
      .map(menu => ({
        id: menu.menu_id,
        title: menu.title,
        icon: menu.icon,
        path: menu.path,
        requiredRoles: menu.roles || [],
        description: menu.description || '',
        parent_id: menu.parent_id,
      } as ExtendedTabInfo))
      .sort((a, b) => {
        const menuA = dbMenus.find(m => m.menu_id === a.id);
        const menuB = dbMenus.find(m => m.menu_id === b.id);
        return (menuA?.order_index || 0) - (menuB?.order_index || 0);
      });
  }, [dbMenus, roles]);

  // URL 쿼리 파라미터로 탭 자동 열기
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.isAdmin) return;
    
    const tabId = router.query.tab as string | undefined;
    if (tabId) {
      const menu = accessibleMenus.find(m => m.id === tabId);
      if (menu && activeTabId !== tabId) {
        openTab(menu);
        // 쿼리 파라미터 제거 (깔끔한 URL 유지)
        router.replace('/admin', undefined, { shallow: true });
      }
    }
  }, [router.query.tab, accessibleMenus, status, session, activeTabId, openTab, router]);

  if (status === 'loading' || !session?.user?.isAdmin) {
    return (
      <S.LoadingContainer>
        <S.LoadingSpinner />
        <S.LoadingText>Loading...</S.LoadingText>
      </S.LoadingContainer>
    );
  }

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

  // 현재 활성 탭에 따른 콘텐츠 렌더링
  const renderTabContent = () => {
    const activeMenu = accessibleMenus.find(m => m.id === activeTabId);
    
    // 대시보드
    if (activeTabId === 'dashboard') {
      return (
        <DashboardContent 
          session={session} 
          accessibleMenus={accessibleMenus}
          onMenuClick={handleMenuClick}
        />
      );
    }

    // 부모 메뉴가 서브메뉴 콘텐츠를 표시하는 경우 (photos, advent, bible-card)
    if (activeTabId === 'photos') {
      return (
        <PhotosSubmenuContent 
          session={session}
          accessibleMenus={accessibleMenus}
          onMenuClick={handleMenuClick}
        />
      );
    }
    if (activeTabId === 'advent') {
      return (
        <AdventSubmenuContent 
          session={session}
          accessibleMenus={accessibleMenus}
          onMenuClick={handleMenuClick}
        />
      );
    }
    if (activeTabId === 'bible-card') {
      return (
        <BibleCardSubmenuContent 
          session={session}
          accessibleMenus={accessibleMenus}
          onMenuClick={handleMenuClick}
        />
      );
    }

    // 동적 컴포넌트 매핑
    const Component = MENU_COMPONENTS[activeTabId];
    if (Component) {
      return <Component />;
    }

    // 컴포넌트가 없는 경우 Coming Soon 표시
    return <ComingSoonContent title={activeMenu?.title || activeTabId} />;
  };

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
          <S.Logo style={{ justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}>
            {sidebarCollapsed ? (
              <S.ToggleButton onClick={() => setSidebarCollapsed(false)}>
                ☰
              </S.ToggleButton>
            ) : (
              <>
                <S.LogoIcon>⚡</S.LogoIcon>
                <S.LogoText>HUB Admin</S.LogoText>
                <S.ToggleButton onClick={() => setSidebarCollapsed(true)}>
                  ←
                </S.ToggleButton>
              </>
            )}
          </S.Logo>
        </S.SidebarHeader>

        <S.NavSection>
          <S.NavGroup>
            {!sidebarCollapsed && <S.NavGroupTitle>메뉴</S.NavGroupTitle>}
            
            {/* accessibleMenus를 기반으로 동적으로 메뉴 렌더링 */}
            {accessibleMenus
              .filter(menu => {
                // 대시보드는 항상 표시
                if (menu.id === 'dashboard') return true;
                // 하위 메뉴는 별도 처리 (parent_id가 있는 메뉴는 하위 메뉴)
                const dbMenu = dbMenus?.find(m => m.menu_id === menu.id);
                if (dbMenu?.parent_id) return false;
                return true;
              })
              .map(menu => {
                // 하위 메뉴 찾기 (DB에서 parent_id로 찾기)
                const dbMenu = dbMenus?.find(m => m.menu_id === menu.id);
                const accessibleSubMenus: TabInfo[] = dbMenu
                  ? accessibleMenus
                      .filter(subMenu => {
                        const subDbMenu = dbMenus?.find(m => m.menu_id === subMenu.id);
                        return subDbMenu?.parent_id === dbMenu.id;
                      })
                      .sort((a, b) => {
                        const menuA = dbMenus?.find(m => m.menu_id === a.id);
                        const menuB = dbMenus?.find(m => m.menu_id === b.id);
                        return (menuA?.order_index || 0) - (menuB?.order_index || 0);
                      })
                  : []

                return (
                  <React.Fragment key={menu.id}>
                    <S.NavItem
                      active={activeTabId === menu.id}
                      onClick={() => handleMenuClick(menu)}
                    >
                      <S.NavIcon collapsed={sidebarCollapsed}>{menu.icon}</S.NavIcon>
                      {!sidebarCollapsed && <S.NavText>{menu.title}</S.NavText>}
                    </S.NavItem>
                    {/* 하위 메뉴 표시 */}
                    {!sidebarCollapsed && accessibleSubMenus.length > 0 && (
                      <>
                        {accessibleSubMenus.map(subMenu => (
                          <S.NavItem
                            key={subMenu.id}
                            active={activeTabId === subMenu.id}
                            onClick={() => handleMenuClick(subMenu)}
                            isSubItem
                          >
                            <S.NavIcon collapsed={sidebarCollapsed}>{subMenu.icon}</S.NavIcon>
                            <S.NavText>{subMenu.title}</S.NavText>
                          </S.NavItem>
                        ))}
                      </>
                    )}
                  </React.Fragment>
                );
              })}
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
              {/* 대시보드 탭은 닫기 버튼 표시 안함 */}
              {tab.id !== 'dashboard' && (
                <S.TabCloseButton onClick={(e) => handleTabClose(e, tab.id)}>
                  ×
                </S.TabCloseButton>
              )}
            </S.Tab>
          ))}
        </S.TabBar>

        {/* 콘텐츠 패널 */}
        <S.ContentPanel key={activeTabId}>
          {renderTabContent()}
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
  const roles = session?.user?.roles || [];
  
  // 빠른 액세스에는 최상위 메뉴만 표시 (하위 메뉴 제외) + 권한 필터링
  const menuItems = accessibleMenus.filter(m => {
    // 대시보드는 제외
    if (m.id === 'dashboard') return false;
    
    // 권한 필터링: requiredRoles가 있으면 사용자가 해당 권한을 가져야 함
    if (m.requiredRoles && m.requiredRoles.length > 0) {
      const hasPermission = m.requiredRoles.some(role => roles.includes(role));
      if (!hasPermission) return false;
    }
    
    // 하위 메뉴는 제외 (parent_id가 있는 경우)
    const extendedMenu = m as ExtendedTabInfo;
    if (extendedMenu.parent_id) return false;
    
    return true;
  });

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
        {menuItems.map((menu) => {
          const extendedMenu = menu as ExtendedTabInfo;
          return (
            <S.MenuCard key={menu.id} onClick={() => onMenuClick(menu)}>
              <S.MenuCardIcon>{menu.icon}</S.MenuCardIcon>
              <S.MenuCardTitle>{menu.title}</S.MenuCardTitle>
              <S.MenuCardDescription>
                {extendedMenu.description || '관리 메뉴'}
              </S.MenuCardDescription>
            </S.MenuCard>
          );
        })}
      </S.MenuGrid>
    </>
  );
}

// 사진팀 서브메뉴 콘텐츠
interface SubmenuContentProps {
  session?: any;
  accessibleMenus?: TabInfo[];
  onMenuClick: (menu: TabInfo) => void;
}

function PhotosSubmenuContent({ session, accessibleMenus, onMenuClick }: SubmenuContentProps) {
  const roles = session?.user?.roles || [];
  
  // accessibleMenus에서 사진팀 관련 메뉴만 필터링 + 권한 필터링
  const photosMenus = (accessibleMenus || []).filter(m => {
    // 사진팀 관련 경로만
    if (!m.path.includes('/admin/photos/')) return false;
    
    // 권한 필터링: requiredRoles가 있으면 사용자가 해당 권한을 가져야 함
    if (m.requiredRoles && m.requiredRoles.length > 0) {
      const hasPermission = m.requiredRoles.some(role => roles.includes(role));
      if (!hasPermission) return false;
    }
    
    return true;
  });

  return (
    <>
      <S.DashboardWelcome>
        <S.WelcomeTitle>사진팀 관리 대시보드 📷</S.WelcomeTitle>
        <S.WelcomeSubtitle>
          사진팀이 할 수 있는 업무를 선택해주세요.
        </S.WelcomeSubtitle>
      </S.DashboardWelcome>

      <S.SectionTitle>📋 빠른 액세스</S.SectionTitle>
      <S.MenuGrid>
        {photosMenus.map((menu) => {
          const extendedMenu = menu as ExtendedTabInfo;
          return (
            <S.MenuCard key={menu.id} onClick={() => onMenuClick(menu)}>
              <S.MenuCardIcon>{menu.icon}</S.MenuCardIcon>
              <S.MenuCardTitle>{menu.title}</S.MenuCardTitle>
              <S.MenuCardDescription>
                {extendedMenu.description || '관리 메뉴'}
              </S.MenuCardDescription>
            </S.MenuCard>
          );
        })}
      </S.MenuGrid>
    </>
  );
}

// 대림절 서브메뉴 콘텐츠
function AdventSubmenuContent({ session, accessibleMenus, onMenuClick }: SubmenuContentProps) {
  const roles = session?.user?.roles || [];
  
  // accessibleMenus에서 대림절 관련 메뉴만 필터링 + 권한 필터링
  const adventMenus = (accessibleMenus || []).filter(m => {
    // 대림절 관련 경로만
    if (!m.path.includes('/admin/advent/')) return false;
    
    // 권한 필터링: requiredRoles가 있으면 사용자가 해당 권한을 가져야 함
    if (m.requiredRoles && m.requiredRoles.length > 0) {
      const hasPermission = m.requiredRoles.some(role => roles.includes(role));
      if (!hasPermission) return false;
    }
    
    return true;
  });

  return (
    <>
      <S.DashboardWelcome>
        <S.WelcomeTitle>대림절 관리 대시보드 🎄</S.WelcomeTitle>
        <S.WelcomeSubtitle>
          대림절 콘텐츠를 관리할 수 있습니다.
        </S.WelcomeSubtitle>
      </S.DashboardWelcome>

      <S.SectionTitle>📋 빠른 액세스</S.SectionTitle>
      <S.MenuGrid>
        {adventMenus.map((menu) => {
          const extendedMenu = menu as ExtendedTabInfo;
          return (
            <S.MenuCard key={menu.id} onClick={() => onMenuClick(menu)}>
              <S.MenuCardIcon>{menu.icon}</S.MenuCardIcon>
              <S.MenuCardTitle>{menu.title}</S.MenuCardTitle>
              <S.MenuCardDescription>
                {extendedMenu.description || '관리 메뉴'}
              </S.MenuCardDescription>
            </S.MenuCard>
          );
        })}
      </S.MenuGrid>
    </>
  );
}

// 말씀카드 서브메뉴 콘텐츠
function BibleCardSubmenuContent({ session, accessibleMenus, onMenuClick }: SubmenuContentProps) {
  const roles = session?.user?.roles || [];
  
  // accessibleMenus에서 말씀카드 관련 메뉴만 필터링 + 권한 필터링
  const bibleCardMenus = (accessibleMenus || []).filter(m => {
    // 말씀카드 관련 경로만
    if (!m.path.includes('/admin/bible-card/')) return false;
    
    // 권한 필터링: requiredRoles가 있으면 사용자가 해당 권한을 가져야 함
    if (m.requiredRoles && m.requiredRoles.length > 0) {
      const hasPermission = m.requiredRoles.some(role => roles.includes(role));
      if (!hasPermission) return false;
    }
    
    return true;
  });

  return (
    <>
      <S.DashboardWelcome>
        <S.WelcomeTitle>말씀카드 관리 대시보드 📜</S.WelcomeTitle>
        <S.WelcomeSubtitle>
          말씀카드 신청 현황 및 관리를 할 수 있습니다.
        </S.WelcomeSubtitle>
      </S.DashboardWelcome>

      <S.SectionTitle>📋 빠른 액세스</S.SectionTitle>
      <S.MenuGrid>
        {bibleCardMenus.map((menu) => {
          const extendedMenu = menu as ExtendedTabInfo;
          return (
            <S.MenuCard key={menu.id} onClick={() => onMenuClick(menu)}>
              <S.MenuCardIcon>{menu.icon}</S.MenuCardIcon>
              <S.MenuCardTitle>{menu.title}</S.MenuCardTitle>
              <S.MenuCardDescription>
                {extendedMenu.description || '관리 메뉴'}
              </S.MenuCardDescription>
            </S.MenuCard>
          );
        })}
      </S.MenuGrid>
    </>
  );
}

// Coming Soon 콘텐츠 (아직 구현되지 않은 페이지용)
function ComingSoonContent({ title }: { title: string }) {
  return (
    <S.DashboardWelcome>
      <S.WelcomeTitle>{title} 🚧</S.WelcomeTitle>
      <S.WelcomeSubtitle>
        이 기능은 현재 개발 중입니다. 곧 만나보실 수 있습니다!
      </S.WelcomeSubtitle>
    </S.DashboardWelcome>
  );
}

