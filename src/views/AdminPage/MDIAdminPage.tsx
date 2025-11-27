// 파일 경로: src/views/AdminPage/MDIAdminPage.tsx

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAdminMDI, TabInfo, ADMIN_MENUS } from '@src/contexts/AdminMDIContext';
import * as S from './mdi-style';

// 동적으로 로드할 콘텐츠 컴포넌트들
import UsersAdminPage from '@src/views/AdminPage/users';
import TechInquiriesPage from '@src/views/AdminPage/tech-inquiries';
import AdventPostsAdminPage from '@src/views/AdminPage/advent';
import AttendanceContent from '@src/views/AdminPage/advent/AttendanceContent';
import ManageContent from '@src/views/AdminPage/photos/ManageContent';
import ReservationsContent from '@src/views/AdminPage/photos/ReservationsContent';

// 메뉴 카드 설명
const MENU_DESCRIPTIONS: Record<string, string> = {
  'dashboard': 'HUB 관리자 대시보드에서 시스템을 관리할 수 있습니다.',
  'users': '계정관리 및 권한관리',
  'photos': '사진팀이 할 수 있는 업무를 선택해주세요.',
  'photos-manage': '사진을 업로드하고 수정, 삭제, 미리보기를 할 수 있습니다',
  'photos-reservations': '사진 예약 현황을 확인하고 관리합니다',
  'design': '디자인 작업 관리 및 통계',
  'secretary': '회의록 및 문서 관리',
  'advent': '대림절 말씀/영상/콘텐츠 관리',
  'advent-attendance': '대림절 출석 정보 및 통계',
  'tech-inquiries': '사용자 문의 및 버그 리포트 관리',
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

  if (status === 'loading' || !session?.user?.isAdmin) {
    return (
      <S.LoadingContainer>
        <S.LoadingSpinner />
        <S.LoadingText>Loading...</S.LoadingText>
      </S.LoadingContainer>
    );
  }

  const roles = session.user.roles || [];
  const accessibleMenus = getAccessibleMenus(roles);

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
        return <AdventPostsAdminPage />;
      case 'advent-attendance':
        return <AttendanceContent />;
      case 'photos-manage':
        return <ManageContent />;
      case 'photos-reservations':
        return <ReservationsContent />;
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
            
            {/* 대시보드 */}
            <S.NavItem
              active={activeTabId === 'dashboard'}
              onClick={() => handleMenuClick(ADMIN_MENUS.find(m => m.id === 'dashboard')!)}
            >
              <S.NavIcon collapsed={sidebarCollapsed}>🏠</S.NavIcon>
              {!sidebarCollapsed && <S.NavText>대시보드</S.NavText>}
            </S.NavItem>

            {/* 회원관리 - MC 권한 */}
            {roles.includes('MC') && (
              <S.NavItem
                active={activeTabId === 'users'}
                onClick={() => handleMenuClick(ADMIN_MENUS.find(m => m.id === 'users')!)}
              >
                <S.NavIcon collapsed={sidebarCollapsed}>👥</S.NavIcon>
                {!sidebarCollapsed && <S.NavText>회원관리</S.NavText>}
              </S.NavItem>
            )}

            {/* 사진팀 관리 - 사진팀 권한 */}
            {roles.includes('사진팀') && (
              <>
                <S.NavItem
                  active={activeTabId === 'photos'}
                  onClick={() => handleMenuClick(ADMIN_MENUS.find(m => m.id === 'photos')!)}
                >
                  <S.NavIcon collapsed={sidebarCollapsed}>📷</S.NavIcon>
                  {!sidebarCollapsed && <S.NavText>사진팀 관리</S.NavText>}
                </S.NavItem>
                {/* 사진팀 하위 메뉴 */}
                {!sidebarCollapsed && (
                  <>
                    <S.NavItem
                      active={activeTabId === 'photos-manage'}
                      onClick={() => handleMenuClick(ADMIN_MENUS.find(m => m.id === 'photos-manage')!)}
                      isSubItem
                    >
                      <S.NavIcon collapsed={sidebarCollapsed}>📸</S.NavIcon>
                      <S.NavText>사진 관리</S.NavText>
                    </S.NavItem>
                    <S.NavItem
                      active={activeTabId === 'photos-reservations'}
                      onClick={() => handleMenuClick(ADMIN_MENUS.find(m => m.id === 'photos-reservations')!)}
                      isSubItem
                    >
                      <S.NavIcon collapsed={sidebarCollapsed}>📋</S.NavIcon>
                      <S.NavText>예약 관리</S.NavText>
                    </S.NavItem>
                  </>
                )}
              </>
            )}

            {/* 디자인 관리 - 디자인팀/양육MC 권한 */}
            {(roles.includes('디자인팀') || roles.includes('양육MC')) && (
              <S.NavItem
                active={activeTabId === 'design'}
                onClick={() => handleMenuClick(ADMIN_MENUS.find(m => m.id === 'design')!)}
              >
                <S.NavIcon collapsed={sidebarCollapsed}>🎨</S.NavIcon>
                {!sidebarCollapsed && <S.NavText>디자인 관리</S.NavText>}
              </S.NavItem>
            )}

            {/* 서기 관리 - 서기 권한 */}
            {roles.includes('서기') && (
              <S.NavItem
                active={activeTabId === 'secretary'}
                onClick={() => handleMenuClick(ADMIN_MENUS.find(m => m.id === 'secretary')!)}
              >
                <S.NavIcon collapsed={sidebarCollapsed}>✍️</S.NavIcon>
                {!sidebarCollapsed && <S.NavText>서기 관리</S.NavText>}
              </S.NavItem>
            )}

            {/* 대림절 관리 - 목회자 권한 */}
            {roles.includes('목회자') && (
              <>
                <S.NavItem
                  active={activeTabId === 'advent'}
                  onClick={() => handleMenuClick(ADMIN_MENUS.find(m => m.id === 'advent')!)}
                >
                  <S.NavIcon collapsed={sidebarCollapsed}>🎄</S.NavIcon>
                  {!sidebarCollapsed && <S.NavText>대림절 관리</S.NavText>}
                </S.NavItem>
                {/* 대림절 하위 메뉴 */}
                {!sidebarCollapsed && (
                  <S.NavItem
                    active={activeTabId === 'advent-attendance'}
                    onClick={() => handleMenuClick(ADMIN_MENUS.find(m => m.id === 'advent-attendance')!)}
                    isSubItem
                  >
                    <S.NavIcon collapsed={sidebarCollapsed}>📅</S.NavIcon>
                    <S.NavText>대림절 출석 현황</S.NavText>
                  </S.NavItem>
                )}
              </>
            )}

            {/* 문의사항 - 모든 관리자 */}
            <S.NavItem
              active={activeTabId === 'tech-inquiries'}
              onClick={() => handleMenuClick(ADMIN_MENUS.find(m => m.id === 'tech-inquiries')!)}
            >
              <S.NavIcon collapsed={sidebarCollapsed}>💬</S.NavIcon>
              {!sidebarCollapsed && <S.NavText>문의사항</S.NavText>}
            </S.NavItem>
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
  const menuItems = accessibleMenus.filter(m => 
    m.id !== 'dashboard' && 
    !m.path.includes('/admin/photos/') && 
    !m.path.includes('/admin/advent/')
  );

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

