import { useRouter } from 'next/router';
import { useLoading } from '@src/contexts/LoadingContext';

/**
 * 페이지 전환 시 로딩 처리를 제공하는 커스텀 훅
 */
export const usePageTransition = () => {
  const router = useRouter();
  const { startLoading } = useLoading();

  /**
   * 페이지 이동 시 로딩 화면을 표시합니다.
   * @param href 이동할 경로
   * @param options 추가 옵션 (지연 시간, 콜백 함수 등)
   */
  const navigateTo = (href: string, options?: {
    delay?: number;
    beforeNavigate?: () => void;
  }) => {
    const { delay = 100, beforeNavigate } = options || {};
    
    // 이동 전 실행할 콜백이 있다면 실행
    if (beforeNavigate) {
      beforeNavigate();
    }
    
    // 로딩 시작
    startLoading();
    
    // 지연 후 페이지 이동
    setTimeout(() => {
      router.push(href);
    }, delay);
  };

  return { navigateTo };
}; 