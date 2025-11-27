// 파일 경로: src/views/AdminPage/tech-inquiries/index.tsx

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as S from './style';

// 문의사항 타입 정의
interface TechInquiry {
  id: number;
  message: string;
  inquiry_type: 'bug' | 'inquiry' | 'suggestion' | 'general';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  user_agent?: string;
  user_ip?: string;
  page_url?: string;
  admin_note?: string;
  created_at: string;
  resolved_at?: string;
}

// 통계 타입 정의
interface InquiryStats {
  total_count: number;
  new_count: number;
  in_progress_count: number;
  resolved_count: number;
  bug_count: number;
  suggestion_count: number;
  today_count: number;
  this_week_count: number;
}

// 문의 유형 한글 매핑
const INQUIRY_TYPE_LABELS: Record<string, string> = {
  bug: '버그',
  inquiry: '문의',
  suggestion: '제안',
  general: '일반',
};

// 상태 한글 매핑
const STATUS_LABELS: Record<string, string> = {
  new: '신규',
  in_progress: '처리중',
  resolved: '해결됨',
  closed: '종료',
};

// 상태별 색상 매핑
const STATUS_COLORS: Record<string, 'blue' | 'yellow' | 'green' | 'red'> = {
  new: 'blue',
  in_progress: 'yellow',
  resolved: 'green',
  closed: 'red',
};

