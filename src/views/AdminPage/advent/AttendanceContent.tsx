// 파일 경로: src/views/AdminPage/advent/AttendanceContent.tsx
// 대림절 출석 현황 - 콘텐츠 전용 컴포넌트 (MDI용)

import { useEffect, useState, useMemo } from 'react';
import * as S from './attendance-style';
import { useGroups } from '@src/hooks/useGroups';
import { useCells } from '@src/hooks/useCells';

interface AttendanceRecord {
  user_id: string;
  name: string;
  email: string;
  hub_groups: { id: number; name: string } | null;
  hub_cells: { id: number; name: string } | null;
  has_meditation: boolean;
  attended: boolean;
  meditation_created_at: string | null;
  attendance_created_at: string | null;
}

interface UserStat {
  user_id: string;
  name: string;
  email: string;
  group_name: string;
  cell_name: string;
  total_meditations: number;
  total_attendance: number;
}

interface UserDetail {
  date: string;
  day_number: number;
  has_meditation: boolean;
  meditation_content: string | null;
  meditation_reg_dt: string | null;
  has_attendance: boolean;
  attendance_reg_dt: string | null;
}

interface UserDetailResponse {
  user_info: {
    user_id: string;
    name: string;
    email: string;
    group_name: string;
    cell_name: string;
  } | null;
  details: UserDetail[];
}

