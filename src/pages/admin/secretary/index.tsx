/**
 * 서기 관리 대시보드
 * 
 * 서기 권한을 가진 관리자를 위한 전용 대시보드
 * 
 * @author HUB Development Team
 * @version 1.0.0
 */

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import * as S from "@src/views/AdminPage/style";
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SecretaryDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );

    useEffect(() => {
        // 인증되지 않았거나, 서기 권한이 없는 경우 메인 페이지로 리디렉션
        if (status === 'authenticated' && !session?.user?.isAdmin) {
            alert("관리자만 접근할 수 있는 페이지입니다.");
            router.replace('/');
        }
        if (status === 'authenticated' && !session?.user?.roles?.includes('서기')) {
            alert("서기 권한이 필요합니다.");
            router.replace('/admin');
        }
        if (status === 'unauthenticated') {
            router.replace('/');
        }
    }, [status, session, router]);

    // 로딩 중이거나 권한이 없는 경우
    if (status === 'loading' || !session?.user?.isAdmin || !session?.user?.roles?.includes('서기')) {
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
                    
                    {roles.includes('사진팀') && (
                        <Link href="/admin/photos" passHref>
                            <S.NavItem as="a">
                                <S.NavIcon>📷</S.NavIcon>
                                {!sidebarCollapsed && <S.NavText>사진팀 관리</S.NavText>}
                            </S.NavItem>
                        </Link>
                    )}

                    {(roles.includes('디자인팀') || roles.includes('양육MC')) && (
                        <Link href="/admin/design" passHref>
                            <S.NavItem as="a">
                                <S.NavIcon>🎨</S.NavIcon>
                                {!sidebarCollapsed && <S.NavText>디자인 관리</S.NavText>}
                            </S.NavItem>
                        </Link>
                    )}
                    
                    <S.NavItem active>
                        <S.NavIcon>✍️</S.NavIcon>
                        {!sidebarCollapsed && <S.NavText>서기 관리</S.NavText>}
                    </S.NavItem>
                </S.NavMenu>
            </S.Sidebar>

            <S.MainContent>
                <S.TopBar>
                    <S.TopBarLeft>
                        <S.PageTitle>서기 관리 대시보드</S.PageTitle>
                        <S.Breadcrumb>관리자 페이지 &gt; 서기 관리</S.Breadcrumb>
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
                        <S.WelcomeTitle>서기 관리 대시보드</S.WelcomeTitle>
                        <S.WelcomeSubtitle>
                            회의록, 문서, 일정을 체계적으로 관리할 수 있습니다.
                        </S.WelcomeSubtitle>
                    </S.WelcomeCard>

                    {/* 서기 전용 통계 */}
                    <S.StatsGrid>
                        <S.StatCard>
                            <S.StatIcon>📝</S.StatIcon>
                            <S.StatContent>
                                <S.StatValue>23</S.StatValue>
                                <S.StatLabel>회의록</S.StatLabel>
                            </S.StatContent>
                        </S.StatCard>
                        
                        <S.StatCard>
                            <S.StatIcon>📋</S.StatIcon>
                            <S.StatContent>
                                <S.StatValue>12</S.StatValue>
                                <S.StatLabel>진행 중인 회의</S.StatLabel>
                            </S.StatContent>
                        </S.StatCard>
                        
                        <S.StatCard>
                            <S.StatIcon>📅</S.StatIcon>
                            <S.StatContent>
                                <S.StatValue>8</S.StatValue>
                                <S.StatLabel>예정된 회의</S.StatLabel>
                            </S.StatContent>
                        </S.StatCard>
                        
                        <S.StatCard>
                            <S.StatIcon>📄</S.StatIcon>
                            <S.StatContent>
                                <S.StatValue>156</S.StatValue>
                                <S.StatLabel>관리 문서</S.StatLabel>
                            </S.StatContent>
                        </S.StatCard>
                    </S.StatsGrid>

                    {/* 서기 전용 기능 */}
                    <S.QuickActions>
                        <S.SectionTitle>서기 관리 기능</S.SectionTitle>
                        <S.ActionGrid>
                            <S.ActionCard>
                                <S.ActionIcon>✍️</S.ActionIcon>
                                <S.ActionTitle>회의록 작성</S.ActionTitle>
                                <S.ActionDescription>새로운 회의록을 작성하고 관리합니다</S.ActionDescription>
                            </S.ActionCard>
                            
                            <S.ActionCard>
                                <S.ActionIcon>📋</S.ActionIcon>
                                <S.ActionTitle>회의록 관리</S.ActionTitle>
                                <S.ActionDescription>기존 회의록을 확인하고 수정합니다</S.ActionDescription>
                            </S.ActionCard>
                            
                            <S.ActionCard>
                                <S.ActionIcon>📅</S.ActionIcon>
                                <S.ActionTitle>일정 관리</S.ActionTitle>
                                <S.ActionDescription>회의 일정을 등록하고 관리합니다</S.ActionDescription>
                            </S.ActionCard>
                            
                            <S.ActionCard>
                                <S.ActionIcon>📄</S.ActionIcon>
                                <S.ActionTitle>문서 관리</S.ActionTitle>
                                <S.ActionDescription>각종 문서를 체계적으로 관리합니다</S.ActionDescription>
                            </S.ActionCard>
                            
                            <S.ActionCard>
                                <S.ActionIcon>👥</S.ActionIcon>
                                <S.ActionTitle>참석자 관리</S.ActionTitle>
                                <S.ActionDescription>회의 참석자 정보를 관리합니다</S.ActionDescription>
                            </S.ActionCard>
                            
                            <S.ActionCard>
                                <S.ActionIcon>📊</S.ActionIcon>
                                <S.ActionTitle>통계 분석</S.ActionTitle>
                                <S.ActionDescription>회의 및 문서 관련 통계를 분석합니다</S.ActionDescription>
                            </S.ActionCard>
                        </S.ActionGrid>
                    </S.QuickActions>
                </S.ContentArea>
            </S.MainContent>
        </S.AdminLayout>
    );
}
