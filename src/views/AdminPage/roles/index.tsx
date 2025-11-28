// 파일 경로: src/views/AdminPage/roles/index.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as S from '../users/style';

interface Role {
  id: number;
  name: string;
  description: string | null;
}

export default function RolesAdminPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // 권한 목록 조회
  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const response = await fetch('/api/admin/roles');
      if (!response.ok) throw new Error('권한 목록을 가져오는 데 실패했습니다.');
      return response.json();
    },
  });

  // 권한 생성/수정 뮤테이션
  const saveRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description: string | null }) => {
      const url = editingRole 
        ? `/api/admin/roles/${editingRole.id}`
        : '/api/admin/roles';
      const method = editingRole ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '권한 저장에 실패했습니다.');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setIsModalOpen(false);
      setEditingRole(null);
      setFormData({ name: '', description: '' });
      alert(editingRole ? '권한이 수정되었습니다.' : '권한이 생성되었습니다.');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 권한 삭제 뮤테이션
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/roles/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '권한 삭제에 실패했습니다.');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      alert('권한이 삭제되었습니다.');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 모달 열기 (새 권한)
  const handleAdd = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  // 모달 열기 (수정)
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
    });
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setFormData({ name: '', description: '' });
  };

  // 저장
  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('권한 이름을 입력해주세요.');
      return;
    }

    saveRoleMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
    });
  };

  // 삭제
  const handleDelete = (role: Role) => {
    if (!confirm(`"${role.name}" 권한을 삭제하시겠습니까?\n이 권한을 사용하는 사용자가 있으면 삭제할 수 없습니다.`)) {
      return;
    }

    deleteRoleMutation.mutate(role.id);
  };

  if (isLoading) {
    return (
      <S.LoadingState>
        <S.Spinner />
        <p>로딩 중...</p>
      </S.LoadingState>
    );
  }

  return (
    <>
      {/* 헤더 섹션 */}
      <S.Header>
        <S.HeaderLeft>
          <S.Title>🔐 권한 관리</S.Title>
          <S.Subtitle>시스템 권한(역할)을 관리합니다</S.Subtitle>
        </S.HeaderLeft>
        <S.Button variant="primary" onClick={handleAdd}>
          + 권한 추가
        </S.Button>
      </S.Header>

      {/* 권한 목록 */}
      {roles && roles.length > 0 ? (
        <S.TableContainer>
          <S.Table>
            <S.TableHeader>
              <S.TableRow>
                <S.TableHead style={{ width: '80px' }}>ID</S.TableHead>
                <S.TableHead>권한 이름</S.TableHead>
                <S.TableHead>설명</S.TableHead>
                <S.TableHead style={{ width: '200px' }}>작업</S.TableHead>
              </S.TableRow>
            </S.TableHeader>
            <tbody>
              {roles.map((role) => (
                <S.TableRow key={role.id}>
                  <S.TableData>{role.id}</S.TableData>
                  <S.TableData>
                    <strong>{role.name}</strong>
                  </S.TableData>
                  <S.TableData>
                    {role.description || <span style={{ color: '#9ca3af' }}>-</span>}
                  </S.TableData>
                  <S.TableData>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <S.ActionButton onClick={() => handleEdit(role)}>
                        수정
                      </S.ActionButton>
                      <S.ActionButton 
                        onClick={() => handleDelete(role)}
                        style={{ color: '#ef4444', borderColor: '#fee2e2' }}
                      >
                        삭제
                      </S.ActionButton>
                    </div>
                  </S.TableData>
                </S.TableRow>
              ))}
            </tbody>
          </S.Table>
        </S.TableContainer>
      ) : (
        <S.EmptyState>
          <S.EmptyIcon>🔐</S.EmptyIcon>
          <S.EmptyText>등록된 권한이 없습니다.</S.EmptyText>
        </S.EmptyState>
      )}

      {/* 권한 추가/수정 모달 */}
      {isModalOpen && (
        <S.Modal onClick={handleCloseModal}>
          <S.ModalContent onClick={(e) => e.stopPropagation()}>
            <S.ModalHeader>
              <S.ModalTitle>
                {editingRole ? '권한 수정' : '권한 추가'}
              </S.ModalTitle>
              <S.CloseButton onClick={handleCloseModal}>×</S.CloseButton>
            </S.ModalHeader>

            <S.FormGroup>
              <S.Label>권한 이름 *</S.Label>
              <S.Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="예: MC, 목회자, 그룹장"
                maxLength={50}
              />
            </S.FormGroup>

            <S.FormGroup>
              <S.Label>설명</S.Label>
              <S.TextArea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="권한에 대한 설명을 입력하세요"
                rows={4}
                maxLength={500}
              />
            </S.FormGroup>

            <S.ButtonGroup>
              <S.Button variant="secondary" onClick={handleCloseModal}>
                취소
              </S.Button>
              <S.Button
                variant="primary"
                onClick={handleSave}
                disabled={saveRoleMutation.isPending}
              >
                {saveRoleMutation.isPending ? '저장 중...' : '저장'}
              </S.Button>
            </S.ButtonGroup>
          </S.ModalContent>
        </S.Modal>
      )}
    </>
  );
}

