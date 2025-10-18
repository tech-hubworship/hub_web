/**
 * 테크팀 문의사항 관리 페이지
 * 
 * 사용자들이 Footer를 통해 제출한 버그 제보 및 문의사항을 관리합니다.
 * - 문의사항 목록 조회
 * - 상태 업데이트 (new, in_progress, resolved, closed)
 * - 관리자 메모 작성
 * - 통계 조회
 * 
 * @author HUB Development Team
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import PageLayout from '@src/components/common/PageLayout';

interface TechInquiry {
  id: number;
  message: string;
  inquiry_type: 'bug' | 'inquiry' | 'suggestion' | 'general';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  page_url: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

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

const INQUIRY_TYPE_LABELS = {
  bug: '버그',
  inquiry: '문의',
  suggestion: '제안',
  general: '일반',
};

const STATUS_LABELS = {
  new: '새 문의',
  in_progress: '처리중',
  resolved: '해결됨',
  closed: '종료',
};

const STATUS_COLORS = {
  new: '#FF6B6B',
  in_progress: '#4ECDC4',
  resolved: '#95E1D3',
  closed: '#CCCCCC',
};

export default function TechInquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<TechInquiry[]>([]);
  const [stats, setStats] = useState<InquiryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<TechInquiry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchInquiries();
    fetchStats();
  }, [selectedStatus]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const url =
        selectedStatus === 'all'
          ? '/api/tech-inquiries?limit=100'
          : `/api/tech-inquiries?limit=100&status=${selectedStatus}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setInquiries(data.data || []);
      }
    } catch (error) {
      console.error('문의사항 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tech-inquiries?stats=true');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('통계 조회 오류:', error);
    }
  };

  const handleInquiryClick = (inquiry: TechInquiry) => {
    setSelectedInquiry(inquiry);
    setAdminNote(inquiry.admin_note || '');
    setNewStatus(inquiry.status);
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedInquiry) return;

    try {
      setUpdating(true);

      const response = await fetch(`/api/tech-inquiries/${selectedInquiry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminNote: adminNote || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('문의사항이 업데이트되었습니다.');
        setIsModalOpen(false);
        fetchInquiries();
        fetchStats();
      } else {
        alert('업데이트 실패: ' + data.error);
      }
    } catch (error) {
      console.error('업데이트 오류:', error);
      alert('업데이트에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/tech-inquiries/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('문의사항이 삭제되었습니다.');
        fetchInquiries();
        fetchStats();
      } else {
        alert('삭제 실패: ' + data.error);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PageLayout>
      <Container>
        <Header>
          <Title>테크팀 문의사항 관리</Title>
          <RefreshButton onClick={() => { fetchInquiries(); fetchStats(); }}>
            새로고침
          </RefreshButton>
        </Header>

        {stats && (
          <StatsContainer>
            <StatCard>
              <StatLabel>전체</StatLabel>
              <StatValue>{stats.total_count}</StatValue>
            </StatCard>
            <StatCard color={STATUS_COLORS.new}>
              <StatLabel>새 문의</StatLabel>
              <StatValue>{stats.new_count}</StatValue>
            </StatCard>
            <StatCard color={STATUS_COLORS.in_progress}>
              <StatLabel>처리중</StatLabel>
              <StatValue>{stats.in_progress_count}</StatValue>
            </StatCard>
            <StatCard color={STATUS_COLORS.resolved}>
              <StatLabel>해결됨</StatLabel>
              <StatValue>{stats.resolved_count}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>버그 제보</StatLabel>
              <StatValue>{stats.bug_count}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>오늘</StatLabel>
              <StatValue>{stats.today_count}</StatValue>
            </StatCard>
          </StatsContainer>
        )}

        <FilterContainer>
          <FilterButton
            active={selectedStatus === 'all'}
            onClick={() => setSelectedStatus('all')}
          >
            전체
          </FilterButton>
          <FilterButton
            active={selectedStatus === 'new'}
            onClick={() => setSelectedStatus('new')}
          >
            새 문의
          </FilterButton>
          <FilterButton
            active={selectedStatus === 'in_progress'}
            onClick={() => setSelectedStatus('in_progress')}
          >
            처리중
          </FilterButton>
          <FilterButton
            active={selectedStatus === 'resolved'}
            onClick={() => setSelectedStatus('resolved')}
          >
            해결됨
          </FilterButton>
          <FilterButton
            active={selectedStatus === 'closed'}
            onClick={() => setSelectedStatus('closed')}
          >
            종료
          </FilterButton>
        </FilterContainer>

        {loading ? (
          <LoadingText>로딩 중...</LoadingText>
        ) : inquiries.length === 0 ? (
          <EmptyText>문의사항이 없습니다.</EmptyText>
        ) : (
          <InquiryList>
            {inquiries.map((inquiry) => (
              <InquiryCard key={inquiry.id} onClick={() => handleInquiryClick(inquiry)}>
                <InquiryHeader>
                  <InquiryId>#{inquiry.id}</InquiryId>
                  <BadgeGroup>
                    <TypeBadge>{INQUIRY_TYPE_LABELS[inquiry.inquiry_type]}</TypeBadge>
                    <StatusBadge color={STATUS_COLORS[inquiry.status]}>
                      {STATUS_LABELS[inquiry.status]}
                    </StatusBadge>
                  </BadgeGroup>
                </InquiryHeader>
                <InquiryMessage>{inquiry.message}</InquiryMessage>
                <InquiryFooter>
                  <InquiryDate>{formatDate(inquiry.created_at)}</InquiryDate>
                  {inquiry.page_url && (
                    <InquiryUrl>페이지: {inquiry.page_url}</InquiryUrl>
                  )}
                </InquiryFooter>
                {inquiry.admin_note && (
                  <AdminNote>
                    <strong>관리자 메모:</strong> {inquiry.admin_note}
                  </AdminNote>
                )}
              </InquiryCard>
            ))}
          </InquiryList>
        )}

        {isModalOpen && selectedInquiry && (
          <ModalOverlay onClick={() => setIsModalOpen(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>문의사항 상세 (#{selectedInquiry.id})</ModalTitle>
                <CloseButton onClick={() => setIsModalOpen(false)}>×</CloseButton>
              </ModalHeader>

              <ModalBody>
                <Field>
                  <Label>메시지</Label>
                  <MessageBox>{selectedInquiry.message}</MessageBox>
                </Field>

                <Field>
                  <Label>유형</Label>
                  <Value>{INQUIRY_TYPE_LABELS[selectedInquiry.inquiry_type]}</Value>
                </Field>

                <Field>
                  <Label>페이지</Label>
                  <Value>{selectedInquiry.page_url || '정보 없음'}</Value>
                </Field>

                <Field>
                  <Label>등록일</Label>
                  <Value>{formatDate(selectedInquiry.created_at)}</Value>
                </Field>

                {selectedInquiry.resolved_at && (
                  <Field>
                    <Label>해결일</Label>
                    <Value>{formatDate(selectedInquiry.resolved_at)}</Value>
                  </Field>
                )}

                <Field>
                  <Label>상태</Label>
                  <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    <option value="new">새 문의</option>
                    <option value="in_progress">처리중</option>
                    <option value="resolved">해결됨</option>
                    <option value="closed">종료</option>
                  </Select>
                </Field>

                <Field>
                  <Label>관리자 메모</Label>
                  <TextArea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="관리자 메모를 입력하세요..."
                  />
                </Field>

                <ButtonGroup>
                  <UpdateButton onClick={handleUpdate} disabled={updating}>
                    {updating ? '업데이트 중...' : '업데이트'}
                  </UpdateButton>
                  <DeleteButton onClick={() => handleDelete(selectedInquiry.id)}>
                    삭제
                  </DeleteButton>
                </ButtonGroup>
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        )}
      </Container>
    </PageLayout>
  );
}

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #333;
`;

const RefreshButton = styled.button`
  padding: 10px 20px;
  background: #4ECDC4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #3DB8AF;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
`;

const StatCard = styled.div<{ color?: string }>`
  padding: 20px;
  background: ${(props) => props.color || '#f8f9fa'};
  border-radius: 12px;
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #333;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ active?: boolean }>`
  padding: 10px 20px;
  background: ${(props) => (props.active ? '#333' : '#fff')};
  color: ${(props) => (props.active ? '#fff' : '#333')};
  border: 1px solid #333;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.active ? '#333' : '#f8f9fa')};
  }
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 60px 20px;
  font-size: 16px;
  color: #666;
`;

const EmptyText = styled.div`
  text-align: center;
  padding: 60px 20px;
  font-size: 16px;
  color: #999;
`;

const InquiryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const InquiryCard = styled.div`
  padding: 20px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #4ECDC4;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const InquiryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const InquiryId = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #666;
`;

const BadgeGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const TypeBadge = styled.span`
  padding: 4px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const StatusBadge = styled.span<{ color: string }>`
  padding: 4px 12px;
  background: ${(props) => props.color};
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const InquiryMessage = styled.div`
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
  white-space: pre-wrap;
`;

const InquiryFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
`;

const InquiryDate = styled.span``;

const InquiryUrl = styled.span`
  color: #4ECDC4;
`;

const AdminNote = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: #fff3cd;
  border-radius: 8px;
  font-size: 13px;
  color: #856404;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 32px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;

  &:hover {
    color: #333;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const Field = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`;

const Value = styled.div`
  font-size: 15px;
  color: #666;
`;

const MessageBox = styled.div`
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  color: #333;

  &:focus {
    outline: none;
    border-color: #4ECDC4;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  color: #333;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #4ECDC4;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 24px;
`;

const UpdateButton = styled.button`
  flex: 1;
  padding: 14px;
  background: #4ECDC4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #3DB8AF;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  padding: 14px 20px;
  background: #FF6B6B;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #FF5252;
  }
`;

