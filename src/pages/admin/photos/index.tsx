/**
 * 사진팀 관리 대시보드
 * 리팩토링: 사이드바 제거, MDI 시스템으로 리다이렉트
 * 
 * @author HUB Development Team
 * @version 1.0.0
 */

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function PhotosDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            if (!session?.user?.isAdmin) {
                alert("관리자만 접근할 수 있는 페이지입니다.");
                router.replace('/');
                return;
            }
            if (!session?.user?.roles?.includes('사진팀')) {
                alert("사진팀 권한이 필요합니다.");
                router.replace('/admin');
                return;
            }
            // MDI 시스템으로 리다이렉트
            router.replace('/admin?tab=photos');
        }
        if (status === 'unauthenticated') {
            const currentPath = router.asPath;
            router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
    }, [status, session, router]);

    // 로딩 중 또는 리다이렉트 중
    return null;
}
