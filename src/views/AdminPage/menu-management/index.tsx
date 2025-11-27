// 파일 경로: src/views/AdminPage/menu-management/index.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';

// 메뉴 타입 정의
interface AdminMenu {
  id: number;
  menu_id: string;
  title: string;
  icon: string;
  path: string;
  parent_id: number | null;
  order_index: number;
  is_active: boolean;
  description: string;
  roles: string[];
  parent?: { menu_id: string; title: string };
}

interface Role {
  id: number;
  name: string;
}

export default function MenuManagementPage() {
  const queryClient = useQueryClient();
  const [selectedMenu, setSelectedMenu] = useState<AdminMenu | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formData, setFormData] = useState({
    menu_id: '',
    title: '',
    icon: '',
    path: '',
    parent_id: null as number | null,
    order_index: 0,
    description: '',
    is_active: true,
    roles: [] as string[],
  });

  // 메뉴 목록 조회
  const { data: menus, isLoading } = useQuery<AdminMenu[]>({
    queryKey: ['admin-menus'],
    queryFn: async () => {
      const response = await fetch('/api/admin/menus');
      if (!response.ok) throw new Error('메뉴 목록을 가져오는 데 실패했습니다.');
      return response.json();
    },
  });

  // 역할 목록 조회
  const { data: roles } = useQuery<Role[]>({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const response = await fetch('/api/admin/menus/roles');
      if (!response.ok) throw new Error('역할 목록을 가져오는 데 실패했습니다.');
      return response.json();
    },
  });

  // 메뉴 수정 뮤테이션
  const updateMenuMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<AdminMenu> & { roles?: string[] } }) => {
      const response = await fetch(`/api/admin/menus/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error('메뉴 수정에 실패했습니다.');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menus'] });
      handleCloseModal();
      alert('메뉴가 수정되었습니다.');
    },
    onError: (error: Error) => alert(error.message),
  });

  // 메뉴 생성 뮤테이션
  const createMenuMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/admin/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('메뉴 생성에 실패했습니다.');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menus'] });
      handleCloseModal();
      alert('메뉴가 생성되었습니다.');
    },
    onError: (error: Error) => alert(error.message),
  });

  // 메뉴 삭제 뮤테이션
  const deleteMenuMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/menus/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '메뉴 삭제에 실패했습니다.');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menus'] });
      alert('메뉴가 삭제되었습니다.');
    },
    onError: (error: Error) => alert(error.message),
  });

  const handleOpenModal = (menu?: AdminMenu) => {
    if (menu) {
      setSelectedMenu(menu);
      setFormData({
        menu_id: menu.menu_id,
        title: menu.title,
        icon: menu.icon || '',
        path: menu.path,
        parent_id: menu.parent_id,
        order_index: menu.order_index,
        description: menu.description || '',
        is_active: menu.is_active,
        roles: menu.roles || [],
      });
      setIsCreateMode(false);
    } else {
      setSelectedMenu(null);
      setFormData({
        menu_id: '',
        title: '',
        icon: '',
        path: '/admin/',
        parent_id: null,
        order_index: 0,
        description: '',
        is_active: true,
        roles: [],
      });
      setIsCreateMode(true);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMenu(null);
  };

  const handleToggleRole = (roleName: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleName)
        ? prev.roles.filter(r => r !== roleName)
        : [...prev.roles, roleName],
    }));
  };

  const handleSubmit = () => {
    if (isCreateMode) {
      createMenuMutation.mutate(formData);
    } else if (selectedMenu) {
      updateMenuMutation.mutate({
        id: selectedMenu.id,
        updates: formData,
      });
    }
  };

  const handleDelete = (menu: AdminMenu) => {
    if (confirm(`"${menu.title}" 메뉴를 삭제하시겠습니까?`)) {
      deleteMenuMutation.mutate(menu.id);
    }
  };

  // 부모 메뉴 목록 (자신 제외)
  const parentMenuOptions = menus?.filter(m => !m.parent_id && m.id !== selectedMenu?.id) || [];

  // 메뉴를 계층 구조로 정렬
  const sortedMenus = menus?.reduce((acc: AdminMenu[], menu) => {
    if (!menu.parent_id) {
      acc.push(menu);
      const children = menus.filter(m => m.parent_id === menu.id);
      acc.push(...children);
    }
    return acc;
  }, []);

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <Title>⚙️ 메뉴 관리</Title>
          <Subtitle>관리자 메뉴와 권한을 설정합니다</Subtitle>
        </HeaderLeft>
        <AddButton onClick={() => handleOpenModal()}>
          + 새 메뉴 추가
        </AddButton>
      </Header>

      {isLoading ? (
        <LoadingState>로딩 중...</LoadingState>
      ) : sortedMenus && sortedMenus.length > 0 ? (
        <TableContainer>
          <Table>
            <thead>
              <TableRow>
                <TableHead>메뉴</TableHead>
                <TableHead>경로</TableHead>
                <TableHead>권한</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>순서</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </thead>
            <tbody>
              {sortedMenus.map((menu) => (
                <TableRow key={menu.id}>
                  <TableData>
                    <MenuInfo isChild={!!menu.parent_id}>
                      <MenuIcon>{menu.icon}</MenuIcon>
                      <MenuDetails>
                        <MenuTitle>{menu.title}</MenuTitle>
                        <MenuId>{menu.menu_id}</MenuId>
                      </MenuDetails>
                    </MenuInfo>
                  </TableData>
                  <TableData>
                    <PathText>{menu.path}</PathText>
                  </TableData>
                  <TableData>
                    {menu.roles && menu.roles.length > 0 ? (
                      <RoleBadges>
                        {menu.roles.map(role => (
                          <Badge key={role}>{role}</Badge>
                        ))}
                      </RoleBadges>
                    ) : (
                      <Badge color="gray">전체</Badge>
                    )}
                  </TableData>
                  <TableData>
                    <StatusBadge active={menu.is_active}>
                      {menu.is_active ? '활성' : '비활성'}
                    </StatusBadge>
                  </TableData>
                  <TableData>{menu.order_index}</TableData>
                  <TableData>
                    <ActionButtons>
                      <ActionButton onClick={() => handleOpenModal(menu)}>
                        수정
                      </ActionButton>
                      <ActionButton 
                        danger 
                        onClick={() => handleDelete(menu)}
                        disabled={deleteMenuMutation.isPending}
                      >
                        삭제
                      </ActionButton>
                    </ActionButtons>
                  </TableData>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState>등록된 메뉴가 없습니다.</EmptyState>
      )}

      {/* 메뉴 수정/생성 모달 */}
      {isModalOpen && (
        <Modal onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{isCreateMode ? '새 메뉴 추가' : '메뉴 수정'}</ModalTitle>
              <CloseButton onClick={handleCloseModal}>×</CloseButton>
            </ModalHeader>

            <FormGroup>
              <Label>메뉴 ID *</Label>
              <Input
                type="text"
                value={formData.menu_id}
                onChange={(e) => setFormData(prev => ({ ...prev, menu_id: e.target.value }))}
                placeholder="예: new-menu"
                disabled={!isCreateMode}
              />
            </FormGroup>

            <FormGroup>
              <Label>메뉴 이름 *</Label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="예: 새 메뉴"
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>아이콘 (이모지)</Label>
                <Input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🔧"
                  style={{ width: '80px' }}
                />
              </FormGroup>
              <FormGroup>
                <Label>순서</Label>
                <Input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                  style={{ width: '80px' }}
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>경로 *</Label>
              <Input
                type="text"
                value={formData.path}
                onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))}
                placeholder="/admin/new-menu"
              />
            </FormGroup>

            <FormGroup>
              <Label>상위 메뉴</Label>
              <Select
                value={formData.parent_id || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  parent_id: e.target.value ? parseInt(e.target.value) : null 
                }))}
              >
                <option value="">없음 (최상위 메뉴)</option>
                {parentMenuOptions.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.icon} {menu.title}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>설명</Label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="메뉴에 대한 설명"
              />
            </FormGroup>

            <FormGroup>
              <Label>접근 권한</Label>
              <RoleCheckboxGroup>
                {roles?.map((role) => (
                  <RoleCheckbox key={role.id}>
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(role.name)}
                      onChange={() => handleToggleRole(role.name)}
                    />
                    <span>{role.name}</span>
                  </RoleCheckbox>
                ))}
              </RoleCheckboxGroup>
              <HelpText>선택하지 않으면 모든 관리자가 접근할 수 있습니다</HelpText>
            </FormGroup>

            <FormGroup>
              <RoleCheckbox>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <span>활성화</span>
              </RoleCheckbox>
            </FormGroup>

            <ButtonGroup>
              <Button variant="secondary" onClick={handleCloseModal}>
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={updateMenuMutation.isPending || createMenuMutation.isPending}
              >
                {updateMenuMutation.isPending || createMenuMutation.isPending ? '저장 중...' : '저장'}
              </Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  padding: 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
`;

const HeaderLeft = styled.div``;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
`;

const AddButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px;
  color: #64748b;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px;
  color: #64748b;
  background: #f8fafc;
  border-radius: 12px;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f8fafc;
  }
`;

const TableHead = styled.th`
  padding: 14px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  background: #f8fafc;
`;

const TableData = styled.td`
  padding: 14px 16px;
  font-size: 14px;
  color: #334155;
`;

const MenuInfo = styled.div<{ isChild?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: ${props => props.isChild ? '24px' : '0'};
`;

const MenuIcon = styled.span`
  font-size: 20px;
`;

const MenuDetails = styled.div``;

const MenuTitle = styled.div`
  font-weight: 600;
  color: #1e293b;
`;

const MenuId = styled.div`
  font-size: 12px;
  color: #94a3b8;
`;

const PathText = styled.code`
  font-size: 12px;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  color: #475569;
`;

const RoleBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const Badge = styled.span<{ color?: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: ${props => props.color === 'gray' ? '#e2e8f0' : '#ddd6fe'};
  color: ${props => props.color === 'gray' ? '#64748b' : '#7c3aed'};
`;

const StatusBadge = styled.span<{ active: boolean }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.active ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.active ? '#16a34a' : '#dc2626'};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${props => props.danger ? '#fecaca' : '#e2e8f0'};
  background: ${props => props.danger ? '#fef2f2' : 'white'};
  color: ${props => props.danger ? '#dc2626' : '#475569'};
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.danger ? '#fee2e2' : '#f8fafc'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #e2e8f0;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &:disabled {
    background: #f8fafc;
    color: #94a3b8;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;
  background: white;

  &:focus {
    outline: none;
    border-color: #6366f1;
  }
`;

const RoleCheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
`;

const RoleCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #475569;
  cursor: pointer;

  input {
    width: 16px;
    height: 16px;
    accent-color: #6366f1;
  }
`;

const HelpText = styled.p`
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
`;

const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border: none;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
  ` : `
    background: white;
    color: #475569;
    border: 1px solid #e2e8f0;

    &:hover:not(:disabled) {
      background: #f8fafc;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

