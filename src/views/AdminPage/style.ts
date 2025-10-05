import styled from '@emotion/styled';

// 메인 레이아웃
export const AdminLayout = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
`;

// 사이드바
export const Sidebar = styled.aside<{ collapsed: boolean }>`
  width: ${props => props.collapsed ? '70px' : '280px'};
  background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
  color: white;
  transition: all 0.3s ease;
  position: fixed;
  height: 100vh;
  z-index: 1000;
  box-shadow: 4px 0 6px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    width: ${props => props.collapsed ? '0' : '280px'};
    transform: ${props => props.collapsed ? 'translateX(-100%)' : 'translateX(0)'};
  }
`;

export const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const LogoText = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
`;

export const ToggleButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const NavMenu = styled.nav`
  padding: 20px 0;
`;

export const NavItem = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  margin: 4px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  border-right: ${props => props.active ? '3px solid #3b82f6' : '3px solid transparent'};

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  a& {
    text-decoration: none;
    color: inherit;
  }
`;

export const NavIcon = styled.span`
  font-size: 18px;
  margin-right: 12px;
  min-width: 18px;
`;

export const NavText = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

// 메인 콘텐츠 영역
export const MainContent = styled.main`
  flex: 1;
  margin-left: 280px;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

// 상단 바
export const TopBar = styled.header`
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

export const TopBarLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`;

export const Breadcrumb = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
`;

export const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
`;

export const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
`;

export const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

export const UserName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
`;

export const UserRole = styled.span`
  font-size: 12px;
  color: #64748b;
`;

// 콘텐츠 영역
export const ContentArea = styled.div`
  padding: 24px;
`;

// 환영 카드
export const WelcomeCard = styled.div`
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

export const WelcomeTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
`;

export const WelcomeSubtitle = styled.p`
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
`;

// 통계 그리드
export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

export const StatCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

export const StatIcon = styled.div`
  font-size: 32px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StatContent = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
`;

export const StatLabel = styled.div`
  font-size: 14px;
  color: #64748b;
`;

// 대시보드 그리드
export const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 320px));
  gap: 20px;
  margin-top: 32px;
  justify-content: start;
`;

export const DashboardCard = styled.div`
  background: #ffffff;
  padding: 24px 20px;
  border-radius: 20px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.24);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid #e5e7eb;
  text-align: left;
  position: relative;
  overflow: hidden;
  height: 100%;
  max-width: 320px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #3b82f6, #1d4ed8);
    transform: scaleY(0);
    transition: transform 0.3s ease;
    transform-origin: bottom;
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
    transform: scale(0);
    transition: transform 0.4s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 
      0 10px 25px rgba(0, 0, 0, 0.15),
      0 4px 10px rgba(0, 0, 0, 0.1);
    border-color: #d1d5db;
    
    &::before {
      transform: scaleY(1);
    }

    &::after {
      transform: scale(1);
    }

    .dashboard-icon {
      transform: scale(1.15) translateY(-2px);
      filter: brightness(1.1) drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3));
    }

    .dashboard-title {
      color: #1d4ed8;
      transform: translateX(4px);
    }

    .dashboard-description {
      color: #374151;
      transform: translateX(4px);
    }
  }

  &:active {
    transform: translateY(-2px);
    transition: all 0.1s ease;
  }

  a& {
    text-decoration: none;
    color: inherit;
    display: block;
  }
`;

export const DashboardIcon = styled.div`
  font-size: 40px;
  margin-bottom: 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: inline-block;
`;

export const DashboardTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  line-height: 1.3;
`;

export const DashboardDescription = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
  font-weight: 400;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
`;

// 빠른 작업 섹션 (호환성을 위해 유지)
export const QuickActions = styled.div`
  margin-bottom: 32px;
`;

export const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px 0;
`;

export const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

export const ActionCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: #3b82f6;
  }

  a& {
    text-decoration: none;
    color: inherit;
  }
`;

export const ActionIcon = styled.div`
  font-size: 32px;
  margin-bottom: 16px;
`;

export const ActionTitle = styled.h4`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
`;

export const ActionDescription = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
`;

// 로딩 상태
export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f8fafc;
`;

export const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const LoadingText = styled.p`
  font-size: 16px;
  color: #64748b;
  margin: 0;
`;

// 기존 스타일 (호환성을 위해 유지)
export const Wrapper = styled.div`
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

export const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
  text-align: center;
`;

export const Subtitle = styled.p`
  font-size: 16px;
  color: #64748b;
  text-align: center;
  margin-bottom: 40px;
  line-height: 1.6;
`;

export const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

export const MenuButton = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  border: 1px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: #3b82f6;
  }

  span {
    font-size: 32px;
    display: block;
    margin-bottom: 12px;
  }

  a& {
    text-decoration: none;
    color: inherit;
  }
`;

export const InfoText = styled.p`
  font-size: 16px;
  color: #64748b;
  text-align: center;
  padding: 40px;
`;