/**
 * 사진팀 관리 대시보드
 * 
 * 사진팀 권한을 가진 관리자를 위한 전용 대시보드
 * 
 * @author HUB Development Team
 * @version 1.0.0
 */

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import * as S from "@src/views/AdminPage/style";
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PhotosDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        // 인증되지 않았거나, 사진팀 권한이 없는 경우 메인 페이지로 리디렉션
        if (status === 'authenticated' && !session?.user?.isAdmin) {
            alert("관리자만 접근할 수 있는 페이지입니다.");
            router.replace('/');
        }
        if (status === 'authenticated' && !session?.user?.roles?.includes('사진팀')) {
            alert("사진팀 권한이 필요합니다.");
            router.replace('/admin');
        }
        if (status === 'unauthenticated') {
            router.replace('/');
        }
    }, [status, session, router]);

    // 로딩 중이거나 권한이 없는 경우
    if (status === 'loading' || !session?.user?.isAdmin || !session?.user?.roles?.includes('사진팀')) {
        return (
            <S.AdminLayout>
                <S.LoadingContainer>
                    <S.LoadingSpinner />
                    <S.LoadingText>Loading...</S.LoadingText>
                </S.LoadingContainer>
            </S.AdminLayout>
        );
    }
    
    const roles = session.user.roles || [];

    return (
        <S.AdminLayout>
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
                    <Link href="/admin" passHref>
                        <S.NavItem as="a">
                            <S.NavIcon>🏠</S.NavIcon>
                            {!sidebarCollapsed && <S.NavText>대시보드</S.NavText>}
                        </S.NavItem>
                    </Link>
                    
                    <S.NavItem active>
                        <S.NavIcon>📷</S.NavIcon>
                        {!sidebarCollapsed && <S.NavText>사진팀 관리</S.NavText>}
                    </S.NavItem>
                    
                    {(roles.includes('디자인팀') || roles.includes('양육MC')) && (
                        <Link href="/admin/design" passHref>
                            <S.NavItem as="a">
                                <S.NavIcon>🎨</S.NavIcon>
                                {!sidebarCollapsed && <S.NavText>디자인 관리</S.NavText>}
                            </S.NavItem>
                        </Link>
                    )}
                    
                    {roles.includes('서기') && (
                        <Link href="/admin/secretary" passHref>
                            <S.NavItem as="a">
                                <S.NavIcon>✍️</S.NavIcon>
                                {!sidebarCollapsed && <S.NavText>서기 관리</S.NavText>}
                            </S.NavItem>
                        </Link>
                    )}
                </S.NavMenu>
            </S.Sidebar>

            <S.MainContent>
                <S.TopBar>
                    <S.TopBarLeft>
                        <S.PageTitle>사진팀 대시보드</S.PageTitle>
                        <S.Breadcrumb>관리자 페이지 &gt; 사진팀 관리</S.Breadcrumb>
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
                        <S.WelcomeTitle>사진팀 관리 대시보드</S.WelcomeTitle>
                        <S.WelcomeSubtitle>
                            사진팀이 할 수 있는 업무를 선택해주세요.
                        </S.WelcomeSubtitle>
                    </S.WelcomeCard>

                    {/* 사진팀 업무 버튼들 */}
                    <S.DashboardGrid>
                        <Link href="/admin/photos/manage" passHref>
                            <S.DashboardCard as="a">
                                <S.DashboardIcon className="dashboard-icon">📸</S.DashboardIcon>
                                <S.DashboardTitle className="dashboard-title">사진 관리</S.DashboardTitle>
                                <S.DashboardDescription className="dashboard-description">
                                    사진을 업로드하고 수정, 삭제, 미리보기를 할 수 있습니다
                                </S.DashboardDescription>
                            </S.DashboardCard>
                        </Link>
                        
                        <Link href="/admin/photos/reservations" passHref>
                            <S.DashboardCard as="a">
                                <S.DashboardIcon className="dashboard-icon">📋</S.DashboardIcon>
                                <S.DashboardTitle className="dashboard-title">예약 관리</S.DashboardTitle>
                                <S.DashboardDescription className="dashboard-description">
                                    사진 예약 현황을 확인하고 관리합니다
                                </S.DashboardDescription>
                            </S.DashboardCard>
                        </Link>
                        
                    </S.DashboardGrid>
                </S.ContentArea>
            </S.MainContent>
        </S.AdminLayout>
    );
}
