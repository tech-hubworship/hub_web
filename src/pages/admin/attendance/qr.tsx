import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function AdminAttendanceQrPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // 로딩 중이거나 세션이 없으면 대기
    if (status === 'loading') return;

    // 관리자 권한이 없으면 홈으로
    if (status === 'unauthenticated' || !session?.user?.isAdmin) {
      router.replace('/');
      return;
    }

    // 관리자 페이지(/admin)로 이동하면서 'attendance_qr' 탭을 활성화
    router.replace('/admin?tab=attendance_qr');
  }, [router, session, status]);

  return null; // 리다이렉트만 수행하므로 화면 없음
}