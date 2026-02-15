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
  const [nameSearchQuery, setNameSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [links, setLinks] = useState({ drive_link_1: '', drive_link_2: '' });
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelPreview, setExcelPreview] = useState<any[] | null>(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  // 배정됨 현황 (배정됨 수, 배정됨+말씀입력 수)
  const { data: assignedStats } = useQuery<{ assignedCount: number; assignedWithVerseCount: number }>({
    queryKey: ['bible-card-assigned-stats'],
    queryFn: async () => {
      const response = await fetch('/api/bible-card/admin/assigned-stats');
      if (!response.ok) throw new Error('현황 조회 실패');
      return response.json();
    },
  });

  // 완료된 신청 목록 조회 (completed, delivered 상태만)
  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ['bible-card-completed', statusFilter, pastorFilter, nameSearchQuery, currentPage],
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
      
      if (nameSearchQuery && nameSearchQuery.trim() !== '') {
        params.append('search', nameSearchQuery.trim());
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
    params.append('status', 'completed'); // 작성완료 상태만 다운로드
    if (pastorFilter) params.append('pastor_id', pastorFilter);
    if (nameSearchQuery && nameSearchQuery.trim() !== '') {
      params.append('search', nameSearchQuery.trim());
    }
    
    window.open(`/api/bible-card/admin/export-csv?${params}`, '_blank');
  };

  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setExcelPreview(null);

    try {
      setUploadingExcel(true);
      
      // 파일을 ArrayBuffer로 읽기
      const arrayBuffer = await file.arrayBuffer();
      
      // ArrayBuffer를 Base64로 변환
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      const fileData = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

      const response = await fetch('/api/bible-card/admin/upload-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData,
          fileName: file.name,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || '엑셀 파일 파싱에 실패했습니다.');
        if (data.errors && Array.isArray(data.errors)) {
          alert(data.errors.join('\n'));
        }
        if (data.notFoundIds && Array.isArray(data.notFoundIds)) {
          alert(`존재하지 않는 ID: ${data.notFoundIds.join(', ')}`);
        }
        setExcelFile(null);
        return;
      }

      setExcelPreview(data.preview);
    } catch (error) {
      console.error('Excel upload error:', error);
      alert('엑셀 파일 업로드 중 오류가 발생했습니다.');
      setExcelFile(null);
    } finally {
      setUploadingExcel(false);
    }
  };

  // 일괄 작성완료 뮤테이션
  const bulkCompleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/bible-card/admin/bulk-complete', {
        method: 'PUT',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '일괄 처리 실패');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bible-card-completed'] });
      queryClient.invalidateQueries({ queryKey: ['bible-card-assigned-stats'] });
      alert(data.message);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const updateLinksMutation = useMutation({
    mutationFn: async (data: { id: number; drive_link: string }[]) => {
      const response = await fetch('/api/bible-card/admin/update-links-from-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '링크 업데이트 실패');
      }
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bible-card-completed'] });
      setIsExcelModalOpen(false);
      setExcelFile(null);
      setExcelPreview(null);
      alert(`성공: ${result.successCount}건, 실패: ${result.failureCount}건`);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const handleConfirmExcelUpload = () => {
    if (!excelPreview || excelPreview.length === 0) {
      alert('업데이트할 데이터가 없습니다.');
      return;
    }

    const updateData = excelPreview.map((item: any) => ({
      id: item.id,
      drive_link: item.new_link,
    }));

    if (!confirm(`${updateData.length}개의 링크를 업데이트하시겠습니까?`)) {
      return;
    }

    updateLinksMutation.mutate(updateData);
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
        <HeaderRight>
          <ExcelUploadButton onClick={() => setIsExcelModalOpen(true)}>
            📤 엑셀 업로드
          </ExcelUploadButton>
          <ExportButton onClick={handleExportCSV}>
            📥 CSV 다운로드
          </ExportButton>
        </HeaderRight>
      </Header>

      {/* 배정됨 현황 & 일괄 작성완료 */}
      <StatsSection>
        <StatsGrid>
          <StatCard>
            <StatIcon>✍️</StatIcon>
            <StatContent>
              <StatValue>{assignedStats?.assignedCount ?? 0}</StatValue>
              <StatLabel>배정됨</StatLabel>
            </StatContent>
          </StatCard>
          <StatCard>
            <StatIcon>📖</StatIcon>
            <StatContent>
              <StatValue>{assignedStats?.assignedWithVerseCount ?? 0}</StatValue>
              <StatLabel>배정됨 + 말씀 입력됨</StatLabel>
            </StatContent>
          </StatCard>
        </StatsGrid>
        {(assignedStats?.assignedWithVerseCount ?? 0) > 0 && (
          <BulkCompleteButton
            onClick={() => {
              if (confirm(`${assignedStats?.assignedWithVerseCount}명의 말씀 입력 완료분을 작성완료 상태로 변경하시겠습니까?`)) {
                bulkCompleteMutation.mutate();
              }
            }}
            disabled={bulkCompleteMutation.isPending}
          >
            {bulkCompleteMutation.isPending ? '처리 중...' : '✅ 일괄 작성완료'}
          </BulkCompleteButton>
        )}
      </StatsSection>

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
        <SearchFilterGroup>
          <SearchInputWrapper>
            <FilterLabel>이름 검색</FilterLabel>
            <SearchInput
              type="text"
              placeholder="이름으로 검색..."
              value={nameSearchQuery}
              onChange={(e) => setNameSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setCurrentPage(1);
                }
              }}
            />
          </SearchInputWrapper>
          <SearchButton onClick={() => setCurrentPage(1)} disabled={isLoading}>
            {isLoading ? '조회 중...' : '🔍 조회'}
          </SearchButton>
        </SearchFilterGroup>
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

      {/* 엑셀 업로드 모달 */}
      {isExcelModalOpen && (
        <Modal onClick={() => setIsExcelModalOpen(false)}>
          <ExcelModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>📤 엑셀 파일 업로드</ModalTitle>
              <CloseButton onClick={() => setIsExcelModalOpen(false)}>×</CloseButton>
            </ModalHeader>

            <ExcelSection>
              <ExcelInfo>
                엑셀 파일 형식: "말씀카드 신청 ID", "구글 드라이브 링크" 컬럼이 필요합니다.
              </ExcelInfo>
              
              <FileInputWrapper>
                <FileInput
                  id="excel-file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelFileChange}
                  disabled={uploadingExcel}
                />
                <FileInputLabel htmlFor="excel-file-input">
                  {excelFile ? excelFile.name : '엑셀 파일 선택 (.xlsx, .xls)'}
                </FileInputLabel>
              </FileInputWrapper>

              {uploadingExcel && (
                <LoadingText>엑셀 파일을 읽는 중...</LoadingText>
              )}

              {excelPreview && excelPreview.length > 0 && (
                <>
                  <PreviewTitle>미리보기 ({excelPreview.length}건)</PreviewTitle>
                  <PreviewTableContainer>
                    <PreviewTable>
                      <thead>
                        <tr>
                          <PreviewTh>ID</PreviewTh>
                          <PreviewTh>이름</PreviewTh>
                          <PreviewTh>현재 링크</PreviewTh>
                          <PreviewTh>새 링크</PreviewTh>
                        </tr>
                      </thead>
                      <tbody>
                        {excelPreview.map((item: any, index: number) => (
                          <tr key={index}>
                            <PreviewTd>{item.id}</PreviewTd>
                            <PreviewTd>{item.name}</PreviewTd>
                            <PreviewTd>
                              {item.current_link ? (
                                <LinkPreview href={item.current_link} target="_blank" rel="noopener noreferrer">
                                  {item.current_link.substring(0, 30)}...
                                </LinkPreview>
                              ) : (
                                <NoLink>링크 없음</NoLink>
                              )}
                            </PreviewTd>
                            <PreviewTd>
                              <LinkPreview href={item.new_link} target="_blank" rel="noopener noreferrer">
                                {item.new_link.substring(0, 30)}...
                              </LinkPreview>
                            </PreviewTd>
                          </tr>
                        ))}
                      </tbody>
                    </PreviewTable>
                  </PreviewTableContainer>

                  <ConfirmButton
                    onClick={handleConfirmExcelUpload}
                    disabled={updateLinksMutation.isPending}
                  >
                    {updateLinksMutation.isPending ? '업데이트 중...' : '✅ 업데이트 실행'}
                  </ConfirmButton>
                </>
              )}
            </ExcelSection>
          </ExcelModalContent>
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

const HeaderRight = styled.div`
  display: flex;
  gap: 12px;
`;

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

const StatsSection = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const StatsGrid = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const StatCard = styled.div`
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatIcon = styled.span`
  font-size: 24px;
`;

const StatContent = styled.div``;

const StatValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #64748b;
`;

const BulkCompleteButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ExcelUploadButton = styled.button`
  padding: 12px 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }
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

const FilterLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
  display: block;
`;

const SearchFilterGroup = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 4px;
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    flex: 1;
    min-width: 200px;
    flex-shrink: 1;
  }
`;

const SearchInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    min-width: 0;
  }
`;

const SearchInput = styled.input`
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #6366f1;
  }
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
  white-space: nowrap;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

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

const ExcelModalContent = styled(ModalContent)`
  max-width: 900px;
`;

const ExcelSection = styled.div`
  padding: 0;
`;

const ExcelInfo = styled.div`
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  color: #0369a1;
  font-size: 13px;
  margin-bottom: 20px;
`;

const FileInputWrapper = styled.div`
  margin-bottom: 20px;
`;

const FileInputLabel = styled.label`
  display: block;
  padding: 12px 16px;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #6366f1;
    background: #f8fafc;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 20px;
  color: #64748b;
  font-size: 14px;
`;

const PreviewTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 24px 0 12px 0;
`;

const PreviewTableContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 20px;
`;

const PreviewTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
`;

const PreviewTh = styled.th`
  padding: 10px 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const PreviewTd = styled.td`
  padding: 10px 12px;
  font-size: 13px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
`;

const LinkPreview = styled.a`
  color: #3b82f6;
  text-decoration: none;
  word-break: break-all;

  &:hover {
    text-decoration: underline;
  }
`;

const NoLink = styled.span`
  color: #94a3b8;
  font-style: italic;
`;

const ConfirmButton = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

