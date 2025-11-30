// 파일 경로: src/views/AdminPage/users/index.tsx

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as S from './style';
import { Combobox } from '@src/components/ui/combobox';

// 사용자 타입 정의
interface User {
  user_id: string;
  email: string;
  name: string;
  birth_date?: string;
  community?: string;
  group_id?: number;
  cell_id?: number;
  group_name?: string;
  cell_name?: string;
  group?: { id: number; name: string };
  cell?: { id: number; name: string };
  status?: string;
  created_at: string;
  roles?: string[];
}

interface Group {
  id: number;
  name: string;
}

interface Cell {
  id: number;
  name: string;
  group_id?: number;
}

interface PaginatedResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 역할 목록은 DB에서 조회

// 공동체 목록
const COMMUNITIES = ['허브', '타공동체'];

// 상태 목록
const STATUS_OPTIONS = ['활성', '차단', '휴면', '새신자', '관리자'];

export default function UsersAdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'accounts' | 'permissions'>('accounts');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState(''); // 실제 조회에 사용되는 검색어
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // 필터 상태
  const [filterCommunity, setFilterCommunity] = useState('');
  const [filterGroupId, setFilterGroupId] = useState('');
  const [filterCellId, setFilterCellId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // 실제 조회에 사용되는 필터 상태
  const [appliedFilterCommunity, setAppliedFilterCommunity] = useState('');
  const [appliedFilterGroupId, setAppliedFilterGroupId] = useState('');
  const [appliedFilterCellId, setAppliedFilterCellId] = useState('');
  const [appliedFilterStatus, setAppliedFilterStatus] = useState('');
  
  // 실시간 업데이트 상태
  const [autoRefresh, setAutoRefresh] = useState(false);

  // 권한 목록 조회 (DB에서)
  const { data: availableRoles } = useQuery<Array<{ id: number; name: string; description?: string | null }>>({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const response = await fetch('/api/admin/roles');
      if (!response.ok) throw new Error('권한 목록을 가져오는 데 실패했습니다.');
      return response.json();
    },
  });

  // 회원 정보 수정 상태 (말씀카드와 동일하게 문자열로 관리)
  const [editFormData, setEditFormData] = useState({
    community: '',
    group_id: '',
    cell_id: '',
    status: '',
  });

  // 조회 버튼 클릭 핸들러
  const handleSearch = () => {
    setAppliedSearch(searchQuery);
    setAppliedFilterCommunity(filterCommunity);
    setAppliedFilterGroupId(filterGroupId);
    setAppliedFilterCellId(filterCellId);
    setAppliedFilterStatus(filterStatus);
    setCurrentPage(1);
    // 조회 버튼 클릭 시 강제 새로고침 (필터가 모두 "전체"일 때도 조회 가능)
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };
  
  // 초기 로드 시 자동 조회 (한 번만)
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 최초 마운트 시에만 실행

  // 타공동체 선택 시 그룹/다락방 초기화 (말씀카드와 동일)
  useEffect(() => {
    if (editFormData.community === '타공동체') {
      setEditFormData(prev => ({
        ...prev,
        group_id: '',
        cell_id: '',
      }));
    }
  }, [editFormData.community]);

  // 사용자 목록 조회 (페이징) - applied 필터 사용
  const { data: usersData, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['admin-users', appliedSearch, currentPage, limit, appliedFilterCommunity, appliedFilterGroupId, appliedFilterCellId, appliedFilterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: appliedSearch,
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      
      if (appliedFilterCommunity) params.append('community', appliedFilterCommunity);
      if (appliedFilterGroupId) params.append('group_id', appliedFilterGroupId);
      if (appliedFilterCellId) params.append('cell_id', appliedFilterCellId);
      if (appliedFilterStatus) params.append('status', appliedFilterStatus);

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('사용자 목록을 가져오는 데 실패했습니다.');
      return response.json();
    },
    enabled: true, // 항상 활성화 (초기 로드 시에도 조회)
    refetchInterval: autoRefresh ? 30000 : false, // 실시간 업데이트 토글
  });

  // 그룹 목록 조회 (hub_groups 테이블에는 community 컬럼이 없으므로 모든 그룹 반환)
  const { data: groups } = useQuery<Group[]>({
    queryKey: ['admin-groups'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/groups`);
      if (!response.ok) throw new Error('그룹 목록을 가져오는 데 실패했습니다.');
      return response.json();
    },
  });

  // 수정 모달용 그룹 목록 조회 (허브 공동체일 때만)
  const { data: editGroups } = useQuery<Group[]>({
    queryKey: ['admin-edit-groups'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/groups`);
      if (!response.ok) throw new Error('그룹 목록을 가져오는 데 실패했습니다.');
      return response.json();
    },
    enabled: editFormData.community === '허브',
  });

  // 다락방 목록 조회 (그룹 선택 여부와 관계없이 항상 전체 다락방 조회)
  const { data: cells } = useQuery<Cell[]>({
    queryKey: ['admin-cells'],
    queryFn: async () => {
      // 항상 전체 다락방 조회 (그룹 필터링 없음)
      const response = await fetch(`/api/admin/users/cells`);
      if (!response.ok) throw new Error('다락방 목록을 가져오는 데 실패했습니다.');
      return response.json();
    },
    enabled: editFormData.community === '허브',
  });

  // 필터용 다락방 목록 조회 (그룹 선택 없이도 전체 조회 가능)
  const { data: filterCells } = useQuery<Cell[]>({
    queryKey: ['admin-filter-cells', filterGroupId],
    queryFn: async () => {
      // 그룹이 선택되어 있으면 해당 그룹의 다락방만, 없으면 전체 다락방 조회
      const params = filterGroupId ? `?group_id=${filterGroupId}` : '';
      const response = await fetch(`/api/admin/users/cells${params}`);
      if (!response.ok) throw new Error('다락방 목록을 가져오는 데 실패했습니다.');
      return response.json();
    },
    enabled: true, // 항상 활성화하여 그룹 선택 없이도 전체 다락방 조회 가능
  });

  // 권한 수정 뮤테이션
  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: string[] }) => {
      const response = await fetch('/api/admin/users/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roles }),
      });
      if (!response.ok) throw new Error('권한 수정에 실패했습니다.');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsModalOpen(false);
      setSelectedUser(null);
      alert('권한이 수정되었습니다.');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 사용자 정보 수정 뮤테이션
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Record<string, any> }) => {
      const response = await fetch('/api/admin/users/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...data }),
      });
      if (!response.ok) throw new Error('사용자 정보 수정에 실패했습니다.');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsModalOpen(false);
      setSelectedUser(null);
      alert('사용자 정보가 수정되었습니다.');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 모달 열기
  const handleOpenModal = (user: User) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles || []);
    // 말씀카드 정보수정과 동일하게 데이터 설정
    setEditFormData({
      community: user.community || '',
      group_id: user.group_id ? String(user.group_id) : '',
      cell_id: user.cell_id ? String(user.cell_id) : '',
      status: user.status || '',
    });
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setSelectedRoles([]);
    setEditFormData({
      community: '',
      group_id: '',
      cell_id: '',
      status: '',
    });
  };

  // 역할 토글
  const handleToggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  // 권한 저장
  const handleSaveRoles = () => {
    if (!selectedUser) return;
    updateRolesMutation.mutate({
      userId: selectedUser.user_id,
      roles: selectedRoles,
    });
  };

  // 사용자 정보 저장
  const handleSaveUser = () => {
    if (!selectedUser) return;
    // 말씀카드 정보수정과 동일하게 타공동체면 group_id, cell_id를 null로
    const submitData = {
      community: editFormData.community || null,
      group_id: editFormData.community === '타공동체' 
        ? null 
        : (editFormData.group_id ? parseInt(String(editFormData.group_id)) : null),
      cell_id: editFormData.community === '타공동체' 
        ? null 
        : (editFormData.cell_id ? parseInt(String(editFormData.cell_id)) : null),
      status: editFormData.status || null,
    };
    updateUserMutation.mutate({
      userId: selectedUser.user_id,
      data: submitData,
    });
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setFilterCommunity('');
    setFilterGroupId('');
    setFilterCellId('');
    setFilterStatus('');
    setSearchQuery('');
    setAppliedSearch('');
    setAppliedFilterCommunity('');
    setAppliedFilterGroupId('');
    setAppliedFilterCellId('');
    setAppliedFilterStatus('');
    setCurrentPage(1);
    // 초기화 후 자동 조회
    setTimeout(() => {
      handleSearch();
    }, 0);
  };

  const users = usersData?.data || [];
  const pagination = usersData?.pagination;

  return (
    <>
      {/* 헤더 섹션 */}
      <S.Header>
        <S.HeaderLeft>
          <S.Title>👥 회원관리</S.Title>
          <S.Subtitle>사용자 계정 및 권한을 관리합니다</S.Subtitle>
        </S.HeaderLeft>
      </S.Header>

      <S.Container>
        <S.Tabs>
          <S.Tab
            active={activeTab === 'accounts'}
            onClick={() => setActiveTab('accounts')}
          >
            계정관리
          </S.Tab>
          <S.Tab
            active={activeTab === 'permissions'}
            onClick={() => setActiveTab('permissions')}
          >
            권한관리
          </S.Tab>
        </S.Tabs>

        {/* 필터 섹션 */}
        <FilterSection>
          <FilterGroup>
            <FilterLabel>공동체</FilterLabel>
            <Combobox
              value={filterCommunity}
              onChange={(value) => {
                setFilterCommunity(value);
                setFilterGroupId('');
                setFilterCellId('');
              }}
              options={[
                { value: '', label: '전체' },
                ...COMMUNITIES.map(c => ({ value: c, label: c })),
              ]}
              placeholder="전체"
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>그룹</FilterLabel>
            <Combobox
              value={filterGroupId}
              onChange={(value) => {
                setFilterGroupId(value);
                setFilterCellId('');
              }}
              options={[
                { value: '', label: '전체' },
                ...(groups?.map(g => ({ value: g.id.toString(), label: g.name })) || []),
              ]}
              placeholder="전체"
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>다락방</FilterLabel>
            <Combobox
              value={filterCellId}
              onChange={(value) => {
                setFilterCellId(value);
              }}
              options={[
                { value: '', label: '전체' },
                ...(filterCells?.map(c => ({ value: c.id.toString(), label: c.name })) || []),
              ]}
              placeholder="전체"
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>상태</FilterLabel>
            <Combobox
              value={filterStatus}
              onChange={(value) => {
                setFilterStatus(value);
              }}
              options={[
                { value: '', label: '전체' },
                ...STATUS_OPTIONS.map(s => ({ value: s, label: s })),
              ]}
              placeholder="전체"
            />
          </FilterGroup>

          <FilterGroup style={{ flex: 1, maxWidth: '300px' }}>
            <FilterLabel>검색</FilterLabel>
            <S.SearchInput
              type="text"
              placeholder="이름, 이메일로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              style={{ width: '100%' }}
            />
          </FilterGroup>

          <SearchButton onClick={handleSearch}>
            🔍 조회하기
          </SearchButton>
          
          <ResetButton onClick={handleResetFilters}>
            초기화
          </ResetButton>

          <AutoRefreshButton 
            active={autoRefresh}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄 실시간 업데이트 ON' : '⏸️ 실시간 업데이트 OFF'}
          </AutoRefreshButton>
        </FilterSection>

        {isLoading ? (
          <S.LoadingState>
            <S.Spinner />
            <p>로딩 중...</p>
          </S.LoadingState>
        ) : users && users.length > 0 ? (
          <>
            {/* 목록 정보 및 페이지당 개수 설정 */}
            <ListInfoBar>
              <ListInfoText>
                검색 결과: <strong>{pagination?.total || 0}건</strong>
                {appliedSearch && ` (검색어: "${appliedSearch}")`}
              </ListInfoText>
              <LimitSelector>
                <LimitLabel>페이지당 개수:</LimitLabel>
                <Combobox
                  value={limit.toString()}
                  onChange={(value) => {
                    setLimit(Number(value));
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                  ]}
                  placeholder="20"
                />
              </LimitSelector>
            </ListInfoBar>

            <S.TableContainer>
              <S.Table>
                <S.TableHeader>
                  <S.TableRow>
                    <S.TableHead>사용자</S.TableHead>
                    <S.TableHead>공동체</S.TableHead>
                    <S.TableHead>그룹/다락방</S.TableHead>
                    {activeTab === 'permissions' && <S.TableHead>권한</S.TableHead>}
                    <S.TableHead>작업</S.TableHead>
                  </S.TableRow>
                </S.TableHeader>
                <tbody>
                  {users.map((user) => (
                    <S.TableRow key={user.user_id}>
                      <S.TableData>
                        <S.UserInfo>
                          <S.UserAvatar>
                            {user.name?.charAt(0) || 'U'}
                          </S.UserAvatar>
                          <S.UserDetails>
                            <S.UserName>{user.name}</S.UserName>
                            <S.UserEmail>{user.email}</S.UserEmail>
                          </S.UserDetails>
                        </S.UserInfo>
                      </S.TableData>
                      <S.TableData>
                        {user.community || '-'}
                      </S.TableData>
                      <S.TableData>
                        {user.group_name && user.cell_name
                          ? `${user.group_name} / ${user.cell_name}`
                          : user.group_name || user.cell_name || '-'}
                      </S.TableData>
                      {activeTab === 'permissions' && (
                        <S.TableData>
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <S.Badge key={role} color="blue" style={{ marginRight: '4px' }}>
                                {role}
                              </S.Badge>
                            ))
                          ) : (
                            <S.Badge color="red">권한 없음</S.Badge>
                          )}
                        </S.TableData>
                      )}
                      <S.TableData>
                        <S.ActionButton onClick={() => handleOpenModal(user)}>
                          {activeTab === 'accounts' 
                            ? '정보수정' 
                            : user.roles && user.roles.length > 0 
                              ? '권한수정' 
                              : '권한추가'}
                        </S.ActionButton>
                      </S.TableData>
                    </S.TableRow>
                  ))}
                </tbody>
              </S.Table>
            </S.TableContainer>

            {/* 페이지네이션 */}
            {pagination && pagination.totalPages > 1 && (
              <S.Pagination>
                <S.PageButton
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  ≪
                </S.PageButton>
                <S.PageButton
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  ＜
                </S.PageButton>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <S.PageButton
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </S.PageButton>
                  );
                })}

                <S.PageButton
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                >
                  ＞
                </S.PageButton>
                <S.PageButton
                  onClick={() => setCurrentPage(pagination.totalPages)}
                  disabled={currentPage === pagination.totalPages}
                >
                  ≫
                </S.PageButton>
              </S.Pagination>
            )}
          </>
        ) : (
          <S.EmptyState>
            <S.EmptyIcon>👤</S.EmptyIcon>
            <S.EmptyText>
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
            </S.EmptyText>
          </S.EmptyState>
        )}

        {/* 사용자 상세/권한 수정 모달 */}
        {isModalOpen && selectedUser && (
          <S.Modal onClick={handleCloseModal}>
            <S.ModalContent onClick={(e) => e.stopPropagation()}>
              <S.ModalHeader>
                <S.ModalTitle>
                  {activeTab === 'accounts' 
                    ? '회원 정보 수정' 
                    : selectedUser.roles && selectedUser.roles.length > 0 
                      ? '권한 수정' 
                      : '권한 추가'}
                </S.ModalTitle>
                <S.CloseButton onClick={handleCloseModal}>×</S.CloseButton>
              </S.ModalHeader>

              {activeTab === 'accounts' ? (
                <>
                  <S.FormGroup>
                    <S.Label>이름</S.Label>
                    <S.Input type="text" value={selectedUser.name} disabled />
                  </S.FormGroup>
                  <S.FormGroup>
                    <S.Label>이메일</S.Label>
                    <S.Input type="email" value={selectedUser.email} disabled />
                  </S.FormGroup>
                  <S.FormGroup>
                    <S.Label>공동체</S.Label>
                    <Combobox
                      value={editFormData.community}
                      onChange={(newCommunity) => {
                        // 공동체 변경 시 그룹/다락방 초기화 (말씀카드와 동일)
                        setEditFormData(prev => ({
                          ...prev,
                          community: newCommunity,
                          group_id: '',
                          cell_id: '',
                        }));
                      }}
                      options={[
                        { value: '', label: '선택하세요' },
                        ...COMMUNITIES.map(c => ({ value: c, label: c })),
                      ]}
                      placeholder="선택하세요"
                    />
                  </S.FormGroup>
                  {editFormData.community === '허브' && (
                    <>
                      <S.FormGroup>
                        <S.Label>그룹</S.Label>
                        <Combobox
                          value={editFormData.group_id}
                          onChange={(newGroupId) => {
                            setEditFormData(prev => ({
                              ...prev,
                              group_id: newGroupId,
                              cell_id: '', // 그룹 변경 시 다락방 초기화
                            }));
                          }}
                          options={[
                            { value: '', label: '선택하세요' },
                            ...(editGroups?.map(g => ({ value: g.id.toString(), label: g.name })) || []),
                          ]}
                          placeholder="선택하세요"
                        />
                      </S.FormGroup>
                      <S.FormGroup>
                        <S.Label>다락방</S.Label>
                        <Combobox
                          value={editFormData.cell_id}
                          onChange={(value) => setEditFormData(prev => ({
                            ...prev,
                            cell_id: value,
                          }))}
                          options={[
                            { value: '', label: '선택하세요' },
                            ...(cells?.map(c => ({ value: c.id.toString(), label: c.name })) || []),
                          ]}
                          placeholder="선택하세요"
                        />
                      </S.FormGroup>
                    </>
                  )}
                  {editFormData.community === '타공동체' && (
                    <div style={{ 
                      padding: '12px', 
                      background: '#f0f9ff', 
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#0369a1',
                      marginBottom: '16px'
                    }}>
                      타공동체 소속이시군요! 그룹/다락방 선택은 생략됩니다.
                    </div>
                  )}
                  <S.FormGroup>
                    <S.Label>상태</S.Label>
                    <Combobox
                      value={editFormData.status}
                      onChange={(value) => setEditFormData(prev => ({
                        ...prev,
                        status: value,
                      }))}
                      options={[
                        { value: '', label: '선택하세요' },
                        ...STATUS_OPTIONS.map(s => ({ value: s, label: s })),
                      ]}
                      placeholder="선택하세요"
                    />
                  </S.FormGroup>
                  <S.FormGroup>
                    <S.Label>가입일</S.Label>
                    <S.Input
                      type="text"
                      value={new Date(selectedUser.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                      disabled
                    />
                  </S.FormGroup>
                  <S.ButtonGroup>
                    <S.Button variant="secondary" onClick={handleCloseModal}>
                      취소
                    </S.Button>
                    <S.Button
                      variant="primary"
                      onClick={handleSaveUser}
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending ? '저장 중...' : '저장'}
                    </S.Button>
                  </S.ButtonGroup>
                </>
              ) : (
                <>
                  <S.FormGroup>
                    <S.Label>사용자: {selectedUser.name} ({selectedUser.email})</S.Label>
                    {(!selectedUser.roles || selectedUser.roles.length === 0) && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '12px', 
                        background: '#fef3c7', 
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#92400e'
                      }}>
                        ⚠️ 현재 이 사용자는 관리자 권한이 없습니다. 필요한 권한을 선택하여 추가해주세요.
                      </div>
                    )}
                  </S.FormGroup>
                  <S.FormGroup>
                    <S.Label>권한 선택</S.Label>
                    {!availableRoles || availableRoles.length === 0 ? (
                      <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', fontSize: '13px', color: '#64748b' }}>
                        권한 목록을 불러오는 중...
                      </div>
                    ) : (
                      <S.CheckboxGroup>
                        {availableRoles.map((role) => (
                          <S.CheckboxLabel key={role.id}>
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role.name)}
                            onChange={() => handleToggleRole(role.name)}
                          />
                          <span>{role.name}</span>
                          {role.description && (
                            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>
                              ({role.description})
                            </span>
                          )}
                        </S.CheckboxLabel>
                      ))}
                      </S.CheckboxGroup>
                    )}
                    {selectedRoles.length === 0 && selectedUser.roles && selectedUser.roles.length > 0 && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '12px', 
                        background: '#fee2e2', 
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#991b1b'
                      }}>
                        ⚠️ 모든 권한을 제거하면 일반 사용자로 전환됩니다.
                      </div>
                    )}
                  </S.FormGroup>
                  <S.ButtonGroup>
                    <S.Button variant="secondary" onClick={handleCloseModal}>
                      취소
                    </S.Button>
                    <S.Button
                      variant="primary"
                      onClick={handleSaveRoles}
                      disabled={updateRolesMutation.isPending}
                    >
                      {updateRolesMutation.isPending ? '저장 중...' : '저장'}
                    </S.Button>
                  </S.ButtonGroup>
                </>
              )}
            </S.ModalContent>
          </S.Modal>
        )}
      </S.Container>
    </>
  );
}

