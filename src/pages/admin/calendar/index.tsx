import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function AdminCalendarPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      const currentPath = router.asPath;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (!session?.user?.isAdmin) {
      router.replace('/');
      return;
    }

    // MDI 관리자 페이지로 이동하면서 calendar 탭을 활성화
    router.replace('/admin?tab=calendar');
  }, [router, session, status]);

  return null;
}