export default function TechInquiriesAdminPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<TechInquiry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editType, setEditType] = useState<string>('');
  const [adminNote, setAdminNote] = useState<string>('');

  // 통계 조회
  const { data: stats } = useQuery<InquiryStats>({
    queryKey: ['tech-inquiries-stats'],
    queryFn: async () => {
      const response = await fetch('/api/tech-inquiries?stats=true');
      if (!response.ok) throw new Error('통계 조회에 실패했습니다.');
      const result = await response.json();
      return result.stats;
    },
  });

  // 문의사항 목록 조회
  const { data: inquiries, isLoading } = useQuery<TechInquiry[]>({
    queryKey: ['tech-inquiries', statusFilter],
    queryFn: async () => {
      const response = await fetch(
        `/api/tech-inquiries?status=${statusFilter}&limit=100&offset=0`
      );
      if (!response.ok) throw new Error('문의사항 목록을 가져오는 데 실패했습니다.');
      const result = await response.json();
      return result.data;
    },
  });

  // 문의사항 수정 뮤테이션
  const updateInquiryMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      adminNote,
      inquiryType,
    }: {
      id: number;
      status?: string;
      adminNote?: string;
      inquiryType?: string;
    }) => {
      const response = await fetch(`/api/tech-inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote, inquiryType }),
      });
      if (!response.ok) throw new Error('문의사항 수정에 실패했습니다.');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['tech-inquiries-stats'] });
      setIsModalOpen(false);
      setSelectedInquiry(null);
      alert('문의사항이 수정되었습니다.');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 문의사항 삭제 뮤테이션
  const deleteInquiryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/tech-inquiries/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('문의사항 삭제에 실패했습니다.');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['tech-inquiries-stats'] });
      setIsModalOpen(false);
      setSelectedInquiry(null);
      alert('문의사항이 삭제되었습니다.');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 모달 열기
  const handleOpenModal = (inquiry: TechInquiry) => {
    setSelectedInquiry(inquiry);
    setEditStatus(inquiry.status);
    setEditType(inquiry.inquiry_type);
    setAdminNote(inquiry.admin_note || '');
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInquiry(null);
    setEditStatus('');
    setEditType('');
    setAdminNote('');
  };

  // 문의사항 저장
  const handleSave = () => {
    if (!selectedInquiry) return;
    
    updateInquiryMutation.mutate({
      id: selectedInquiry.id,
      status: editStatus,
      adminNote: adminNote,
      inquiryType: editType,
    });
  };

  // 문의사항 삭제
  const handleDelete = () => {
    if (!selectedInquiry) return;
    
    if (!confirm('정말로 이 문의사항을 삭제하시겠습니까?')) {
      return;
    }
    
    deleteInquiryMutation.mutate(selectedInquiry.id);
  };

  return (
    <>
      {/* 헤더 섹션 */}
      <S.Header>
        <S.HeaderLeft>
          <S.Title>💬 문의사항 관리</S.Title>
          <S.Subtitle>사용자 문의 및 버그 리포트를 관리합니다</S.Subtitle>
        </S.HeaderLeft>
        <S.FilterBar>
          <S.FilterButton
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          >
            전체
          </S.FilterButton>
          <S.FilterButton
            active={statusFilter === 'new'}
            onClick={() => setStatusFilter('new')}
          >
            신규
          </S.FilterButton>
          <S.FilterButton
            active={statusFilter === 'in_progress'}
            onClick={() => setStatusFilter('in_progress')}
          >
            처리중
          </S.FilterButton>
          <S.FilterButton
            active={statusFilter === 'resolved'}
            onClick={() => setStatusFilter('resolved')}
          >
            해결됨
          </S.FilterButton>
        </S.FilterBar>
      </S.Header>

      {/* 통계 카드 */}
      <S.StatsGrid>
        <S.StatCard>
          <S.StatIcon>📊</S.StatIcon>
          <S.StatContent>
            <S.StatValue>{stats?.total_count || 0}</S.StatValue>
            <S.StatLabel>전체 문의</S.StatLabel>
          </S.StatContent>
        </S.StatCard>
        <S.StatCard>
          <S.StatIcon>🆕</S.StatIcon>
          <S.StatContent>
            <S.StatValue>{stats?.new_count || 0}</S.StatValue>
            <S.StatLabel>신규 문의</S.StatLabel>
          </S.StatContent>
        </S.StatCard>
        <S.StatCard>
          <S.StatIcon>⚙️</S.StatIcon>
          <S.StatContent>
            <S.StatValue>{stats?.in_progress_count || 0}</S.StatValue>
            <S.StatLabel>처리중</S.StatLabel>
          </S.StatContent>
        </S.StatCard>
        <S.StatCard>
          <S.StatIcon>✅</S.StatIcon>
          <S.StatContent>
            <S.StatValue>{stats?.resolved_count || 0}</S.StatValue>
            <S.StatLabel>해결됨</S.StatLabel>
          </S.StatContent>
        </S.StatCard>
        <S.StatCard>
          <S.StatIcon>🐛</S.StatIcon>
          <S.StatContent>
            <S.StatValue>{stats?.bug_count || 0}</S.StatValue>
            <S.StatLabel>버그</S.StatLabel>
          </S.StatContent>
        </S.StatCard>
        <S.StatCard>
          <S.StatIcon>💡</S.StatIcon>
          <S.StatContent>
            <S.StatValue>{stats?.suggestion_count || 0}</S.StatValue>
            <S.StatLabel>제안</S.StatLabel>
          </S.StatContent>
        </S.StatCard>
        <S.StatCard>
          <S.StatIcon>📅</S.StatIcon>
          <S.StatContent>
            <S.StatValue>{stats?.today_count || 0}</S.StatValue>
            <S.StatLabel>오늘</S.StatLabel>
          </S.StatContent>
        </S.StatCard>
        <S.StatCard>
          <S.StatIcon>📆</S.StatIcon>
          <S.StatContent>
            <S.StatValue>{stats?.this_week_count || 0}</S.StatValue>
            <S.StatLabel>이번 주</S.StatLabel>
          </S.StatContent>
        </S.StatCard>
      </S.StatsGrid>

      <S.Container>
        {isLoading ? (
          <S.LoadingState>
            <S.Spinner />
            <p>로딩 중...</p>
          </S.LoadingState>
        ) : inquiries && inquiries.length > 0 ? (
          <S.TableContainer>
            <S.Table>
              <S.TableHeader>
                <S.TableRow>
                  <S.TableHead>ID</S.TableHead>
                  <S.TableHead>유형</S.TableHead>
                  <S.TableHead>메시지</S.TableHead>
                  <S.TableHead>상태</S.TableHead>
                  <S.TableHead>등록일</S.TableHead>
                  <S.TableHead>작업</S.TableHead>
                </S.TableRow>
              </S.TableHeader>
              <tbody>
                {inquiries.map((inquiry) => (
                  <S.TableRow key={inquiry.id}>
                    <S.TableData>{inquiry.id}</S.TableData>
                    <S.TableData>
                      <S.Badge color="purple">
                        {INQUIRY_TYPE_LABELS[inquiry.inquiry_type]}
                      </S.Badge>
                    </S.TableData>
                    <S.TableData
                      style={{
                        maxWidth: '400px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {inquiry.message}
                    </S.TableData>
                    <S.TableData>
                      <S.Badge color={STATUS_COLORS[inquiry.status]}>
                        {STATUS_LABELS[inquiry.status]}
                      </S.Badge>
                    </S.TableData>
                    <S.TableData>
                      {new Date(inquiry.created_at).toLocaleDateString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </S.TableData>
                    <S.TableData>
                      <S.ActionButton onClick={() => handleOpenModal(inquiry)}>
                        상세보기
                      </S.ActionButton>
                    </S.TableData>
                  </S.TableRow>
                ))}
              </tbody>
            </S.Table>
          </S.TableContainer>
        ) : (
          <S.EmptyState>
            <S.EmptyIcon>💬</S.EmptyIcon>
            <S.EmptyText>
              {statusFilter === 'all'
                ? '등록된 문의사항이 없습니다.'
                : `${STATUS_LABELS[statusFilter]} 상태의 문의사항이 없습니다.`}
            </S.EmptyText>
          </S.EmptyState>
        )}

        {/* 문의사항 상세 모달 */}
        {isModalOpen && selectedInquiry && (
          <S.Modal onClick={handleCloseModal}>
            <S.ModalContent onClick={(e) => e.stopPropagation()}>
              <S.ModalHeader>
                <S.ModalTitle>문의사항 상세 #{selectedInquiry.id}</S.ModalTitle>
                <S.CloseButton onClick={handleCloseModal}>×</S.CloseButton>
              </S.ModalHeader>

              <S.FormGroup>
                <S.Label>문의 내용</S.Label>
                <S.MessageBox>{selectedInquiry.message}</S.MessageBox>
              </S.FormGroup>

              <S.FormGroup>
                <S.Label>문의 유형</S.Label>
                <S.Select value={editType} onChange={(e) => setEditType(e.target.value)}>
                  <option value="general">일반</option>
                  <option value="bug">버그</option>
                  <option value="inquiry">문의</option>
                  <option value="suggestion">제안</option>
                </S.Select>
              </S.FormGroup>

              <S.FormGroup>
                <S.Label>처리 상태</S.Label>
                <S.Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="new">신규</option>
                  <option value="in_progress">처리중</option>
                  <option value="resolved">해결됨</option>
                  <option value="closed">종료</option>
                </S.Select>
              </S.FormGroup>

              <S.FormGroup>
                <S.Label>관리자 메모</S.Label>
                <S.TextArea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="관리자 메모를 입력하세요..."
                />
              </S.FormGroup>

              <S.FormGroup>
                <S.Label>추가 정보</S.Label>
                <div>
                  <S.InfoRow>
                    <S.InfoLabel>등록일:</S.InfoLabel>
                    <S.InfoValue>
                      {new Date(selectedInquiry.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                    </S.InfoValue>
                  </S.InfoRow>
                  {selectedInquiry.resolved_at && (
                    <S.InfoRow>
                      <S.InfoLabel>해결일:</S.InfoLabel>
                      <S.InfoValue>
                        {new Date(selectedInquiry.resolved_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                      </S.InfoValue>
                    </S.InfoRow>
                  )}
                  {selectedInquiry.page_url && (
                    <S.InfoRow>
                      <S.InfoLabel>페이지 URL:</S.InfoLabel>
                      <S.InfoValue>{selectedInquiry.page_url}</S.InfoValue>
                    </S.InfoRow>
                  )}
                  {selectedInquiry.user_ip && (
                    <S.InfoRow>
                      <S.InfoLabel>IP:</S.InfoLabel>
                      <S.InfoValue>{selectedInquiry.user_ip}</S.InfoValue>
                    </S.InfoRow>
                  )}
                  {selectedInquiry.user_agent && (
                    <S.InfoRow>
                      <S.InfoLabel>User Agent:</S.InfoLabel>
                      <S.InfoValue
                        style={{
                          maxWidth: '400px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {selectedInquiry.user_agent}
                      </S.InfoValue>
                    </S.InfoRow>
                  )}
                </div>
              </S.FormGroup>

              <S.ButtonGroup>
                <S.Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleteInquiryMutation.isPending}
                >
                  {deleteInquiryMutation.isPending ? '삭제 중...' : '삭제'}
                </S.Button>
                <S.Button variant="secondary" onClick={handleCloseModal}>
                  취소
                </S.Button>
                <S.Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={updateInquiryMutation.isPending}
                >
                  {updateInquiryMutation.isPending ? '저장 중...' : '저장'}
                </S.Button>
              </S.ButtonGroup>
            </S.ModalContent>
          </S.Modal>
        )}
      </S.Container>
    </>
  );
}

