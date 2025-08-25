import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

interface AuthStore {
  phoneNumber: string | null;
  isAuthenticated: boolean;
  sessionExpiry: number | null;
  setUser: (phoneNumber: string | null) => void;
  logout: () => void;
  checkSessionExpiry: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      phoneNumber: null,
      isAuthenticated: false,
      sessionExpiry: null,
      
      setUser: (phoneNumber) => {
        if (phoneNumber) {
          // 로그인 시 세션 만료 시간 설정 (현재 시간 + 24시간)
          const expiryTime = Date.now() + 1 * 10 * 60 * 1000; // 24시간으로 연장
          set({ phoneNumber, isAuthenticated: true, sessionExpiry: expiryTime });
          
          // 직접 로컬 스토리지에도 저장 (이중 보장)
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_phone', phoneNumber);
            localStorage.setItem('session_expiry', expiryTime.toString());
          }
        } else {
          set({ phoneNumber: null, isAuthenticated: false, sessionExpiry: null });
          
          // 로컬 스토리지에서도 제거
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user_phone');
            localStorage.removeItem('session_expiry');
          }
        }
      },
      
      logout: () => {
        set({ phoneNumber: null, isAuthenticated: false, sessionExpiry: null });
        
        // 로컬 스토리지에서도 제거
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user_phone');
          localStorage.removeItem('session_expiry');
        }
      },
      
      checkSessionExpiry: () => {
        const { sessionExpiry, logout, phoneNumber, isAuthenticated } = get();
        
        // 이미 인증된 상태면 세션 만료만 체크
        if (isAuthenticated && phoneNumber) {
          // 세션 만료 확인
          if (sessionExpiry && Date.now() > sessionExpiry) {
            // 세션이 만료되었으면 로그아웃
            logout();
            return false;
          }
          return true;
        }
        
        // 로그인 정보가 없지만 로컬 스토리지에 있는 경우 복원
        if (typeof window !== 'undefined') {
          const storedPhone = localStorage.getItem('user_phone');
          const storedExpiry = localStorage.getItem('session_expiry');
          
          if (storedPhone && storedExpiry) {
            const expiryTime = parseInt(storedExpiry);
            if (Date.now() <= expiryTime) {
              // 유효한 세션이면 상태 복원
              set({ phoneNumber: storedPhone, isAuthenticated: true, sessionExpiry: expiryTime });
              return true;
            } else {
              // 만료된 세션이면 정리
              localStorage.removeItem('user_phone');
              localStorage.removeItem('session_expiry');
            }
          }
        }
        
        return false;
      }
    }),
    {
      name: "auth-storage", // 로컬 스토리지 키 이름
      storage: createJSONStorage(() => getStorage()), // 안전한 스토리지 접근
      skipHydration: true, // 하이드레이션 문제 방지
    }
  )
);

// 상태 초기화 유틸리티 함수 - 필요한 곳에서 직접 호출 가능
export const initializeAuthState = () => {
  if (typeof window === 'undefined') return false;
  
  // 현재 인증 상태 확인
  const currentState = useAuthStore.getState();
  if (currentState.isAuthenticated && currentState.phoneNumber) {
    // 이미 인증된 상태이면 세션 만료만 확인
    if (currentState.sessionExpiry && Date.now() <= currentState.sessionExpiry) {
      return true;
    }
  }
  
  // 페이지 로드 시 로컬 스토리지에서 상태 직접 로드
  try {
    const storedPhone = localStorage.getItem('user_phone');
    const storedExpiry = localStorage.getItem('session_expiry');
    
    if (storedPhone && storedExpiry) {
      const expiryTime = parseInt(storedExpiry);
      // 세션이 유효한 경우에만 상태 설정
      if (Date.now() <= expiryTime) {
        useAuthStore.setState({ 
          phoneNumber: storedPhone, 
          isAuthenticated: true, 
          sessionExpiry: expiryTime 
        });
        console.log('초기화 함수: 인증 상태가 복원되었습니다');
        return true;
      } else {
        // 만료된 세션 데이터 삭제
        localStorage.removeItem('user_phone');
        localStorage.removeItem('session_expiry');
      }
    }
  } catch (e) {
    console.error('인증 상태 초기화 중 오류 발생:', e);
  }
  
  return false;
}; 