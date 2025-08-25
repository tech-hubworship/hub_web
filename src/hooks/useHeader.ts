import { useRouter } from 'next/router';
import { usePageTransition } from '@src/hooks/usePageTransition';

function useHeader() {
  const router = useRouter();
  const { navigateTo } = usePageTransition();

  const handleClickLogo = () => {
    navigateTo('/');
  };

  const handleIsSelected = (path: string | string[]) => {
    if (typeof path === 'string') return router.pathname.startsWith(path);
    return path.some((p) => router.pathname.startsWith(p));
  };

  return { handleClickLogo, handleIsSelected };
}

export default useHeader;
