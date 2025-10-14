// 파일 경로: src/views/AdminPage/users/index.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as S from './style';
import * as AdminS from '@src/views/AdminPage/style';

// 사용자 타입 정의
interface User {
  user_id: string;
  email: string;
  name: string;
  birth_date?: string;
  community?: string;
  group_name?: string;
  cell_name?: string;
  status?: string;
  created_at: string;
  roles?: string[];
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

export default function UsersAdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'accounts' | 'permissions'>('accounts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // 사용자 목록 조회
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['admin-users', searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('사용자 목록을 가져오는 데 실패했습니다.');
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
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
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
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setSelectedRoles([]);
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

  // 필터링된 사용자 목록
  const filteredUsers = users;

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
            <S.StatValue>{users?.length || 0}</S.StatValue>
            <S.StatLabel>전체 사용자</S.StatLabel>
          </S.StatContent>
        </S.StatCard>
        <S.StatCard>
          <S.StatIcon>🔑</S.StatIcon>
          <S.StatContent>
            <S.StatValue>
              {users?.filter(u => u.roles && u.roles.length > 0).length || 0}
            </S.StatValue>
            <S.StatLabel>관리자</S.StatLabel>
          </S.StatContent>
        </S.StatCard>
        <S.StatCard>
          <S.StatIcon>👤</S.StatIcon>
          <S.StatContent>
            <S.StatValue>
              {users?.filter(u => !u.roles || u.roles.length === 0).length || 0}
            </S.StatValue>
            <S.StatLabel>일반 사용자</S.StatLabel>
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

      {isLoading ? (
        <S.LoadingState>
          <S.Spinner />
          <p>로딩 중...</p>
        </S.LoadingState>
      ) : filteredUsers && filteredUsers.length > 0 ? (
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
              {filteredUsers.map((user) => (
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
                        ? '상세보기' 
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
                  ? '사용자 정보' 
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
                  <S.Input type="text" value={selectedUser.community || '-'} disabled />
                </S.FormGroup>
                <S.FormGroup>
                  <S.Label>그룹</S.Label>
                  <S.Input type="text" value={selectedUser.group_name || '-'} disabled />
                </S.FormGroup>
                <S.FormGroup>
                  <S.Label>다락방</S.Label>
                  <S.Input type="text" value={selectedUser.cell_name || '-'} disabled />
                </S.FormGroup>
                <S.FormGroup>
                  <S.Label>상태</S.Label>
                  <S.Badge color={selectedUser.status === '관리자' ? 'blue' : 'green'}>
                    {selectedUser.status || '일반 사용자'}
                  </S.Badge>
                </S.FormGroup>
                <S.FormGroup>
                  <S.Label>가입일</S.Label>
                  <S.Input
                    type="text"
                    value={new Date(selectedUser.created_at).toLocaleDateString('ko-KR')}
                    disabled
                  />
                </S.FormGroup>
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

            {activeTab === 'accounts' && (
              <S.ButtonGroup>
                <S.Button variant="secondary" onClick={handleCloseModal}>
                  닫기
                </S.Button>
              </S.ButtonGroup>
            )}
          </S.ModalContent>
        </S.Modal>
      )}
      </S.Container>
    </>
  );
}

