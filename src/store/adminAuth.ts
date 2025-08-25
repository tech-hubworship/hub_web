import { create } from "zustand";
import { persist } from "zustand/middleware";

// 로컬 스토리지 접근 함수
const getStorage = () => {
  if (typeof window !== 'undefined') {
    return localStorage;
  }
  return {
    getItem: () => null,
    setItem: () => null,
    removeItem: () => null,
  };
};

interface AdminAuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  phone: string | null;
  setAdmin: (phone: string) => void;
  logout: () => void;
  checkSessionExpiry: () => Promise<boolean>;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isAdmin: false,
      phone: null,
      setAdmin: (phone: string) => {
        set({ isAuthenticated: true, isAdmin: true, phone });
      },
      logout: () => {
        set({ isAuthenticated: false, isAdmin: false, phone: null });
        document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      },
      checkSessionExpiry: async () => {
        const session = document.cookie.split('; ').find(row => row.startsWith('admin_session='));
        if (!session) {
          set({ isAuthenticated: false, isAdmin: false, phone: null });
          return false;
        }

        try {
          const sessionData = JSON.parse(session.split('=')[1]);
          const currentTime = Date.now();
          
          if (!sessionData || !sessionData.expiry || sessionData.expiry < currentTime) {
            set({ isAuthenticated: false, isAdmin: false, phone: null });
            document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            return false;
          }

          set({ isAuthenticated: true, isAdmin: true, phone: sessionData.phone });
          return true;
        } catch (error) {
          console.error('Session validation error:', error);
          set({ isAuthenticated: false, isAdmin: false, phone: null });
          return false;
        }
      },
    }),
    {
      name: "admin-auth-storage",
      partialize: (state) => ({
        phone: state.phone,
      })
    }
  )
);

// 상태 초기화 유틸리티 함수 - 필요한 곳에서 직접 호출 가능
export const initializeAdminAuthState = () => {
  if (typeof window === 'undefined') return;
  
  // 페이지 로드 시 로컬 스토리지에서 상태 직접 로드
  try {
    const storedPhone = localStorage.getItem('admin_phone');
    const storedExpiry = localStorage.getItem('admin_session_expiry');
    
    if (storedPhone && storedExpiry) {
      const expiryTime = parseInt(storedExpiry);
      // 세션이 유효한 경우에만 상태 설정
      if (Date.now() <= expiryTime) {
        useAdminAuthStore.setState({ 
          phone: storedPhone, 
          isAuthenticated: true, 
          isAdmin: true,
        });
        console.log('초기화 함수: 관리자 인증 상태가 복원되었습니다');
        return true;
      }
    }
  } catch (e) {
    console.error('관리자 인증 상태 초기화 중 오류 발생:', e);
  }
  
  return false;
}; 