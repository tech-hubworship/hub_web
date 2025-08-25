import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAdminAuthStore } from '@src/store/adminAuth';
import { usePageTransition } from '@src/hooks/usePageTransition';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, checkSessionExpiry, logout } = useAdminAuthStore();
  const { navigateTo } = usePageTransition();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // 사용자가 로그인하지 않았거나 세션이 만료된 경우 로그인 페이지로 리디렉션
    if (!isAuthenticated || !isAdmin) {
      router.push('/admin/login');
      return;
    }

    // 세션 확인
    const checkSession = () => {
      checkSessionExpiry();
    };

    checkSession();
    const interval = setInterval(checkSession, 60 * 1000); // 1분마다 체크

    return () => clearInterval(interval);
  }, [isAuthenticated, isAdmin, router, checkSessionExpiry]);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    navigateTo(href);
    // 모바일에서 링크 클릭시 사이드바 닫기
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return null; // 로그인 페이지로 리디렉션 중일 때 렌더링 하지 않음
  }

  return (
    <LayoutContainer>
      <MobileHeader>
        <HamburgerButton onClick={toggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </HamburgerButton>
        <MobileTitle>{title}</MobileTitle>
      </MobileHeader>

      <Sidebar isOpen={isSidebarOpen}>
        <SidebarHeader>
          <SidebarTitle>허브 커뮤니티</SidebarTitle>
          <SidebarSubtitle>관리자 페이지</SidebarSubtitle>
          <CloseButton onClick={toggleSidebar}>×</CloseButton>
        </SidebarHeader>
        <NavList>
          <NavItem isActive={router.pathname === '/admin/dashboard'}>
            <Link href="/admin/dashboard" passHref>
              <NavLink onClick={(e) => handleLinkClick(e, '/admin/dashboard')}>
                대시보드
              </NavLink>
            </Link>
          </NavItem>
          <NavItem isActive={router.pathname === '/admin/tshirtsorder'}>
            <Link href="/admin/tshirtsorder" passHref>
              <NavLink onClick={(e) => handleLinkClick(e, '/admin/tshirtsorder')}>
                티셔츠 주문 관리
              </NavLink>
            </Link>
          </NavItem>
          <NavItem isActive={router.pathname === '/admin/tshirt-pickup'}>
            <Link href="/admin/tshirt-pickup" passHref>
              <NavLink onClick={(e) => handleLinkClick(e, '/admin/tshirt-pickup')}>
                티셔츠 수령 확인
              </NavLink>
            </Link>
          </NavItem>
          <NavItem isActive={router.pathname === '/admin/inquiries'}>
            <Link href="/admin/inquiries" passHref>
              <NavLink onClick={(e) => handleLinkClick(e, '/admin/inquiries')}>
                문의사항 관리
              </NavLink>
            </Link>
          </NavItem>
          <NavItem isActive={router.pathname === '/admin/schedules'}>
            <Link href="/admin/schedules" passHref>
              <NavLink onClick={(e) => handleLinkClick(e, '/admin/schedules')}>
                스케줄 관리
              </NavLink>
            </Link>
          </NavItem>
          <NavItem isActive={router.pathname === '/admin/meals'}>
            <Link href="/admin/meals" passHref>
              <NavLink onClick={(e) => handleLinkClick(e, '/admin/meals')}>
                식단표 관리
              </NavLink>
            </Link>
          </NavItem>
          <NavItem isActive={router.pathname === '/admin/accommodations'}>
            <Link href="/admin/accommodations" passHref>
              <NavLink onClick={(e) => handleLinkClick(e, '/admin/accommodations')}>
                숙소 관리
              </NavLink>
            </Link>
          </NavItem>
          <NavItem isActive={router.pathname === '/admin/lost-items'}>
            <Link href="/admin/lost-items" passHref>
              <NavLink onClick={(e) => handleLinkClick(e, '/admin/lost-items')}>
                분실물 관리
              </NavLink>
            </Link>
          </NavItem>
          <NavItem isActive={router.pathname === '/admin/announcements'}>
            <Link href="/admin/announcements" passHref>
              <NavLink onClick={(e) => handleLinkClick(e, '/admin/announcements')}>
                공지사항 관리
              </NavLink>
            </Link>
          </NavItem>
          <NavItem isActive={router.pathname === '/admin/faqs'}>
            <Link href="/admin/faqs" passHref>
              <NavLink onClick={(e) => handleLinkClick(e, '/admin/faqs')}>
                FAQ 관리
              </NavLink>
            </Link>
          </NavItem>
          <NavItem isActive={router.pathname === '/admin/spreadsheet'}>
            <Link href="/admin/spreadsheet" passHref>
              <NavLink onClick={(e) => handleLinkClick(e, '/admin/spreadsheet')}>
                스프레드시트 동기화
              </NavLink>
            </Link>
          </NavItem>
        </NavList>
        <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
      </Sidebar>

      <MainContent isSidebarOpen={isSidebarOpen}>
        <Header>
          <Title>{title}</Title>
        </Header>
        <Content>
          {children}
        </Content>
      </MainContent>

      {isSidebarOpen && <Overlay onClick={toggleSidebar} />}
    </LayoutContainer>
  );
}

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f3f4f6;
  position: relative;
`;

const Sidebar = styled.div<{ isOpen: boolean }>`
  width: 250px;
  background-color: #000;
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 1000;
  transition: transform 0.3s ease;
  
  @media (max-width: 767px) {
    transform: translateX(${props => (props.isOpen ? '0' : '-100%')});
    width: 85%;
    max-width: 300px;
  }
`;

const SidebarHeader = styled.div`
  padding: 24px;
  position: relative;
`;

const SidebarTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  margin: 0;
`;

const SidebarSubtitle = styled.p`
  font-size: 14px;
  color: #9ca3af;
  margin: 4px 0 0 0;
`;

const CloseButton = styled.button`
  display: none;
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  
  @media (max-width: 767px) {
    display: block;
  }
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 24px 0 0 0;
  flex: 1;
`;

const NavItem = styled.li<{ isActive: boolean }>`
  margin-bottom: 4px;
  background-color: ${props => props.isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  border-left: ${props => props.isActive ? '4px solid #10b981' : '4px solid transparent'};
`;

const NavLink = styled.a`
  display: block;
  padding: 12px 24px;
  color: white;
  text-decoration: none;
  font-size: 16px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const LogoutButton = styled.button`
  margin: 24px;
  padding: 12px;
  background-color: #374151;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  
  &:hover {
    background-color: #4b5563;
  }
`;

const MainContent = styled.div<{ isSidebarOpen: boolean }>`
  flex: 1;
  margin-left: 250px;
  padding: 24px;
  
  @media (max-width: 767px) {
    margin-left: 0;
    width: 100%;
    padding: 70px 16px 16px 16px;
  }
`;

const Header = styled.header`
  margin-bottom: 24px;
  
  @media (max-width: 767px) {
    display: none;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const MobileHeader = styled.header`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #000;
  color: white;
  padding: 0 16px;
  align-items: center;
  z-index: 900;
  
  @media (max-width: 767px) {
    display: flex;
  }
`;

const MobileTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 0 16px;
`;

const HamburgerButton = styled.button`
  background: none;
  border: none;
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  
  span {
    display: block;
    height: 2px;
    width: 100%;
    background-color: white;
    transition: transform 0.3s ease;
  }
`;

const Overlay = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 900;
  
  @media (max-width: 767px) {
    display: block;
  }
`;

const Content = styled.main`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  
  @media (max-width: 767px) {
    padding: 16px;
  }
`; 