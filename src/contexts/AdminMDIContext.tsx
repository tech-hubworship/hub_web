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

// 기본 대시보드 메뉴만 정의 (하위 호환성용, 실제로는 DB에서 관리)
export const ADMIN_MENUS: TabInfo[] = [
  { id: 'dashboard', title: '대시보드', icon: '🏠', path: '/admin' },
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

  // 경로로 메뉴 찾기 (하위 호환성용, 실제로는 DB에서 관리)
  const getMenuByPath = useCallback((path: string) => {
    return ADMIN_MENUS.find(menu => menu.path === path);
  }, []);

  // ID로 메뉴 찾기 (하위 호환성용, 실제로는 DB에서 관리)
  const getMenuById = useCallback((id: string) => {
    return ADMIN_MENUS.find(menu => menu.id === id);
  }, []);

  // 사용자 역할에 따라 접근 가능한 메뉴 필터링 (하위 호환성용, 실제로는 DB에서 관리)
  const getAccessibleMenus = useCallback((roles: string[]) => {
    // 기본 대시보드만 반환 (실제 메뉴는 DB에서 관리)
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

