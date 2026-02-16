import React from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAdminMDI, TabInfo } from '@src/contexts/AdminMDIContext';
import * as S from './mdi-style';

// 동적으로 로드할 콘텐츠 컴포넌트들
import UsersAdminPage from '@src/views/AdminPage/users';
import RolesAdminPage from '@src/views/AdminPage/roles';
import TechInquiriesPage from '@src/views/AdminPage/tech-inquiries';
import VideoEventPostsAdminPage from '@src/views/AdminPage/video-event';
import VideoEventAttendanceContent from '@src/views/AdminPage/video-event/AttendanceContent';
import VideoEventStatsPage from '@src/views/AdminPage/video-event/StatsContent';
import VideoEventCommentsContent from '@src/views/AdminPage/video-event/CommentsContent';
import { VIDEO_EVENT } from '@src/lib/video-event/constants';
import ManageContent from '@src/views/AdminPage/photos/ManageContent';
import ReservationsContent from '@src/views/AdminPage/photos/ReservationsContent';
import MenuManagementPage from '@src/views/AdminPage/menu-management';
import BibleCardAdminPage from '@src/views/AdminPage/bible-card';
import BibleCardPastorPage from '@src/views/AdminPage/bible-card/PastorPage';
import BibleCardCompletePage from '@src/views/AdminPage/bible-card/CompletePage';
import QrGenerator from '@src/views/AdminPage/attendance/QrGenerator';
import AttendanceList from '@src/views/AdminPage/attendance/AttendanceList';
import OdRosterManage from '@src/views/AdminPage/attendance/OdRosterManage';
import LateFeeManage from '@src/views/AdminPage/attendance/LateFeeManage';
import GlossaryAdminPage from '@src/views/AdminPage/apps/glossary';
import PrayerTimeAdminPage from '@src/views/AdminPage/apps/prayer-time';
import LostFoundAdminPage from '@src/views/AdminPage/apps/lost-found';
import CalendarAdminPage from '@src/views/AdminPage/calendar';
import RestaurantAdminPage from '@src/views/AdminPage/apps/restaurant';

// 확장된 TabInfo 타입 (description 포함)
interface ExtendedTabInfo extends TabInfo {
  description?: string;
  parent_id?: number | null;
}

// DB에 없어도 사이드바에 표시할 기본 탭 (MDI 전용 탭)
const BUILTIN_TABS: TabInfo[] = [
  { id: 'calendar', title: '캘린더', icon: '📅', path: '/admin', requiredRoles: [] },
];

// 영상 이벤트 대시보드에 DB 없이 항상 표시할 서브메뉴 (게시물·출석·통계)
const VIDEO_EVENT_BUILTIN_SUBMENUS: ExtendedTabInfo[] = [
  { id: 'video-event-posts', title: '게시글 관리', icon: '📝', path: '/admin/video-event/posts', description: '영상 이벤트 게시물 등록·수정·삭제' },
  { id: 'video-event-attendance', title: '출석 관리', icon: '✅', path: '/admin/video-event/attendance', description: '출석 현황 및 수동 처리' },
  { id: 'video-event-comments', title: '묵상 관리', icon: '💬', path: '/admin/video-event/comments', description: '묵상(댓글) 목록 조회' },
  { id: 'video-event-stats', title: '통계', icon: '📊', path: '/admin/video-event/stats', description: '출석·묵상 통계' },
];

// 메뉴 ID와 컴포넌트 매핑 (동적 렌더링용)
const MENU_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'users': UsersAdminPage,
  'roles': RolesAdminPage,
  'tech-inquiries': TechInquiriesPage,
  'video-event-posts': VideoEventPostsAdminPage,
  'video-event-attendance': VideoEventAttendanceContent,
  'video-event-comments': VideoEventCommentsContent,
  'video-event-stats': VideoEventStatsPage,
  'photos-manage': ManageContent,
  'photos-reservations': ReservationsContent,
  'bible-card-applications': BibleCardAdminPage,
  'bible-card-pastor': BibleCardPastorPage,
  'bible-card-complete': BibleCardCompletePage,
  'menu-management': MenuManagementPage,
  'attendance-qr': QrGenerator,
  // 레거시(underscore) 쿼리 파라미터 지원
  'attendance_qr': QrGenerator,
  'attendance-list': AttendanceList,
  'attendance-od-roster': OdRosterManage,
  'attendance-late-fees': LateFeeManage,
  'glossary': GlossaryAdminPage,
  'apps-glossary': GlossaryAdminPage,
  'prayer-time': PrayerTimeAdminPage,
  'apps-prayer-time': PrayerTimeAdminPage,
  'lost-found': LostFoundAdminPage,
  'apps-lost-found': LostFoundAdminPage,
  'calendar': CalendarAdminPage,
  'restaurant': RestaurantAdminPage,
  'apps-restaurant': RestaurantAdminPage,
};

