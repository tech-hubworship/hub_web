// 파일 경로: src/pages/admin/advent/attendance.tsx

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import * as L from '@src/views/AdminPage/style';
import * as S from '@src/views/AdminPage/advent/attendance-style';
import Link from 'next/link';

interface AttendanceRecord {
  user_id: string;
  name: string;
  email: string;
  hub_groups: { id: number; name: string } | null;
  hub_cells: { id: number; name: string } | null;
  attended: boolean;
  created_at: string | null;
}

export default function AdminAdventAttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const roles = session?.user?.roles || [];

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10).replace(/-/g, '')
  );
  const [loading, setLoading] = useState(false);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [attendedCount, setAttendedCount] = useState(0);

  /**
   * 권한 체크
   */
  useEffect(() => {
    if (status === 'authenticated') {
      if (!session?.user?.isAdmin) {
        alert('⛔️ 관리자만 접근할 수 있는 페이지입니다.');
        router.replace('/');
      } else if (!roles.includes('목회자')) {
        alert('⛔️ 목회자 권한이 필요합니다.');
        router.replace('/admin');
      }
    }

    if (status === 'unauthenticated') {
      const currentPath = router.asPath;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [status, session, roles, router]);

  /**
   * 출석 조회
   */
  const fetchAttendance = async () => {
    if (!date || date.length !== 8) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/advent/attendance?date=${date}`);
      const data = await response.json();

      if (response.ok) {
        setAttendanceList(data.list || []);
        setTotalUsers(data.total_users || 0);
        setAttendedCount(data.attended || 0);
      } else {
        alert(data.error || '출석 현황을 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error('출석 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  /**
   * 로딩 화면
   */
  if (status === 'loading' || !session?.user?.isAdmin) {
    return (
      <L.AdminLayout>
        <L.LoadingContainer>
          <L.LoadingSpinner />
          <L.LoadingText>Loading...</L.LoadingText>
        </L.LoadingContainer>
      </L.AdminLayout>
    );
  }

  /**
   * 실제 화면
   */
  return (
    <L.AdminLayout>
      {/* Sidebar */}
      <L.SidebarOverlay
        visible={!sidebarCollapsed}
        onClick={() => setSidebarCollapsed(true)}
      />
      <L.Sidebar collapsed={sidebarCollapsed}>
        <L.SidebarHeader>
          <L.Logo>
            {!sidebarCollapsed && <L.LogoText>HUB Admin</L.LogoText>}
            <L.ToggleButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              {sidebarCollapsed ? '→' : '←'}
            </L.ToggleButton>
          </L.Logo>
        </L.SidebarHeader>

        <L.NavMenu>
          <Link href="/admin" passHref legacyBehavior>
            <L.NavItem as="a">
              <L.NavIcon>🏠</L.NavIcon>
              {!sidebarCollapsed && <L.NavText>대시보드</L.NavText>}
            </L.NavItem>
          </Link>

          {roles.includes('MC') && (
            <Link href="/admin/users" passHref legacyBehavior>
              <L.NavItem as="a">
                <L.NavIcon>👥</L.NavIcon>
                {!sidebarCollapsed && <L.NavText>회원관리</L.NavText>}
              </L.NavItem>
            </Link>
          )}

          {roles.includes('사진팀') && (
            <Link href="/admin/photos" passHref legacyBehavior>
              <L.NavItem as="a">
                <L.NavIcon>📷</L.NavIcon>
                {!sidebarCollapsed && <L.NavText>사진팀 관리</L.NavText>}
              </L.NavItem>
            </Link>
          )}

          {(roles.includes('디자인팀') || roles.includes('양육MC')) && (
            <Link href="/admin/design" passHref legacyBehavior>
              <L.NavItem as="a">
                <L.NavIcon>🎨</L.NavIcon>
                {!sidebarCollapsed && <L.NavText>디자인 관리</L.NavText>}
              </L.NavItem>
            </Link>
          )}

          {roles.includes('서기') && (
            <Link href="/admin/secretary" passHref legacyBehavior>
              <L.NavItem as="a">
                <L.NavIcon>✍️</L.NavIcon>
                {!sidebarCollapsed && <L.NavText>서기 관리</L.NavText>}
              </L.NavItem>
            </Link>
          )}

          {roles.includes('목회자') && (
            <>
              <Link href="/admin/advent" passHref legacyBehavior>
                <L.NavItem as="a">
                  <L.NavIcon>🎄</L.NavIcon>
                  {!sidebarCollapsed && <L.NavText>대림절 관리</L.NavText>}
                </L.NavItem>
              </Link>

              <Link href="/admin/advent/attendance" passHref legacyBehavior>
                <L.NavItem as="a" active>
                  <L.NavIcon>📅</L.NavIcon>
                  {!sidebarCollapsed && <L.NavText>대림절 출석 현황</L.NavText>}
                </L.NavItem>
              </Link>
            </>
          )}
        </L.NavMenu>
      </L.Sidebar>

      {/* 메인 */}
      <L.MainContent>
        <L.TopBar>
          <L.TopBarLeft>
            <L.MobileMenuButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              ☰
            </L.MobileMenuButton>
            <div>
              <L.PageTitle>대림절 출석 현황</L.PageTitle>
              <L.Breadcrumb>관리자 페이지 / 대림절 출석 현황</L.Breadcrumb>
            </div>
          </L.TopBarLeft>

          <L.TopBarRight>
            <L.UserInfo>
              <L.UserAvatar>{session.user.name?.charAt(0) || 'U'}</L.UserAvatar>
              <L.UserDetails>
                <L.UserName>{session.user.name}</L.UserName>
                <L.UserRole>{roles.join(', ')}</L.UserRole>
              </L.UserDetails>
            </L.UserInfo>
          </L.TopBarRight>
        </L.TopBar>

        <L.ContentArea>
          {/* 날짜 선택 */}
          <S.FormGroup>
            <S.Label>날짜 선택</S.Label>
            <S.Input
              type="date"
              value={`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`}
              onChange={(e) => setDate(e.target.value.replace(/-/g, ''))}
            />
          </S.FormGroup>

          {/* 통계 */}
          <S.WelcomeCard>
            <S.WelcomeTitle>출석 통계</S.WelcomeTitle>
            <S.WelcomeSubtitle>
              총 {totalUsers}명 중 {attendedCount}명 출석 (
              {(totalUsers > 0 ? (attendedCount / totalUsers) * 100 : 0).toFixed(1)}%)
            </S.WelcomeSubtitle>
          </S.WelcomeCard>

          {/* 테이블 */}
          <S.TableContainer>
            <S.Table>
              <S.TableHeader>
                <tr>
                  <S.TableHead>이름</S.TableHead>
                  <S.TableHead>이메일</S.TableHead>
                  <S.TableHead>그룹</S.TableHead>
                  <S.TableHead>셀</S.TableHead>
                  <S.TableHead>출석 여부</S.TableHead>
                  <S.TableHead>출석 시각</S.TableHead>
                </tr>
              </S.TableHeader>

              <tbody>
                {attendanceList.map((u) => (
                  <S.TableRow key={u.user_id}>
                    <S.TableData>{u.name}</S.TableData>
                    <S.TableData>{u.email}</S.TableData>

                    {/* 그룹/셀 이름 객체에서 꺼내기 */}
                    <S.TableData>{u.hub_groups?.name ?? '-'}</S.TableData>
                    <S.TableData>{u.hub_cells?.name ?? '-'}</S.TableData>

                    {/* 출석 여부 */}
                    <S.TableData style={{ color: u.attended ? '#10b981' : '#ef4444' }}>
                      {u.attended ? '● 출석' : '× 미출석'}
                    </S.TableData>

                    {/* 출석 시간 */}
                    <S.TableData>
                      {u.created_at ? new Date(u.created_at).toLocaleString('ko-KR') : '-'}
                    </S.TableData>
                  </S.TableRow>
                ))}
              </tbody>
            </S.Table>
          </S.TableContainer>

        </L.ContentArea>
      </L.MainContent>
    </L.AdminLayout>
  );
}
