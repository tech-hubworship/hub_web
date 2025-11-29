// 파일 경로: src/views/AdminPage/mdi-style.ts

import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

// 애니메이션 정의
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

// MDI 메인 레이아웃
export const MDILayout = styled.div`
  display: flex;
  min-height: 100vh;
  background: #ffffff;
  width: 100vw;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;

  @media (max-width: 768px) {
    width: 100vw;
    max-width: 100vw;
    overflow-x: hidden;
  }
`;

// 사이드바
export const MDISidebar = styled.aside<{ collapsed: boolean }>`
  width: ${props => props.collapsed ? '72px' : '260px'};
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  height: 100vh;
  z-index: 1000;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 260px;
    transform: ${props => props.collapsed ? 'translateX(-100%)' : 'translateX(0)'};
  }
`;

export const SidebarOverlay = styled.div<{ visible: boolean }>`
  display: none;

  @media (max-width: 768px) {
    display: ${props => props.visible ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 999;
  }
`;

export const SidebarHeader = styled.div`
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

export const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
`;

export const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
`;

export const LogoText = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  letter-spacing: -0.02em;
`;

export const ToggleButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    transform: scale(1.05);
  }
`;

// 네비게이션 메뉴
export const NavSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
`;

export const NavGroup = styled.div`
  margin-bottom: 24px;
`;

export const NavGroupTitle = styled.div<{ collapsed?: boolean }>`
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 12px;
  margin-bottom: 8px;
  display: ${props => props.collapsed ? 'none' : 'block'};
`;

export const NavItem = styled.button<{ active?: boolean; isSubItem?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  padding: ${props => props.isSubItem ? '8px 12px 8px 24px' : '10px 12px'};
  margin: 2px 0;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  background: ${props => props.active 
    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))' 
    : 'transparent'};
  border-left: ${props => props.active 
    ? '3px solid #8b5cf6' 
    : '3px solid transparent'};
  font-size: ${props => props.isSubItem ? '13px' : '14px'};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

export const NavIcon = styled.span<{ collapsed?: boolean }>`
  font-size: 18px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${props => props.collapsed ? '0' : '12px'};
`;

export const NavText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
  white-space: nowrap;
`;

// 사용자 정보 섹션
export const UserSection = styled.div`
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

export const UserCard = styled.div<{ collapsed?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: ${props => props.collapsed ? '8px' : '12px'};
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  justify-content: ${props => props.collapsed ? 'center' : 'flex-start'};
`;

export const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
`;

export const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const UserName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const UserRole = styled.span`
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// 메인 콘텐츠 영역
export const MDIMain = styled.main<{ sidebarCollapsed: boolean }>`
  flex: 1;
  margin-left: ${props => props.sidebarCollapsed ? '72px' : '260px'};
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;

  @media (max-width: 768px) {
    margin-left: 0;
    width: 100vw;
    max-width: 100vw;
    overflow-x: hidden;
  }
`;

// 탭 바
export const TabBar = styled.div`
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 8px 16px 0;
  gap: 4px;
  position: sticky;
  top: 0;
  z-index: 100;
  overflow-x: auto;
  overflow-y: hidden;

  &::-webkit-scrollbar {
    height: 0;
  }

  @media (max-width: 768px) {
    padding: 8px 8px 0;
    gap: 4px;
    overflow-x: hidden;
    overflow-y: hidden;
  }
`;

export const Tab = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${props => props.active 
    ? '#ffffff' 
    : 'transparent'};
  border-radius: 10px 10px 0 0;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  border-bottom: ${props => props.active 
    ? '2px solid #3b82f6' 
    : '2px solid transparent'};
  margin-bottom: -1px;
  box-shadow: ${props => props.active ? '0 -2px 8px rgba(0, 0, 0, 0.05)' : 'none'};
  flex-shrink: 0;

  &:hover {
    background: ${props => props.active ? '#ffffff' : '#f1f5f9'};
  }

  @media (max-width: 768px) {
    padding: 8px;
    gap: 0;
    min-width: 44px;
    justify-content: center;
  }
`;

export const TabIcon = styled.span`
  font-size: 16px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

export const TabTitle = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const TabCloseButton = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
  margin-left: 4px;
  flex-shrink: 0;

  &:hover {
    background: #fee2e2;
    color: #ef4444;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

export const MobileMenuButton = styled.button`
  display: none;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #1e293b;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 8px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    display: flex;
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
`;

// 콘텐츠 패널
export const ContentPanel = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  animation: ${fadeIn} 0.3s ease;
  background: #ffffff;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 16px;
    overflow-x: hidden;
  }
`;

// 대시보드 관련 스타일
export const DashboardWelcome = styled.div`
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  animation: ${slideIn} 0.4s ease;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
`;

export const WelcomeTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px 0;
`;

export const WelcomeSubtitle = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
`;

// 메뉴 카드 그리드
export const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
`;

export const MenuCard = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: ${fadeIn} 0.4s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

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

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15);

    &::before {
      transform: scaleY(1);
    }
  }
`;

export const MenuCardIcon = styled.div`
  font-size: 36px;
  margin-bottom: 16px;
`;

export const MenuCardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
`;

export const MenuCardDescription = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
`;

// 로딩 상태
export const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 9999;
`;

export const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;

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

// 통계 카드
export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

export const StatCard = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  animation: ${fadeIn} 0.4s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`;

export const StatIcon = styled.div`
  font-size: 28px;
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
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
`;

export const StatLabel = styled.div`
  font-size: 13px;
  color: #64748b;
`;

// 섹션 타이틀
export const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

