// 파일 경로: src/pages/admin/index.tsx

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import * as S from "@src/views/AdminPage/style";
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );

    useEffect(() => {
        // 인증되지 않았거나, 관리자가 아닌 경우 메인 페이지로 리디렉션합니다.
        if (status === 'authenticated' && !session?.user?.isAdmin) {
            alert("⛔️ 관리자만 접근할 수 있는 페이지입니다.");
            router.replace('/');
        }
        if (status === 'unauthenticated') {
            const currentPath = router.asPath;
            router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
    }, [status, session, router]);

    // 로딩 중이거나 아직 세션 정보가 확인되지 않은 상태
    if (status === 'loading' || !session?.user?.isAdmin) {
        return (
            <S.AdminLayout>
                <S.LoadingContainer>
                    <S.LoadingSpinner />
                    <S.LoadingText>Loading...</S.LoadingText>
                </S.LoadingContainer>
            </S.AdminLayout>
        );
    }
    
    // session.user.roles가 없을 경우를 대비하여 빈 배열로 기본값 설정
    const roles = session.user.roles || [];

    return (
        <S.AdminLayout>
            <S.SidebarOverlay visible={!sidebarCollapsed} onClick={() => setSidebarCollapsed(true)} />
            <S.Sidebar collapsed={sidebarCollapsed}>
                <S.SidebarHeader>
                    <S.Logo>
                        {!sidebarCollapsed && <S.LogoText>HUB Admin</S.LogoText>}
                        <S.ToggleButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                            {sidebarCollapsed ? '→' : '←'}
                        </S.ToggleButton>
                    </S.Logo>
                </S.SidebarHeader>
                
                <S.NavMenu>
                    <S.NavItem active>
                        <S.NavIcon>🏠</S.NavIcon>
                        {!sidebarCollapsed && <S.NavText>대시보드</S.NavText>}
                    </S.NavItem>
                    
                    {/* 회원관리 메뉴 - MC 권한이 있는 관리자에게만 표시 */}
                    {roles.includes('MC') && (
                        <Link href="/admin/users" passHref legacyBehavior>
                            <S.NavItem as="a">
                                <S.NavIcon>👥</S.NavIcon>
                                {!sidebarCollapsed && <S.NavText>회원관리</S.NavText>}
                            </S.NavItem>
                        </Link>
                    )}
                    
                    {/* '사진팀' 권한이 있는 관리자에게만 보이는 메뉴 */}
                    {roles.includes('사진팀') && (
                        <Link href="/admin/photos" passHref legacyBehavior>
                            <S.NavItem as="a">
                                <S.NavIcon>📷</S.NavIcon>
                                {!sidebarCollapsed && <S.NavText>사진팀 관리</S.NavText>}
                            </S.NavItem>
                        </Link>
                    )}

                    {/* '디자인팀' 또는 '양육MC' 권한이 있는 관리자에게만 보이는 메뉴 */}
                    {(roles.includes('디자인팀') || roles.includes('양육MC')) && (
                        <Link href="/admin/design" passHref legacyBehavior>
                            <S.NavItem as="a">
                                <S.NavIcon>🎨</S.NavIcon>
                                {!sidebarCollapsed && <S.NavText>디자인 관리</S.NavText>}
                            </S.NavItem>
                        </Link>
                    )}
                    
                    {/* '서기' 권한이 있는 관리자에게만 보이는 메뉴 */}
                    {roles.includes('서기') && (
                        <Link href="/admin/secretary" passHref legacyBehavior>
                            <S.NavItem as="a">
                                <S.NavIcon>✍️</S.NavIcon>
                                {!sidebarCollapsed && <S.NavText>서기 관리</S.NavText>}
                            </S.NavItem>
                        </Link>
                    )}

                    {/* '목회자' 권한이 있는 관리자에게만 보이는 대림절 메뉴 */}
                    {roles.includes('목회자') && (
                        <Link href="/admin/advent" passHref legacyBehavior>
                            <S.NavItem as="a">
                                <S.NavIcon>🎄</S.NavIcon>
                                {!sidebarCollapsed && <S.NavText>대림절 관리</S.NavText>}
                            </S.NavItem>
                        </Link>
                    )}

                    {/* 대림절 출석 현황 메뉴 */}
                    {roles.includes('목회자') && (
                        <Link href="/admin/advent/attendance" passHref legacyBehavior>
                            <S.NavItem as="a">
                                <S.NavIcon>📅</S.NavIcon>
                                {!sidebarCollapsed && <S.NavText>대림절 출석 현황</S.NavText>}
                            </S.NavItem>
                        </Link>
                    )}
                    
                    {/* 문의사항 메뉴 - 모든 관리자에게 표시 */}
                    <Link href="/admin/tech-inquiries" passHref legacyBehavior>
                        <S.NavItem as="a">
                            <S.NavIcon>💬</S.NavIcon>
                            {!sidebarCollapsed && <S.NavText>문의사항</S.NavText>}
                        </S.NavItem>
                    </Link>
                </S.NavMenu>
            </S.Sidebar>

            <S.MainContent>
                <S.TopBar>
                    <S.TopBarLeft>
                        <S.MobileMenuButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                            ☰
                        </S.MobileMenuButton>
                        <div>
                            <S.PageTitle>관리자 대시보드</S.PageTitle>
                            <S.Breadcrumb>관리자 페이지</S.Breadcrumb>
                        </div>
                    </S.TopBarLeft>
                    <S.TopBarRight>
                        <S.UserInfo>
                            <S.UserAvatar>
                                {session.user.name?.charAt(0) || 'U'}
                            </S.UserAvatar>
                            <S.UserDetails>
                                <S.UserName>{session.user.name || '관리자'}</S.UserName>
                                <S.UserRole>{roles.join(', ') || '관리자'}</S.UserRole>
                            </S.UserDetails>
                        </S.UserInfo>
                    </S.TopBarRight>
                </S.TopBar>

                <S.ContentArea>
                    <S.WelcomeCard>
                        <S.WelcomeTitle>환영합니다, {session.user.name || '관리자'}님!</S.WelcomeTitle>
                        <S.WelcomeSubtitle>
                            HUB 관리자 대시보드에서 시스템을 관리할 수 있습니다.
                        </S.WelcomeSubtitle>
                    </S.WelcomeCard>

                    <S.DashboardGrid>
                        {/* 회원관리 카드 - MC 권한이 있는 관리자에게만 표시 */}
                        {roles.includes('MC') && (
                            <Link href="/admin/users" passHref legacyBehavior>
                                <S.DashboardCard as="a">
                                    <S.DashboardIcon className="dashboard-icon">👥</S.DashboardIcon>
                                    <S.DashboardTitle className="dashboard-title">회원관리</S.DashboardTitle>
                                    <S.DashboardDescription className="dashboard-description">
                                        계정관리 및 권한관리
                                    </S.DashboardDescription>
                                </S.DashboardCard>
                            </Link>
                        )}

                        {roles.includes('사진팀') && (
                            <Link href="/admin/photos" passHref legacyBehavior>
                                <S.DashboardCard as="a">
                                    <S.DashboardIcon className="dashboard-icon">📷</S.DashboardIcon>
                                    <S.DashboardTitle className="dashboard-title">사진팀 관리</S.DashboardTitle>
                                    <S.DashboardDescription className="dashboard-description">
                                        사진 업로드, 관리, 예약 확인
                                    </S.DashboardDescription>
                                </S.DashboardCard>
                            </Link>
                        )}
                        
                        {(roles.includes('디자인팀') || roles.includes('양육MC')) && (
                            <Link href="/admin/design" passHref legacyBehavior>
                                <S.DashboardCard as="a">
                                    <S.DashboardIcon className="dashboard-icon">🎨</S.DashboardIcon>
                                    <S.DashboardTitle className="dashboard-title">디자인 관리</S.DashboardTitle>
                                    <S.DashboardDescription className="dashboard-description">
                                        디자인 작업 관리 및 통계
                                    </S.DashboardDescription>
                                </S.DashboardCard>
                            </Link>
                        )}
                        
                        {roles.includes('서기') && (
                            <Link href="/admin/secretary" passHref legacyBehavior>
                                <S.DashboardCard as="a">
                                    <S.DashboardIcon className="dashboard-icon">✍️</S.DashboardIcon>
                                    <S.DashboardTitle className="dashboard-title">서기 관리</S.DashboardTitle>
                                    <S.DashboardDescription className="dashboard-description">
                                        회의록 및 문서 관리
                                    </S.DashboardDescription>
                                </S.DashboardCard>
                            </Link>
                        )}

                        {roles.includes('목회자') && (
                            <Link href="/admin/advent" passHref legacyBehavior>
                                <S.DashboardCard as="a">
                                    <S.DashboardIcon>🎄</S.DashboardIcon>
                                    <S.DashboardTitle>대림절 관리</S.DashboardTitle>
                                    <S.DashboardDescription>대림절 말씀/영상/콘텐츠 관리</S.DashboardDescription>
                                </S.DashboardCard>
                            </Link>
                        )}

                        {roles.includes('목회자') && (
                            <Link href="/admin/advent/attendance" passHref legacyBehavior>
                                <S.DashboardCard as="a">
                                    <S.DashboardIcon>📅</S.DashboardIcon>
                                    <S.DashboardTitle>대림절 출석 현황</S.DashboardTitle>
                                    <S.DashboardDescription>대림절 출석 정보 및 통계</S.DashboardDescription>
                                </S.DashboardCard>
                            </Link>
                        )}
                        
                        {/* 문의사항 카드 - 모든 관리자에게 표시 */}
                        <Link href="/admin/tech-inquiries" passHref legacyBehavior>
                            <S.DashboardCard as="a">
                                <S.DashboardIcon className="dashboard-icon">💬</S.DashboardIcon>
                                <S.DashboardTitle className="dashboard-title">문의사항</S.DashboardTitle>
                                <S.DashboardDescription className="dashboard-description">
                                    사용자 문의 및 버그 리포트 관리
                                </S.DashboardDescription>
                            </S.DashboardCard>
                        </Link>
                    </S.DashboardGrid>
                </S.ContentArea>
            </S.MainContent>
        </S.AdminLayout>
    );
}