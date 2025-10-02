// 파일 경로: src/pages/admin/index.tsx

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import PageLayout from '@src/components/common/PageLayout';
import * as S from "@src/views/AdminPage/style";
import Link from 'next/link';
import { useEffect } from 'react';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        // 인증되지 않았거나, 관리자가 아닌 경우 메인 페이지로 리디렉션합니다.
        if (status === 'authenticated' && !session?.user?.isAdmin) {
            alert("관리자만 접근할 수 있는 페이지입니다.");
            router.replace('/');
        }
        if (status === 'unauthenticated') {
            router.replace('/');
        }
    }, [status, session, router]);


    // 로딩 중이거나 아직 세션 정보가 확인되지 않은 상태
    if (status === 'loading' || !session?.user?.isAdmin) {
        return <PageLayout><S.InfoText>Loading...</S.InfoText></PageLayout>;
    }
    
    // session.user.roles가 없을 경우를 대비하여 빈 배열로 기본값 설정
    const roles = session.user.roles || [];

    return (
        <PageLayout>
            <S.Wrapper>
                <S.Title>관리자 페이지</S.Title>
                <S.Subtitle>
                    {roles.length > 0 
                        ? `당신은 다음 권한을 가지고 있습니다: ${roles.join(', ')}`
                        : "현재 부여된 세부 권한이 없습니다."
                    }
                </S.Subtitle>
                <S.MenuGrid>
                    {/* '사진팀' 권한이 있는 관리자에게만 보이는 메뉴 */}
                    {roles.includes('사진팀') && (
                        <S.MenuButton>
                            <span>📷</span>
                            사진 관리
                        </S.MenuButton>
                    )}

                    {/* '디자인팀' 또는 '양육MC' 권한이 있는 관리자에게만 보이는 메뉴 */}
                    {(roles.includes('디자인팀') || roles.includes('양육MC')) && (
                        <Link href="/admin/design" passHref>
                            <S.MenuButton as="a">
                                <span>🎨</span>
                                디자인 관리
                            </S.MenuButton>
                        </Link>
                    )}
                    
                    {/* '서기' 권한이 있는 관리자에게만 보이는 메뉴 */}
                    {roles.includes('서기') && (
                        <S.MenuButton>
                            <span>✍️</span>
                            서기 관리
                        </S.MenuButton>
                    )}
                </S.MenuGrid>
            </S.Wrapper>
        </PageLayout>
    );
}