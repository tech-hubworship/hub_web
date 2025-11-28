// 파일 경로: src/views/AdminPage/MDIAdminPage.tsx

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAdminMDI, TabInfo, ADMIN_MENUS } from '@src/contexts/AdminMDIContext';
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

// 메뉴 카드 설명
const MENU_DESCRIPTIONS: Record<string, string> = {
  'dashboard': 'HUB 관리자 대시보드에서 시스템을 관리할 수 있습니다.',
  'users': '계정관리 및 권한관리',
  'roles': '시스템 권한(역할)을 관리합니다',
  'photos': '사진팀이 할 수 있는 업무를 선택해주세요.',
  'photos-manage': '사진을 업로드하고 수정, 삭제, 미리보기를 할 수 있습니다',
  'photos-reservations': '사진 예약 현황을 확인하고 관리합니다',
  'design': '디자인 작업 관리 및 통계',
  'secretary': '회의록 및 문서 관리',
  'advent': '대림절 콘텐츠를 관리할 수 있습니다.',
  'advent-posts': '대림절 말씀/영상/콘텐츠 관리',
  'advent-attendance': '대림절 출석 정보 및 통계',
  'advent-stats': '대림절 묵상+출석 통계 및 그래프',
  'bible-card': '말씀카드 신청 현황 및 목회자 배정',
  'bible-card-applications': '말씀카드 신청 현황 관리 및 목회자 배정',
  'bible-card-pastor': '배정된 지체들에게 말씀 작성',
  'bible-card-complete': '완료된 말씀카드 관리 및 CSV 추출',
  'tech-inquiries': '사용자 문의 및 버그 리포트 관리',
  'menu-management': '관리자 메뉴와 권한을 설정합니다',
};

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
      // DB 메뉴가 없으면 기본 ADMIN_MENUS 사용 (하위 호환성)
      return getAccessibleMenus(roles);
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
      }))
      .sort((a, b) => {
        const menuA = dbMenus.find(m => m.menu_id === a.id);
        const menuB = dbMenus.find(m => m.menu_id === b.id);
        return (menuA?.order_index || 0) - (menuB?.order_index || 0);
      });
  }, [dbMenus, roles, getAccessibleMenus]);

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
    switch (activeTabId) {
      case 'dashboard':
        return (
          <DashboardContent 
            session={session} 
            accessibleMenus={accessibleMenus}
            onMenuClick={handleMenuClick}
          />
        );
      case 'users':
        return <UsersAdminPage />;
      case 'roles':
        return <RolesAdminPage />;
      case 'photos':
        return (
          <PhotosSubmenuContent 
            onMenuClick={handleMenuClick}
          />
        );
      case 'tech-inquiries':
        return <TechInquiriesPage />;
      case 'design':
        return <ComingSoonContent title="디자인 관리" />;
      case 'secretary':
        return <ComingSoonContent title="서기 관리" />;
      case 'advent':
        return (
          <AdventSubmenuContent 
            onMenuClick={handleMenuClick}
          />
        );
      case 'advent-posts':
        return <AdventPostsAdminPage />;
      case 'advent-attendance':
        return <AttendanceContent />;
      case 'advent-stats':
        return <AdventStatsPage />;
      case 'photos-manage':
        return <ManageContent />;
      case 'photos-reservations':
        return <ReservationsContent />;
      case 'bible-card':
        return (
          <BibleCardSubmenuContent 
            onMenuClick={handleMenuClick}
          />
        );
      case 'bible-card-applications':
        return <BibleCardAdminPage />;
      case 'bible-card-pastor':
        return <BibleCardPastorPage />;
      case 'bible-card-complete':
        return <BibleCardCompletePage />;
      case 'menu-management':
        return <MenuManagementPage />;
      default:
        return <ComingSoonContent title={activeTabId} />;
    }
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
                if (dbMenus) {
                  const dbMenu = dbMenus.find(m => m.menu_id === menu.id);
                  if (dbMenu?.parent_id) return false;
                } else {
                  // DB 메뉴가 없을 때는 기존 로직 사용
                  if (menu.id.includes('-')) return false;
                }
                return true;
              })
              .map(menu => {
                // 하위 메뉴 찾기 (DB에서 parent_id로 찾기)
                let accessibleSubMenus: TabInfo[] = [];
                if (dbMenus) {
                  const dbMenu = dbMenus.find(m => m.menu_id === menu.id);
                  if (dbMenu) {
                    accessibleSubMenus = accessibleMenus
                      .filter(subMenu => {
                        const subDbMenu = dbMenus.find(m => m.menu_id === subMenu.id);
                        return subDbMenu?.parent_id === dbMenu.id;
                      })
                      .sort((a, b) => {
                        const menuA = dbMenus.find(m => m.menu_id === a.id);
                        const menuB = dbMenus.find(m => m.menu_id === b.id);
                        return (menuA?.order_index || 0) - (menuB?.order_index || 0);
                      });
                  }
                } else {
                  // DB 메뉴가 없을 때는 기존 하위 메뉴 로직 사용
                  const subMenus: { [key: string]: string[] } = {
                    'photos': ['photos-manage', 'photos-reservations'],
                    'advent': ['advent-posts', 'advent-attendance'],
                    'bible-card': ['bible-card-applications', 'bible-card-pastor', 'bible-card-complete'],
                  };
                  const hasSubMenus = subMenus[menu.id] && subMenus[menu.id].length > 0;
                  if (hasSubMenus) {
                    accessibleSubMenus = subMenus[menu.id]
                      .filter(subId => accessibleMenus.some(m => m.id === subId))
                      .map(subId => {
                        const subMenu = ADMIN_MENUS.find(m => m.id === subId);
                        return subMenu!;
                      })
                      .filter(Boolean);
                  }
                }

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
  // 빠른 액세스에는 최상위 메뉴만 표시 (하위 메뉴 제외)
  const menuItems = accessibleMenus.filter(m => {
    if (m.id === 'dashboard') return false;
    // 하위 메뉴는 제외 (parent_id가 있거나 경로에 하위 경로가 있는 경우)
    if (m.path.includes('/admin/photos/') && m.path !== '/admin/photos') return false;
    if (m.path.includes('/admin/advent/') && m.path !== '/admin/advent') return false;
    if (m.path.includes('/admin/bible-card/') && m.path !== '/admin/bible-card') return false;
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
        {menuItems.map((menu) => (
          <S.MenuCard key={menu.id} onClick={() => onMenuClick(menu)}>
            <S.MenuCardIcon>{menu.icon}</S.MenuCardIcon>
            <S.MenuCardTitle>{menu.title}</S.MenuCardTitle>
            <S.MenuCardDescription>
              {MENU_DESCRIPTIONS[menu.id] || '관리 메뉴'}
            </S.MenuCardDescription>
          </S.MenuCard>
        ))}
      </S.MenuGrid>
    </>
  );
}

// 사진팀 서브메뉴 콘텐츠
interface SubmenuContentProps {
  onMenuClick: (menu: TabInfo) => void;
}

function PhotosSubmenuContent({ onMenuClick }: SubmenuContentProps) {
  const photosMenus = ADMIN_MENUS.filter(m => 
    m.path.includes('/admin/photos/') 
  );

  return (
    <>
      <S.DashboardWelcome>
        <S.WelcomeTitle>사진팀 관리 대시보드 📷</S.WelcomeTitle>
        <S.WelcomeSubtitle>
          사진팀이 할 수 있는 업무를 선택해주세요.
        </S.WelcomeSubtitle>
      </S.DashboardWelcome>

      <S.MenuGrid>
        {photosMenus.map((menu) => (
          <S.MenuCard key={menu.id} onClick={() => onMenuClick(menu)}>
            <S.MenuCardIcon>{menu.icon}</S.MenuCardIcon>
            <S.MenuCardTitle>{menu.title}</S.MenuCardTitle>
            <S.MenuCardDescription>
              {MENU_DESCRIPTIONS[menu.id] || '관리 메뉴'}
            </S.MenuCardDescription>
          </S.MenuCard>
        ))}
      </S.MenuGrid>
    </>
  );
}

// 대림절 서브메뉴 콘텐츠
function AdventSubmenuContent({ onMenuClick }: SubmenuContentProps) {
  const adventMenus = ADMIN_MENUS.filter(m => 
    m.path.includes('/admin/advent/') 
  );

  return (
    <>
      <S.DashboardWelcome>
        <S.WelcomeTitle>대림절 관리 대시보드 🎄</S.WelcomeTitle>
        <S.WelcomeSubtitle>
          대림절 콘텐츠를 관리할 수 있습니다.
        </S.WelcomeSubtitle>
      </S.DashboardWelcome>

      <S.MenuGrid>
        {adventMenus.map((menu) => (
          <S.MenuCard key={menu.id} onClick={() => onMenuClick(menu)}>
            <S.MenuCardIcon>{menu.icon}</S.MenuCardIcon>
            <S.MenuCardTitle>{menu.title}</S.MenuCardTitle>
            <S.MenuCardDescription>
              {MENU_DESCRIPTIONS[menu.id] || '관리 메뉴'}
            </S.MenuCardDescription>
          </S.MenuCard>
        ))}
      </S.MenuGrid>
    </>
  );
}

// 말씀카드 서브메뉴 콘텐츠
function BibleCardSubmenuContent({ onMenuClick }: SubmenuContentProps) {
  const bibleCardMenus = ADMIN_MENUS.filter(m => 
    m.path.includes('/admin/bible-card/') 
  );

  return (
    <>
      <S.DashboardWelcome>
        <S.WelcomeTitle>말씀카드 관리 대시보드 📜</S.WelcomeTitle>
        <S.WelcomeSubtitle>
          말씀카드 신청 현황 및 관리를 할 수 있습니다.
        </S.WelcomeSubtitle>
      </S.DashboardWelcome>

      <S.MenuGrid>
        {bibleCardMenus.map((menu) => (
          <S.MenuCard key={menu.id} onClick={() => onMenuClick(menu)}>
            <S.MenuCardIcon>{menu.icon}</S.MenuCardIcon>
            <S.MenuCardTitle>{menu.title}</S.MenuCardTitle>
            <S.MenuCardDescription>
              {MENU_DESCRIPTIONS[menu.id] || '관리 메뉴'}
            </S.MenuCardDescription>
          </S.MenuCard>
        ))}
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

