// 파일 경로: src/views/AdminPage/bible-card/CompletePage.tsx
// 완료 목록 & CSV 추출 & 링크 관리

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { Combobox } from '@src/components/ui/combobox';

interface Application {
  id: number;
  name: string;
  community: string;
  group_name: string;
  cell_name: string;
  prayer_request: string;
  status: string;
  pastor_name: string;
  bible_verse: string;
  bible_verse_reference: string;
  pastor_message: string;
  drive_link_1: string;
  drive_link_2: string;
  completed_at: string;
  links_added_at: string;
}

interface Pastor {
  user_id: string;
  name: string;
  assigned_count: number;
}

export default function BibleCardCompletePage() {
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [pastorFilter, setPastorFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [links, setLinks] = useState({ drive_link_1: '', drive_link_2: '' });

  // 완료된 신청 목록 조회 (completed, delivered 상태만)
  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ['bible-card-completed', statusFilter, pastorFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      
      // 완료 관리 페이지는 completed 또는 delivered 상태만 조회
      // 상태 필터가 있으면 해당 상태만, 없으면 completed와 delivered 모두 조회
      if (statusFilter && statusFilter.trim() !== '') {
        // 특정 상태 필터링 (completed 또는 delivered만 허용)
        const allowedStatuses = ['completed', 'delivered'];
        if (allowedStatuses.includes(statusFilter.trim())) {
          params.append('status', statusFilter.trim());
        }
      } else {
        // 상태 필터가 없으면 completed와 delivered만 조회하기 위해 별도 처리
        // API에서 여러 상태를 필터링할 수 있도록 수정 필요
        params.append('statuses', 'completed,delivered');
      }
      
      if (pastorFilter && pastorFilter.trim() !== '') {
        params.append('pastor_id', pastorFilter.trim());
      }
      
      const response = await fetch(`/api/bible-card/admin/applications?${params}`);
      if (!response.ok) throw new Error('조회 실패');
      return response.json();
    },
  });

  // 목회자 목록 조회
  const { data: pastors } = useQuery<Pastor[]>({
    queryKey: ['bible-card-pastors'],
    queryFn: async () => {
      const response = await fetch('/api/bible-card/admin/pastors');
      if (!response.ok) throw new Error('목회자 조회 실패');
      return response.json();
    },
  });

  // 링크 저장 뮤테이션
  const saveLinksMutation = useMutation({
    mutationFn: async (data: { applicationId: number; drive_link_1: string; drive_link_2: string }) => {
      const response = await fetch('/api/bible-card/admin/links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('링크 저장 실패');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bible-card-completed'] });
      handleCloseModal();
      alert('링크가 저장되었습니다.');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const applications = applicationsData?.data || [];
  const pagination = applicationsData?.pagination;

  const handleOpenModal = (app: Application) => {
    setSelectedApp(app);
    setLinks({
      drive_link_1: app.drive_link_1 || '',
      drive_link_2: app.drive_link_2 || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApp(null);
  };

  const handleSaveLinks = () => {
    if (!selectedApp) return;
    saveLinksMutation.mutate({
      applicationId: selectedApp.id,
      ...links,
    });
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (pastorFilter) params.append('pastor_id', pastorFilter);
    
    window.open(`/api/bible-card/admin/export-csv?${params}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      completed: { bg: '#d1fae5', color: '#065f46', label: '완료' },
      delivered: { bg: '#e0e7ff', color: '#4338ca', label: '전달완료' },
    };
    const style = styles[status] || styles.completed;
    return <StatusBadge bg={style.bg} textColor={style.color}>{style.label}</StatusBadge>;
  };

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <Title>✅ 완료 관리</Title>
          <Subtitle>말씀 작성 완료된 목록 관리 및 CSV 추출</Subtitle>
        </HeaderLeft>
        <ExportButton onClick={handleExportCSV}>
          📥 CSV 다운로드
        </ExportButton>
      </Header>

      {/* 필터 */}
      <FilterSection>
        <FilterGroup>
          <Combobox
            value={statusFilter}
            onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}
            options={[
              { value: '', label: '전체 상태' },
              { value: 'completed', label: '작성 완료' },
              { value: 'delivered', label: '전달 완료' },
            ]}
            placeholder="전체 상태"
          />
        </FilterGroup>
        <FilterGroup>
          <Combobox
            value={pastorFilter}
            onChange={(value) => { setPastorFilter(value); setCurrentPage(1); }}
            options={[
              { value: '', label: '전체 목회자' },
              ...(pastors?.map((pastor) => ({
                value: pastor.user_id,
                label: pastor.name
              })) || []),
            ]}
            placeholder="전체 목회자"
          />
        </FilterGroup>
      </FilterSection>

      {/* 테이블 */}
      {isLoading ? (
        <LoadingState>로딩 중...</LoadingState>
      ) : (
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <Th>신청자</Th>
                <Th>공동체/그룹</Th>
                <Th>담당목회자</Th>
                <Th>말씀</Th>
                <Th>상태</Th>
                <Th>링크</Th>
                <Th>작업</Th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app: Application) => (
                <Tr key={app.id}>
                  <Td><strong>{app.name}</strong></Td>
                  <Td>
                    {app.community && `${app.community} / `}
                    {app.group_name || '-'}
                  </Td>
                  <Td>{app.pastor_name || '-'}</Td>
                  <Td>
                    {app.bible_verse_reference && (
                      <BibleRef>📖 {app.bible_verse_reference}</BibleRef>
                    )}
                  </Td>
                  <Td>{getStatusBadge(app.status)}</Td>
                  <Td>
                    {app.drive_link_1 || app.drive_link_2 ? (
                      <LinkStatus hasLinks>✅ 링크 있음</LinkStatus>
                    ) : (
                      <LinkStatus>❌ 링크 없음</LinkStatus>
                    )}
                  </Td>
                  <Td>
                    <ActionButton onClick={() => handleOpenModal(app)}>
                      상세/링크
                    </ActionButton>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      )}

      {/* 페이지네이션 */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination>
          <PageButton onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>≪</PageButton>
          <PageButton onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>＜</PageButton>
          <PageInfo>{currentPage} / {pagination.totalPages}</PageInfo>
          <PageButton onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages}>＞</PageButton>
          <PageButton onClick={() => setCurrentPage(pagination.totalPages)} disabled={currentPage === pagination.totalPages}>≫</PageButton>
        </Pagination>
      )}

      {/* 상세/링크 모달 */}
      {isModalOpen && selectedApp && (
        <Modal onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{selectedApp.name}님 상세 정보</ModalTitle>
              <CloseButton onClick={handleCloseModal}>×</CloseButton>
            </ModalHeader>

            <Section>
              <SectionTitle>📖 기도제목</SectionTitle>
              <SectionContent>{selectedApp.prayer_request}</SectionContent>
            </Section>

            <Section>
              <SectionTitle>✨ 말씀</SectionTitle>
              <BibleBox>
                <BibleReference>{selectedApp.bible_verse_reference}</BibleReference>
                <BibleText>{selectedApp.bible_verse}</BibleText>
                {selectedApp.pastor_message && (
                  <PastorMessage>{selectedApp.pastor_message}</PastorMessage>
                )}
              </BibleBox>
            </Section>

            <Section>
              <SectionTitle>🔗 구글드라이브 링크</SectionTitle>
              <FormGroup>
                <Label>말씀카드 링크 1</Label>
                <Input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={links.drive_link_1}
                  onChange={(e) => setLinks(prev => ({ ...prev, drive_link_1: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <Label>말씀카드 링크 2</Label>
                <Input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={links.drive_link_2}
                  onChange={(e) => setLinks(prev => ({ ...prev, drive_link_2: e.target.value }))}
                />
              </FormGroup>
              <SaveButton 
                onClick={handleSaveLinks}
                disabled={saveLinksMutation.isPending}
              >
                {saveLinksMutation.isPending ? '저장 중...' : '링크 저장 (전달완료 처리)'}
              </SaveButton>
            </Section>
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
  flex-wrap: wrap;
  gap: 16px;
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

const ExportButton = styled.button`
  padding: 12px 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
`;

const FilterSection = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div``;

const Select = styled.select`
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 150px;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px;
  color: #64748b;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 14px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
`;

const Tr = styled.tr`
  &:hover {
    background: #f8fafc;
  }
`;

const Td = styled.td`
  padding: 14px 16px;
  font-size: 14px;
  color: #334155;
  border-bottom: 1px solid #e2e8f0;
`;

const BibleRef = styled.div`
  font-size: 12px;
  color: #6366f1;
`;

const StatusBadge = styled.span<{ bg: string; textColor: string }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.bg};
  color: ${props => props.textColor};
`;

const LinkStatus = styled.span<{ hasLinks?: boolean }>`
  font-size: 12px;
  color: ${props => props.hasLinks ? '#059669' : '#dc2626'};
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;

  &:hover {
    background: #e2e8f0;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 20px;
`;

const PageButton = styled.button`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  font-size: 14px;
  color: #64748b;
  padding: 0 12px;
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
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
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 12px 0;
`;

const SectionContent = styled.div`
  background: #f8fafc;
  border-radius: 10px;
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
`;

const BibleBox = styled.div`
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 12px;
  padding: 16px;
`;

const BibleReference = styled.div`
  font-size: 14px;
  color: #3b82f6;
  font-weight: 600;
  margin-bottom: 8px;
`;

const BibleText = styled.div`
  font-size: 14px;
  color: #1e3a8a;
  line-height: 1.7;
  white-space: pre-wrap;
`;

const PastorMessage = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(59, 130, 246, 0.3);
  font-size: 13px;
  color: #1e3a8a;
  font-style: italic;
`;

const FormGroup = styled.div`
  margin-bottom: 12px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #6366f1;
  }
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