// 필터 스타일 컴포넌트
import styled from '@emotion/styled';

const FilterSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: #f8fafc;
  border-radius: 8px;
  align-items: flex-end;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 12px;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FilterLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
`;

const SearchButton = styled.button`
  padding: 10px 20px;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  height: fit-content;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ResetButton = styled.button`
  padding: 10px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  height: fit-content;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
`;

const AutoRefreshButton = styled.button<{ active: boolean }>`
  padding: 10px 16px;
  background: ${props => props.active ? '#10b981' : 'white'};
  border: 1px solid ${props => props.active ? '#10b981' : '#e2e8f0'};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.active ? 'white' : '#64748b'};
  cursor: pointer;
  transition: all 0.2s ease;
  height: fit-content;
  white-space: nowrap;

  &:hover {
    background: ${props => props.active ? '#059669' : '#f1f5f9'};
    border-color: ${props => props.active ? '#059669' : '#cbd5e1'};
    color: ${props => props.active ? 'white' : '#1e293b'};
  }

  @media (max-width: 768px) {
    font-size: 12px;
    padding: 8px 12px;
  }
`;

const ListInfoBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
`;

const ListInfoText = styled.div`
  font-size: 14px;
  color: #64748b;

  strong {
    color: #1e293b;
    font-weight: 600;
  }
`;

const LimitSelector = styled.div`
  display: flex;
  align-items: center;
`;

const LimitLabel = styled.label`
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
`;