export default function MDIAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
      const query = searchParams?.toString();
      const currentPath = pathname + (query ? `?${query}` : '');
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [status, session, router, pathname, searchParams]);

  const roles = session?.user?.roles || [];

  // DB에서 메뉴 목록 조회
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

  // DB 메뉴를 TabInfo 형식으로 변환하고 권한 필터링 + DB에 없는 기본 탭(캘린더 등) 병합
  const accessibleMenus = React.useMemo(() => {
    const fromDb: ExtendedTabInfo[] = !dbMenus
      ? []
      : dbMenus
          .filter(menu => menu.is_active)
          .filter(menu => {
            if (!menu.roles || menu.roles.length === 0) return true;
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

    if (!dbMenus) return fromDb;
    const dbIds = new Set(fromDb.map(m => m.id));
    const builtInToAdd = BUILTIN_TABS.filter(t => !dbIds.has(t.id));
    return [...fromDb, ...builtInToAdd];
  }, [dbMenus, roles]);

  // URL 쿼리 파라미터로 탭 자동 열기
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.isAdmin) return;
    
    const rawTabId = searchParams?.get('tab') ?? undefined;
    if (!rawTabId) return;

    const candidates = [
      rawTabId,
      rawTabId.includes('_') ? rawTabId.replace(/_/g, '-') : null,
      rawTabId.includes('-') ? rawTabId.replace(/-/g, '_') : null,
    ].filter(Boolean) as string[];

    let menu = candidates
      .map((id) => accessibleMenus.find((m) => m.id === id))
      .find(Boolean);

    // id로 못 찾으면(예: 메뉴 id는 dash인데 tab은 underscore), 컴포넌트 매핑 키로라도 열어줌
    if (!menu && MENU_COMPONENTS[rawTabId]) {
      menu = {
        id: rawTabId,
        title: rawTabId,
        icon: '📌',
        path: '/admin',
        requiredRoles: [],
      } as any;
    }

    if (menu && activeTabId !== menu.id) {
      openTab(menu);
      router.replace('/admin');
    }
  }, [searchParams, accessibleMenus, status, session, activeTabId, openTab, router]);

  if (status === 'loading' || !session?.user?.isAdmin) {
    return (
      <S.LoadingContainer>
        <S.LoadingSpinner />
        <S.LoadingText>Loading...</S.LoadingText>
      </S.LoadingContainer>
    );
  }

  const handleMenuClick = (menu: TabInfo) => {
    openTab(menu);
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

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

    // 출석 관리 서브메뉴 대시보드
    if (activeTabId === 'attendance') {
      return (
        <AttendanceSubmenuContent 
          session={session}
          accessibleMenus={accessibleMenus}
          onMenuClick={handleMenuClick}
        />
      );
    }

    // 사진팀 서브메뉴 대시보드
    if (activeTabId === 'photos') {
      return (
        <PhotosSubmenuContent 
          session={session}
          accessibleMenus={accessibleMenus}
          onMenuClick={handleMenuClick}
        />
      );
    }
    // 영상 이벤트 서브메뉴 대시보드
    if (activeTabId === 'video-event') {
      return (
        <VideoEventSubmenuContent
          session={session}
          accessibleMenus={accessibleMenus}
          onMenuClick={handleMenuClick}
        />
      );
    }
    // 말씀카드 서브메뉴 대시보드
    if (activeTabId === 'bible-card') {
      return (
        <BibleCardSubmenuContent 
          session={session}
          accessibleMenus={accessibleMenus}
          onMenuClick={handleMenuClick}
        />
      );
    }
    // Apps 서브메뉴 대시보드
    if (activeTabId === 'apps') {
      return (
        <AppsSubmenuContent 
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

    return <ComingSoonContent title={activeMenu?.title || activeTabId} />;
  };

  return (
    <S.MDILayout>
      <S.SidebarOverlay 
        visible={!sidebarCollapsed} 
        onClick={() => setSidebarCollapsed(true)} 
      />

      <S.MDISidebar collapsed={sidebarCollapsed}>
        <S.SidebarHeader>
          <S.Logo style={{ justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}>
            {sidebarCollapsed ? (
              <S.ToggleButton onClick={() => setSidebarCollapsed(false)}>☰</S.ToggleButton>
            ) : (
              <>
                <S.LogoIcon>⚡</S.LogoIcon>
                <S.LogoText>HUB Admin</S.LogoText>
                <S.ToggleButton onClick={() => setSidebarCollapsed(true)}>←</S.ToggleButton>
              </>
            )}
          </S.Logo>
        </S.SidebarHeader>

        <S.NavSection>
          <S.NavGroup>
            {!sidebarCollapsed && <S.NavGroupTitle>메뉴</S.NavGroupTitle>}
            
            {accessibleMenus
              .filter(menu => {
                if (menu.id === 'dashboard') return true;
                const dbMenu = dbMenus?.find(m => m.menu_id === menu.id);
                if (dbMenu?.parent_id) return false;
                return true;
              })
              .map(menu => {
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
                  : [];

                return (
                  <React.Fragment key={menu.id}>
                    <S.NavItem
                      active={activeTabId === menu.id}
                      onClick={() => handleMenuClick(menu)}
                    >
                      <S.NavIcon collapsed={sidebarCollapsed}>{menu.icon}</S.NavIcon>
                      {!sidebarCollapsed && <S.NavText>{menu.title}</S.NavText>}
                    </S.NavItem>
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

      <S.MDIMain sidebarCollapsed={sidebarCollapsed}>
        <S.TabBar>
          <S.MobileMenuButton onClick={handleMobileMenuToggle}>☰</S.MobileMenuButton>
          {openTabs.map((tab) => (
            <S.Tab
              key={tab.id}
              active={activeTabId === tab.id}
              onClick={() => handleTabClick(tab.id)}
            >
              <S.TabIcon>{tab.icon}</S.TabIcon>
              <S.TabTitle>{tab.title}</S.TabTitle>
              {tab.id !== 'dashboard' && (
                <S.TabCloseButton onClick={(e) => handleTabClose(e, tab.id)}>×</S.TabCloseButton>
              )}
            </S.Tab>
          ))}
        </S.TabBar>

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
  
  const menuItems = accessibleMenus.filter(m => {
    if (m.id === 'dashboard') return false;
    if (m.requiredRoles && m.requiredRoles.length > 0) {
      const hasPermission = m.requiredRoles.some(role => roles.includes(role));
      if (!hasPermission) return false;
    }
    const extendedMenu = m as ExtendedTabInfo;
    if (extendedMenu.parent_id) return false;
    return true;
  });

  return (
    <>
      <S.DashboardWelcome>
        <S.WelcomeTitle>환영합니다, {session.user.name || '관리자'}님! 👋</S.WelcomeTitle>
        <S.WelcomeSubtitle>HUB 관리자 대시보드에서 시스템을 관리할 수 있습니다.</S.WelcomeSubtitle>
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

// 서브메뉴 콘텐츠 공통 인터페이스
interface SubmenuContentProps {
  session?: any;
  accessibleMenus?: TabInfo[];
  onMenuClick: (menu: TabInfo) => void;
}

// 출석 관리 서브메뉴
function AttendanceSubmenuContent({ session, accessibleMenus, onMenuClick }: SubmenuContentProps) {
  const roles = session?.user?.roles || [];
  
  const attendanceMenus = (accessibleMenus || []).filter(m => {
    if (!m.path.includes('/admin/attendance/')) return false;
    if (m.requiredRoles && m.requiredRoles.length > 0) {
      const hasPermission = m.requiredRoles.some(role => roles.includes(role));
      if (!hasPermission) return false;
    }
    return true;
  });

  return (
    <>
      <S.DashboardWelcome>
        <S.WelcomeTitle>출석 관리 대시보드 📅</S.WelcomeTitle>
        <S.WelcomeSubtitle>QR 코드를 생성하거나 출석 내역을 조회할 수 있습니다.</S.WelcomeSubtitle>
      </S.DashboardWelcome>

      <S.SectionTitle>📋 메뉴 선택</S.SectionTitle>
      <S.MenuGrid>
        {attendanceMenus.map((menu) => {
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

// 사진팀 서브메뉴
function PhotosSubmenuContent({ session, accessibleMenus, onMenuClick }: SubmenuContentProps) {
  const roles = session?.user?.roles || [];
  
  const photosMenus = (accessibleMenus || []).filter(m => {
    if (!m.path.includes('/admin/photos/')) return false;
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
        <S.WelcomeSubtitle>사진팀이 할 수 있는 업무를 선택해주세요.</S.WelcomeSubtitle>
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

// 영상 이벤트 서브메뉴
function VideoEventSubmenuContent({ session, accessibleMenus, onMenuClick }: SubmenuContentProps) {
  const roles = session?.user?.roles || [];
  
  const videoEventMenus = (accessibleMenus || []).filter(m => {
    if (!m.path.includes('/admin/video-event/')) return false;
    if (m.requiredRoles && m.requiredRoles.length > 0) {
      const hasPermission = m.requiredRoles.some(role => roles.includes(role));
      if (!hasPermission) return false;
    }
    return true;
  });

  // DB에 영상 이벤트 하위 메뉴가 없으면 기본 서브메뉴(게시글·출석·통계) 표시
  const displayMenus = videoEventMenus.length > 0 ? videoEventMenus : VIDEO_EVENT_BUILTIN_SUBMENUS;

  return (
    <>
      <S.DashboardWelcome>
        <S.WelcomeTitle>{VIDEO_EVENT.DISPLAY_NAME_ADMIN} 대시보드 🎬</S.WelcomeTitle>
        <S.WelcomeSubtitle>{VIDEO_EVENT.DISPLAY_NAME} 콘텐츠를 관리할 수 있습니다.</S.WelcomeSubtitle>
      </S.DashboardWelcome>

      <S.SectionTitle>📋 빠른 액세스</S.SectionTitle>
      <S.MenuGrid>
        {displayMenus.map((menu) => {
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

// 말씀카드 서브메뉴
function BibleCardSubmenuContent({ session, accessibleMenus, onMenuClick }: SubmenuContentProps) {
  const roles = session?.user?.roles || [];
  
  const bibleCardMenus = (accessibleMenus || []).filter(m => {
    if (!m.path.includes('/admin/bible-card/')) return false;
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
        <S.WelcomeSubtitle>말씀카드 신청 현황 및 관리를 할 수 있습니다.</S.WelcomeSubtitle>
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

// Apps 서브메뉴
function AppsSubmenuContent({ session, accessibleMenus, onMenuClick }: SubmenuContentProps) {
  const roles = session?.user?.roles || [];
  
  const appsMenus = (accessibleMenus || []).filter(m => {
    if (!m.path.includes('/admin/apps/')) return false;
    if (m.requiredRoles && m.requiredRoles.length > 0) {
      const hasPermission = m.requiredRoles.some(role => roles.includes(role));
      if (!hasPermission) return false;
    }
    return true;
  });

  return (
    <>
      <S.DashboardWelcome>
        <S.WelcomeTitle>Apps 관리 대시보드 📱</S.WelcomeTitle>
        <S.WelcomeSubtitle>허브 앱들을 관리할 수 있습니다.</S.WelcomeSubtitle>
      </S.DashboardWelcome>

      <S.SectionTitle>📋 빠른 액세스</S.SectionTitle>
      <S.MenuGrid>
        {appsMenus.map((menu) => {
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

// Coming Soon 콘텐츠
function ComingSoonContent({ title }: { title: string }) {
  return (
    <S.DashboardWelcome>
      <S.WelcomeTitle>{title} 🚧</S.WelcomeTitle>
      <S.WelcomeSubtitle>이 기능은 현재 개발 중입니다. 곧 만나보실 수 있습니다!</S.WelcomeSubtitle>
    </S.DashboardWelcome>
  );
}