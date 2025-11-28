// 파일 경로: src/pages/admin/advent/attendance.tsx

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import * as L from '@src/views/AdminPage/style';
import * as S from '@src/views/AdminPage/advent/attendance-style';
import Link from 'next/link';

import { useGroups } from '@src/hooks/useGroups';
import { useCells } from '@src/hooks/useCells';

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

  const [date, setDate] = useState(() => {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return koreanTime.toISOString().slice(0, 10).replace(/-/g, '');
  });

  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [cellId, setCellId] = useState<number | ''>('');

  // 공통 훅 (그룹/다락방)
  const { groups } = useGroups();
  const { cells } = useCells(groupId);

  const [loading, setLoading] = useState(false);
  const [originalList, setOriginalList] = useState<AttendanceRecord[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [attendedCount, setAttendedCount] = useState(0);

  // 권한 체크
  useEffect(() => {
    if (status === 'authenticated') {
      if (!session?.user?.isAdmin) {
        alert('관리자만 접근 가능합니다.');
        router.replace('/');
      } else if (!roles.includes('목회자')) {
        alert('목회자 권한이 없습니다.');
        router.replace('/admin');
      }
    }

    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, session]);

  // -------------------------
  // API로 출석 데이터 Fetch
  // -------------------------
  const fetchAttendance = async () => {
    const query = new URLSearchParams({
      date,
      ...(search ? { search } : {}),
      ...(groupId ? { group_id: String(groupId) } : {}),
      ...(cellId ? { cell_id: String(cellId) } : {})
    });

    setLoading(true);
    const res = await fetch(`/api/admin/advent/attendance?${query}`);
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.error);
      return;
    }

    // 원본(전체) 데이터 저장
    setOriginalList(data.list);

    // 화면 표시 데이터 저장
    setAttendanceList(data.list);
    setTotalUsers(data.total_users);
    setAttendedCount(data.attended);
  };

  // 그룹 변경 시 다락방 초기화
  useEffect(() => {
    setCellId('');
  }, [groupId]);

  useEffect(() => {
    fetchAttendance();
  }, [date, search, groupId, cellId]);

  // 로딩 화면
  if (status === 'loading') {
    return (
      <L.AdminLayout>
        <L.LoadingContainer>
          <L.LoadingSpinner />
          <L.LoadingText>Loading...</L.LoadingText>
        </L.LoadingContainer>
      </L.AdminLayout>
    );
  }

  // -------------------------
  // 그룹·다락방 통계 계산
  // -------------------------
  const groupCellStats = useMemo(() => {
    const stats: {
      [groupId: string]: {
        groupName: string;
        cells: {
          [cellId: string]: {
            cellName: string;
            total: number;
            attended: number;
          };
        };
      };
    } = {};

    originalList.forEach((u) => {
      const gId = u.hub_groups?.id ?? 'none';
      const gName = u.hub_groups?.name ?? '해당없음';

      const cId = u.hub_cells?.id ?? 'none';
      const cName = u.hub_cells?.name ?? '해당없음';

      if (!stats[gId]) {
        stats[gId] = {
          groupName: gName,
          cells: {},
        };
      }

      if (!stats[gId].cells[cId]) {
        stats[gId].cells[cId] = {
          cellName: cName,
          total: 0,
          attended: 0,
        };
      }

      stats[gId].cells[cId].total += 1;
      if (u.attended) {
        stats[gId].cells[cId].attended += 1;
      }
    });

    return stats;
  }, [originalList]);

  return (
    <L.AdminLayout>

      {/* --- Sidebar --- */}
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

              <Link href="/admin/advent/stats" passHref legacyBehavior>
                <L.NavItem as="a">
                  <L.NavIcon>📊</L.NavIcon>
                  {!sidebarCollapsed && <L.NavText>대림절 통계</L.NavText>}
                </L.NavItem>
              </Link>
            </>
          )}
        </L.NavMenu>
      </L.Sidebar>

      {/* --- Main Content --- */}
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
        </L.TopBar>

        <L.ContentArea>

          {/* 🔹 필터링 영역 */}
          <S.FilterRow>
            <S.FormGroup>
              <S.Label>날짜</S.Label>
              <S.Input
                type="date"
                value={`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`}
                onChange={(e) => setDate(e.target.value.replace(/-/g, ''))}
              />
            </S.FormGroup>

            <S.FormGroup>
              <S.Label>그룹</S.Label>
              <S.Select
                value={groupId}
                onChange={(e) => {
                  const val = Number(e.target.value) || '';
                  setGroupId(val);
                  setCellId('');
                }}
              >
                <option value="">전체</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </S.Select>
            </S.FormGroup>

            <S.FormGroup>
              <S.Label>다락방</S.Label>
              <S.Select
                value={cellId}
                onChange={(e) => setCellId(Number(e.target.value) || '')}
              >
                <option value="">전체</option>
                {cells.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </S.Select>
            </S.FormGroup>

            <S.FormGroup>
              <S.Label>검색(이름/이메일)</S.Label>
              <S.Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </S.FormGroup>
          </S.FilterRow>

          {/* 🔹 전체 출석 통계 */}
          <S.WelcomeCard>
            <S.WelcomeTitle>출석 통계</S.WelcomeTitle>
            <S.WelcomeSubtitle>
              총 {totalUsers}명 중 {attendedCount}명 출석 (
              {(totalUsers ? (attendedCount / totalUsers) * 100 : 0).toFixed(1)}%)
            </S.WelcomeSubtitle>
          </S.WelcomeCard>

          {/* 🔹 그룹/다락방 통계표 */}
          <S.TableContainer style={{ marginTop: '24px' }}>
            <S.Table>
              <S.TableHeader>
                <tr>
                  <S.TableHead>그룹</S.TableHead>
                  <S.TableHead>다락방</S.TableHead>
                  <S.TableHead>총 인원</S.TableHead>
                  <S.TableHead>출석</S.TableHead>
                  <S.TableHead>출석률</S.TableHead>
                </tr>
              </S.TableHeader>

              <tbody>
                {Object.entries(groupCellStats).map(([gid, group]) =>
                  Object.entries(group.cells).map(([cid, cell]) => (
                    <S.TableRow key={`${gid}-${cid}`}>
                      <S.TableData>{group.groupName}</S.TableData>
                      <S.TableData>{cell.cellName}</S.TableData>
                      <S.TableData>{cell.total}</S.TableData>
                      <S.TableData>{cell.attended}</S.TableData>
                      <S.TableData>
                        {cell.total
                          ? ((cell.attended / cell.total) * 100).toFixed(1) + '%'
                          : '-'}
                      </S.TableData>
                    </S.TableRow>
                  ))
                )}
              </tbody>
            </S.Table>
          </S.TableContainer>

          {/* 🔹 출석 상세 테이블 */}
          <S.TableContainer style={{ marginTop: '24px' }}>
            <S.Table>
              <S.TableHeader>
                <tr>
                  <S.TableHead>이름</S.TableHead>
                  <S.TableHead>이메일</S.TableHead>
                  <S.TableHead>그룹</S.TableHead>
                  <S.TableHead>다락방</S.TableHead>
                  <S.TableHead>출석 여부</S.TableHead>
                  <S.TableHead>출석 시각</S.TableHead>
                </tr>
              </S.TableHeader>

              <tbody>
                {attendanceList.map((u) => (
                  <S.TableRow key={u.user_id}>
                    <S.TableData>{u.name}</S.TableData>
                    <S.TableData>{u.email}</S.TableData>
                    <S.TableData>{u.hub_groups?.name ?? '-'}</S.TableData>
                    <S.TableData>{u.hub_cells?.name ?? '-'}</S.TableData>

                    <S.TableData style={{ color: u.attended ? '#10b981' : '#ef4444' }}>
                      {u.attended ? '● 출석' : '× 미출석'}
                    </S.TableData>

                    <S.TableData>
                      {u.created_at
                        ? new Date(u.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
                        : '-'}
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