export default function AttendanceContent() {
  const [date, setDate] = useState(() => {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return koreanTime.toISOString().slice(0, 10).replace(/-/g, '');
  });
  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [cellId, setCellId] = useState<number | ''>('');

  // 실제 조회에 사용되는 필터 상태
  const [appliedDate, setAppliedDate] = useState(() => {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return koreanTime.toISOString().slice(0, 10).replace(/-/g, '');
  });
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedGroupId, setAppliedGroupId] = useState<number | ''>('');
  const [appliedCellId, setAppliedCellId] = useState<number | ''>('');
  
  // 실시간 업데이트 상태
  const [autoRefresh, setAutoRefresh] = useState(false);

  // 탭 상태: 'daily' (날짜별 출석 현황) 또는 'stats' (전체 통계)
  const [activeTab, setActiveTab] = useState<'daily' | 'stats'>('daily');

  const { groups } = useGroups();
  const { cells } = useCells(appliedGroupId);

  const [loading, setLoading] = useState(false);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [attendedCount, setAttendedCount] = useState(0);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // 통계 관련 상태
  const [statsLoading, setStatsLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [sortBy, setSortBy] = useState<'attendance' | 'meditation'>('attendance');
  
  // 상세보기 모달 상태
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userDetail, setUserDetail] = useState<UserDetailResponse | null>(null);

  const fetchAttendance = async () => {
    const query = new URLSearchParams({
      date: appliedDate,
      ...(appliedSearch ? { search: appliedSearch } : {}),
      ...(appliedGroupId ? { group_id: String(appliedGroupId) } : {}),
      ...(appliedCellId ? { cell_id: String(appliedCellId) } : {})
    });

    setLoading(true);
    const res = await fetch(`/api/admin/advent/attendance?${query}`);
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.error);
      return;
    }

    setAttendanceList(data.list);
    setAttendedCount(data.attended);
  };

  // 조회 버튼 클릭 핸들러
  const handleSearch = () => {
    setAppliedDate(date);
    setAppliedSearch(search);
    setAppliedGroupId(groupId);
    setAppliedCellId(cellId);
    // 조회 버튼 클릭 시 즉시 조회 (필터가 모두 "전체"일 때도 조회 가능)
    fetchAttendance();
  };

  useEffect(() => {
    setCellId('');
  }, [groupId]);

  // 초기 로드 시 자동 조회
  useEffect(() => {
    fetchAttendance();
  }, [appliedDate, appliedSearch, appliedGroupId, appliedCellId]);

  // 실시간 업데이트 (30초마다 자동 새로고침) - 토글 가능
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchAttendance();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, appliedDate, appliedSearch, appliedGroupId, appliedCellId]);

  // 출석 처리 핸들러
  const handleMarkAttendance = async (userId: string) => {
    if (!confirm('출석 처리하시겠습니까?')) {
      return;
    }

    setUpdatingUserId(userId);
    try {
      const res = await fetch('/api/admin/advent/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          post_dt: appliedDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '출석 처리에 실패했습니다.');
        return;
      }

      // 성공 시 목록 새로고침
      await fetchAttendance();
    } catch (error) {
      console.error('출석 처리 오류:', error);
      alert('출석 처리 중 오류가 발생했습니다.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // 묵상 시간 기준 최신순 정렬
  const sortedAttendanceList = useMemo(() => {
    return [...attendanceList].sort((a, b) => {
      // 묵상 시간이 없는 경우 맨 뒤로
      if (!a.meditation_created_at && !b.meditation_created_at) return 0;
      if (!a.meditation_created_at) return 1;
      if (!b.meditation_created_at) return -1;
      
      // 최신순 (내림차순)
      return new Date(b.meditation_created_at).getTime() - new Date(a.meditation_created_at).getTime();
    });
  }, [attendanceList]);

  // 통계 조회 함수
  const fetchUserStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/admin/advent/user-stats?sortBy=${sortBy}`);
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || '통계 조회에 실패했습니다.');
        return;
      }
      
      setUserStats(data.stats || []);
    } catch (error) {
      console.error('통계 조회 오류:', error);
      alert('통계 조회 중 오류가 발생했습니다.');
    } finally {
      setStatsLoading(false);
    }
  };

  // 상세보기 조회 함수
  const fetchUserDetail = async (userId: string) => {
    setDetailLoading(true);
    setSelectedUserId(userId);
    setShowDetailModal(true);
    
    try {
      const res = await fetch(`/api/admin/advent/user-detail?user_id=${userId}`);
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || '상세 정보 조회에 실패했습니다.');
        setShowDetailModal(false);
        return;
      }
      
      setUserDetail(data);
    } catch (error) {
      console.error('상세 정보 조회 오류:', error);
      alert('상세 정보 조회 중 오류가 발생했습니다.');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // 통계 탭 활성화 시 자동 조회
  useEffect(() => {
    if (activeTab === 'stats') {
      fetchUserStats();
    }
  }, [activeTab, sortBy]);

  if (loading && activeTab === 'daily') {
    return (
      <S.WelcomeCard>
        <S.WelcomeTitle>로딩 중...</S.WelcomeTitle>
      </S.WelcomeCard>
    );
  }

  return (
    <>
      {/* 탭 메뉴 */}
      <S.TabContainer>
        <S.TabButton 
          active={activeTab === 'daily'} 
          onClick={() => setActiveTab('daily')}
        >
          날짜별 출석 현황
        </S.TabButton>
        <S.TabButton 
          active={activeTab === 'stats'} 
          onClick={() => setActiveTab('stats')}
        >
          전체 통계
        </S.TabButton>
      </S.TabContainer>

      {activeTab === 'daily' && (
        <>
          {/* 필터링 영역 */}
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

        <S.FormGroup>
          <S.SearchButton onClick={handleSearch}>
            🔍 조회하기
          </S.SearchButton>
        </S.FormGroup>
        
        <S.FormGroup>
          <S.AutoRefreshButton 
            active={autoRefresh}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄 실시간 ON' : '⏸️ 실시간 OFF'}
          </S.AutoRefreshButton>
        </S.FormGroup>
      </S.FilterRow>

      {/* 출석 상세 테이블 */}
      <S.TableContainer style={{ marginTop: '24px' }}>
        <S.Table>
          <S.TableHeader>
            <tr>
              <S.TableHead>이름</S.TableHead>
              <S.TableHead>이메일</S.TableHead>
              <S.TableHead>그룹</S.TableHead>
              <S.TableHead>다락방</S.TableHead>
              <S.TableHead>묵상 여부</S.TableHead>
              <S.TableHead>출석 여부</S.TableHead>
              <S.TableHead>묵상 시각</S.TableHead>
              <S.TableHead>출석 시각</S.TableHead>
            </tr>
          </S.TableHeader>
          <tbody>
            {sortedAttendanceList.map((u) => (
              <S.TableRow key={u.user_id}>
                <S.TableData>{u.name}</S.TableData>
                <S.TableData>{u.email}</S.TableData>
                <S.TableData>{u.hub_groups?.name ?? '-'}</S.TableData>
                <S.TableData>{u.hub_cells?.name ?? '-'}</S.TableData>

                <S.TableData style={{ color: u.has_meditation ? '#10b981' : '#ef4444' }}>
                  {u.has_meditation ? '● 완료' : '× 미작성'}
                </S.TableData>

                <S.TableData style={{ color: u.attended ? '#10b981' : '#ef4444' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{u.attended ? '● 출석' : '× 미출석'}</span>
                    {!u.attended && (
                      <S.AttendanceButton
                        onClick={() => handleMarkAttendance(u.user_id)}
                        disabled={updatingUserId === u.user_id}
                      >
                        {updatingUserId === u.user_id ? '처리 중...' : '출석 처리'}
                      </S.AttendanceButton>
                    )}
                  </div>
                </S.TableData>

                <S.TableData>
                  {u.meditation_created_at
                    ? new Date(u.meditation_created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
                    : '-'}
                </S.TableData>

                <S.TableData>
                  {u.attendance_created_at
                    ? new Date(u.attendance_created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
                    : '-'}
                </S.TableData>
              </S.TableRow>
            ))}
          </tbody>
        </S.Table>
      </S.TableContainer>
        </>
      )}

      {activeTab === 'stats' && (
        <>
          {/* 정렬 옵션 */}
          <S.FilterRow>
            <S.FormGroup>
              <S.Label>정렬 기준</S.Label>
              <S.Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'attendance' | 'meditation')}
              >
                <option value="attendance">총 출석 수</option>
                <option value="meditation">총 묵상 수</option>
              </S.Select>
            </S.FormGroup>
            <S.FormGroup>
              <S.SearchButton onClick={fetchUserStats}>
                🔄 새로고침
              </S.SearchButton>
            </S.FormGroup>
          </S.FilterRow>

          {/* 통계 테이블 */}
          {statsLoading ? (
            <S.WelcomeCard>
              <S.WelcomeTitle>통계 조회 중...</S.WelcomeTitle>
            </S.WelcomeCard>
          ) : (
            <S.TableContainer style={{ marginTop: '24px' }}>
              <S.Table>
                <S.TableHeader>
                  <tr>
                    <S.TableHead>이름</S.TableHead>
                    <S.TableHead>이메일</S.TableHead>
                    <S.TableHead>그룹</S.TableHead>
                    <S.TableHead>다락방</S.TableHead>
                    <S.TableHead>총 묵상 수</S.TableHead>
                    <S.TableHead>총 출석 수</S.TableHead>
                    <S.TableHead>상세보기</S.TableHead>
                  </tr>
                </S.TableHeader>
                <tbody>
                  {userStats.map((stat) => (
                    <S.TableRow key={stat.user_id}>
                      <S.TableData>{stat.name}</S.TableData>
                      <S.TableData>{stat.email}</S.TableData>
                      <S.TableData>{stat.group_name || '-'}</S.TableData>
                      <S.TableData>{stat.cell_name || '-'}</S.TableData>
                      <S.TableData style={{ fontWeight: 600, color: '#3b82f6' }}>
                        {stat.total_meditations}
                      </S.TableData>
                      <S.TableData style={{ fontWeight: 600, color: '#10b981' }}>
                        {stat.total_attendance}
                      </S.TableData>
                      <S.TableData>
                        <S.DetailButton onClick={() => fetchUserDetail(stat.user_id)}>
                          상세보기
                        </S.DetailButton>
                      </S.TableData>
                    </S.TableRow>
                  ))}
                  {userStats.length === 0 && (
                    <S.TableRow>
                      <S.TableData colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                        통계 데이터가 없습니다.
                      </S.TableData>
                    </S.TableRow>
                  )}
                </tbody>
              </S.Table>
            </S.TableContainer>
          )}
        </>
      )}

      {/* 상세보기 모달 */}
      {showDetailModal && (
        <S.ModalOverlay onClick={() => setShowDetailModal(false)}>
          <S.ModalContent onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>
                {userDetail?.user_info ? (
                  <>
                    {userDetail.user_info.name}님의 상세 정보
                    <S.ModalSubtitle>
                      {userDetail.user_info.email} | {userDetail.user_info.group_name || '-'} | {userDetail.user_info.cell_name || '-'}
                    </S.ModalSubtitle>
                  </>
                ) : (
                  '상세 정보'
                )}
              </S.ModalTitle>
              <S.ModalCloseButton onClick={() => setShowDetailModal(false)}>
                ✕
              </S.ModalCloseButton>
            </S.ModalHeader>
            
            <S.ModalBody>
              {detailLoading ? (
                <S.LoadingState>
                  <S.Spinner />
                  <S.EmptyText>로딩 중...</S.EmptyText>
                </S.LoadingState>
              ) : userDetail ? (
                <S.DetailTableContainer>
                  <S.DetailTable>
                    <S.TableHeader>
                      <tr>
                        <S.TableHead>날짜</S.TableHead>
                        <S.TableHead>일차</S.TableHead>
                        <S.TableHead>묵상</S.TableHead>
                        <S.TableHead>묵상 내용</S.TableHead>
                        <S.TableHead>묵상 시각</S.TableHead>
                        <S.TableHead>출석</S.TableHead>
                        <S.TableHead>출석 시각</S.TableHead>
                      </tr>
                    </S.TableHeader>
                    <tbody>
                      {userDetail.details.map((detail) => (
                        <S.TableRow key={detail.date}>
                          <S.TableData>
                            {detail.date.slice(0, 4)}-{detail.date.slice(4, 6)}-{detail.date.slice(6, 8)}
                          </S.TableData>
                          <S.TableData>{detail.day_number}일차</S.TableData>
                          <S.TableData style={{ color: detail.has_meditation ? '#10b981' : '#ef4444' }}>
                            {detail.has_meditation ? '●' : '×'}
                          </S.TableData>
                          <S.TableData style={{ maxWidth: '300px', wordBreak: 'break-word' }}>
                            {detail.meditation_content || '-'}
                          </S.TableData>
                          <S.TableData>
                            {detail.meditation_reg_dt
                              ? new Date(detail.meditation_reg_dt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
                              : '-'}
                          </S.TableData>
                          <S.TableData style={{ color: detail.has_attendance ? '#10b981' : '#ef4444' }}>
                            {detail.has_attendance ? '●' : '×'}
                          </S.TableData>
                          <S.TableData>
                            {detail.attendance_reg_dt
                              ? new Date(detail.attendance_reg_dt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
                              : '-'}
                          </S.TableData>
                        </S.TableRow>
                      ))}
                    </tbody>
                  </S.DetailTable>
                </S.DetailTableContainer>
              ) : (
                <S.EmptyState>
                  <S.EmptyText>상세 정보를 불러올 수 없습니다.</S.EmptyText>
                </S.EmptyState>
              )}
            </S.ModalBody>
          </S.ModalContent>
        </S.ModalOverlay>
      )}
    </>
  );
}

