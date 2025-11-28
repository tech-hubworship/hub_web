// 파일 경로: src/contexts/AdminMDIContext.tsx

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// 탭 정보 타입
export interface TabInfo {
  id: string;
  title: string;
  icon: string;
  path: string;
  requiredRoles?: string[];
}

// 사용 가능한 모든 어드민 메뉴 정의
export const ADMIN_MENUS: TabInfo[] = [
  { id: 'dashboard', title: '대시보드', icon: '🏠', path: '/admin' },
  { id: 'users', title: '회원관리', icon: '👥', path: '/admin/users', requiredRoles: ['MC'] },
  { id: 'photos', title: '사진팀 관리', icon: '📷', path: '/admin/photos', requiredRoles: ['사진팀'] },
  { id: 'photos-manage', title: '사진 관리', icon: '📸', path: '/admin/photos/manage', requiredRoles: ['사진팀'] },
  { id: 'photos-reservations', title: '예약 관리', icon: '📋', path: '/admin/photos/reservations', requiredRoles: ['사진팀'] },
  { id: 'design', title: '디자인 관리', icon: '🎨', path: '/admin/design', requiredRoles: ['디자인팀', '양육MC'] },
  { id: 'secretary', title: '서기 관리', icon: '✍️', path: '/admin/secretary', requiredRoles: ['서기'] },
  { id: 'advent', title: '대림절 관리', icon: '🎄', path: '/admin/advent', requiredRoles: ['목회자'] },
  { id: 'advent-posts', title: '게시글 관리', icon: '📝', path: '/admin/advent/posts', requiredRoles: ['목회자'] },
  { id: 'advent-attendance', title: '출석 현황', icon: '📅', path: '/admin/advent/attendance', requiredRoles: ['목회자'] },
  { id: 'bible-card', title: '말씀카드 관리', icon: '📜', path: '/admin/bible-card', requiredRoles: ['MC'] },
  { id: 'bible-card-pastor', title: '말씀 작성', icon: '✍️', path: '/admin/bible-card/pastor', requiredRoles: ['목회자'] },
  { id: 'bible-card-complete', title: '완료 관리', icon: '✅', path: '/admin/bible-card/complete', requiredRoles: ['MC'] },
  { id: 'tech-inquiries', title: '문의사항', icon: '💬', path: '/admin/tech-inquiries' },
  { id: 'menu-management', title: '메뉴 관리', icon: '⚙️', path: '/admin/menu-management', requiredRoles: ['MC'] },
];

interface MDIContextType {
  openTabs: TabInfo[];
  activeTabId: string;
  openTab: (tab: TabInfo) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  getMenuByPath: (path: string) => TabInfo | undefined;
  getMenuById: (id: string) => TabInfo | undefined;
  getAccessibleMenus: (roles: string[]) => TabInfo[];
}

const AdminMDIContext = createContext<MDIContextType | undefined>(undefined);

export function AdminMDIProvider({ children }: { children: ReactNode }) {
  // 기본적으로 대시보드 탭이 열려있음
  const [openTabs, setOpenTabs] = useState<TabInfo[]>([ADMIN_MENUS[0]]);
  const [activeTabId, setActiveTabId] = useState<string>('dashboard');

  // 탭 열기
  const openTab = useCallback((tab: TabInfo) => {
    setOpenTabs(prev => {
      // 이미 열려있는 탭이면 활성화만
      const existingTab = prev.find(t => t.id === tab.id);
      if (existingTab) {
        setActiveTabId(tab.id);
        return prev;
      }
      // 새 탭 추가
      setActiveTabId(tab.id);
      return [...prev, tab];
    });
  }, []);

  // 탭 닫기
  const closeTab = useCallback((tabId: string) => {
    setOpenTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      
      // 닫히는 탭이 현재 활성 탭이면 다른 탭으로 이동
      if (activeTabId === tabId && newTabs.length > 0) {
        const currentIndex = prev.findIndex(t => t.id === tabId);
        const newActiveIndex = Math.min(currentIndex, newTabs.length - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
      }
      
      // 최소 1개의 탭은 유지 (대시보드)
      if (newTabs.length === 0) {
        setActiveTabId('dashboard');
        return [ADMIN_MENUS[0]];
      }
      
      return newTabs;
    });
  }, [activeTabId]);

  // 활성 탭 설정
  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  // 경로로 메뉴 찾기
  const getMenuByPath = useCallback((path: string) => {
    return ADMIN_MENUS.find(menu => menu.path === path);
  }, []);

  // ID로 메뉴 찾기
  const getMenuById = useCallback((id: string) => {
    return ADMIN_MENUS.find(menu => menu.id === id);
  }, []);

  // 사용자 역할에 따라 접근 가능한 메뉴 필터링
  const getAccessibleMenus = useCallback((roles: string[]) => {
    return ADMIN_MENUS.filter(menu => {
      if (!menu.requiredRoles || menu.requiredRoles.length === 0) {
        return true; // 권한 요구사항 없으면 모두 접근 가능
      }
      return menu.requiredRoles.some(role => roles.includes(role));
    });
  }, []);

  return (
    <AdminMDIContext.Provider
      value={{
        openTabs,
        activeTabId,
        openTab,
        closeTab,
        setActiveTab,
        getMenuByPath,
        getMenuById,
        getAccessibleMenus,
      }}
    >
      {children}
    </AdminMDIContext.Provider>
  );
}

export function useAdminMDI() {
  const context = useContext(AdminMDIContext);
  if (context === undefined) {
    throw new Error('useAdminMDI must be used within an AdminMDIProvider');
  }
  return context;
}

