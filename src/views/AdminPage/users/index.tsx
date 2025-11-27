// 파일 경로: src/views/AdminPage/users/index.tsx

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as S from './style';

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
  community?: string;
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

// 역할 목록
const AVAILABLE_ROLES = [
  '사진팀',
  '디자인팀',
  '양육MC',
  '서기',
  '목회자',
  '그룹장',
  '다락방장',
  'MC'
];

// 공동체 목록
const COMMUNITIES = ['허브', '타공동체'];

// 상태 목록
const STATUS_OPTIONS = ['관리자', '일반', '휴면', '탈퇴'];

export default function UsersAdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'accounts' | 'permissions'>('accounts');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // 필터 상태
  const [filterCommunity, setFilterCommunity] = useState('');
  const [filterGroupId, setFilterGroupId] = useState('');
  const [filterCellId, setFilterCellId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // 회원 정보 수정 상태
  const [editFormData, setEditFormData] = useState({
    community: '',
    group_id: '' as string | number,
    cell_id: '' as string | number,
    status: '',
  });

  // 검색어 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 사용자 목록 조회 (페이징)
  const { data: usersData, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['admin-users', debouncedSearch, currentPage, limit, filterCommunity, filterGroupId, filterCellId, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      
      if (filterCommunity) params.append('community', filterCommunity);
      if (filterGroupId) params.append('group_id', filterGroupId);
      if (filterCellId) params.append('cell_id', filterCellId);
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('사용자 목록을 가져오는 데 실패했습니다.');
      return response.json();
    },
  });

  // 그룹 목록 조회
  const { data: groups } = useQuery<Group[]>({
    queryKey: ['admin-groups', filterCommunity],
    queryFn: async () => {
      const params = filterCommunity ? `?community=${filterCommunity}` : '';
      const response = await fetch(`/api/admin/users/groups${params}`);
      if (!response.ok) throw new Error('그룹 목록을 가져오는 데 실패했습니다.');
      return response.json();
    },
  });

  // 다락방 목록 조회
  const { data: cells } = useQuery<Cell[]>({
    queryKey: ['admin-cells', filterGroupId, editFormData.group_id],
    queryFn: async () => {
      const groupId = filterGroupId || editFormData.group_id;
      const params = groupId ? `?group_id=${groupId}` : '';
      const response = await fetch(`/api/admin/users/cells${params}`);
      if (!response.ok) throw new Error('다락방 목록을 가져오는 데 실패했습니다.');
      return response.json();
    },
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
    setEditFormData({
      community: user.community || '',
      group_id: user.group_id || '',
      cell_id: user.cell_id || '',
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
    updateUserMutation.mutate({
      userId: selectedUser.user_id,
      data: {
        community: editFormData.community || null,
        group_id: editFormData.group_id || null,
        cell_id: editFormData.cell_id || null,
        status: editFormData.status || null,
      },
    });
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setFilterCommunity('');
    setFilterGroupId('');
    setFilterCellId('');
    setFilterStatus('');
    setSearchQuery('');
    setCurrentPage(1);
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
        <S.SearchBar>
          <S.SearchInput
            type="text"
            placeholder="이름, 이메일로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </S.SearchBar>
      </S.Header>

      {/* 통계 카드 */}
      <S.StatsGrid>
        <S.StatCard>
          <S.StatIcon>👥</S.StatIcon>
          <S.StatContent>
            <S.StatValue>{pagination?.total || 0}</S.StatValue>
            <S.StatLabel>전체 사용자</S.StatLabel>
          </S.StatContent>
        </S.StatCard>
        <S.StatCard>
          <S.StatIcon>🔑</S.StatIcon>
          <S.StatContent>
            <S.StatValue>
              {users?.filter(u => u.roles && u.roles.length > 0).length || 0}
            </S.StatValue>
            <S.StatLabel>현재 페이지 관리자</S.StatLabel>
          </S.StatContent>
        </S.StatCard>
        <S.StatCard>
          <S.StatIcon>📄</S.StatIcon>
          <S.StatContent>
            <S.StatValue>{pagination?.page || 1} / {pagination?.totalPages || 1}</S.StatValue>
            <S.StatLabel>페이지</S.StatLabel>
          </S.StatContent>
        </S.StatCard>
      </S.StatsGrid>

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
            <S.Select
              value={filterCommunity}
              onChange={(e) => {
                setFilterCommunity(e.target.value);
                setFilterGroupId('');
                setFilterCellId('');
                setCurrentPage(1);
              }}
              style={{ width: '120px' }}
            >
              <option value="">전체</option>
              {COMMUNITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </S.Select>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>그룹</FilterLabel>
            <S.Select
              value={filterGroupId}
              onChange={(e) => {
                setFilterGroupId(e.target.value);
                setFilterCellId('');
                setCurrentPage(1);
              }}
              style={{ width: '150px' }}
            >
              <option value="">전체</option>
              {groups?.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </S.Select>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>다락방</FilterLabel>
            <S.Select
              value={filterCellId}
              onChange={(e) => {
                setFilterCellId(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '150px' }}
            >
              <option value="">전체</option>
              {cells?.filter(c => !filterGroupId || c.group_id === parseInt(filterGroupId)).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </S.Select>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>상태</FilterLabel>
            <S.Select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '120px' }}
            >
              <option value="">전체</option>
              <option value="null">일반 사용자</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </S.Select>
          </FilterGroup>

          <ResetButton onClick={handleResetFilters}>
            초기화
          </ResetButton>
        </FilterSection>

        {isLoading ? (
          <S.LoadingState>
            <S.Spinner />
            <p>로딩 중...</p>
          </S.LoadingState>
        ) : users && users.length > 0 ? (
          <>
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
                    <S.Select
                      value={editFormData.community}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        community: e.target.value,
                        group_id: '',
                        cell_id: '',
                      }))}
                    >
                      <option value="">선택하세요</option>
                      {COMMUNITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </S.Select>
                  </S.FormGroup>
                  <S.FormGroup>
                    <S.Label>그룹</S.Label>
                    <S.Select
                      value={editFormData.group_id}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        group_id: e.target.value ? parseInt(e.target.value) : '',
                        cell_id: '',
                      }))}
                    >
                      <option value="">선택하세요</option>
                      {groups?.filter(g => !editFormData.community || g.community === editFormData.community).map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </S.Select>
                  </S.FormGroup>
                  <S.FormGroup>
                    <S.Label>다락방</S.Label>
                    <S.Select
                      value={editFormData.cell_id}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        cell_id: e.target.value ? parseInt(e.target.value) : '',
                      }))}
                    >
                      <option value="">선택하세요</option>
                      {cells?.filter(c => !editFormData.group_id || c.group_id === editFormData.group_id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </S.Select>
                  </S.FormGroup>
                  <S.FormGroup>
                    <S.Label>상태</S.Label>
                    <S.Select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        status: e.target.value,
                      }))}
                    >
                      <option value="">일반 사용자</option>
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </S.Select>
                  </S.FormGroup>
                  <S.FormGroup>
                    <S.Label>가입일</S.Label>
                    <S.Input
                      type="text"
                      value={new Date(selectedUser.created_at).toLocaleDateString('ko-KR')}
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
                    <S.CheckboxGroup>
                      {AVAILABLE_ROLES.map((role) => (
                        <S.CheckboxLabel key={role}>
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role)}
                            onChange={() => handleToggleRole(role)}
                          />
                          {role}
                        </S.CheckboxLabel>
                      ))}
                    </S.CheckboxGroup>
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

const ResetButton = styled.button`
  padding: 10px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
`;
