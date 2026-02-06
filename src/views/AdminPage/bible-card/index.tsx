// 파일 경로: src/views/AdminPage/bible-card/index.tsx
// 말씀카드 관리 페이지 - 신청목록 & 목회자 배정 (팝업 방식)

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { Combobox } from '@src/components/ui/combobox';

interface Application {
  id: number;
  user_id: string;
  name: string;
  community: string;
  group_id: number;
  group_name: string;
  group_pastor_id: string;
  cell_name: string;
  birth_date: string;
  gender: string;
  prayer_request: string;
  status: string;
  assigned_pastor_id: string;
  pastor_name: string;
  bible_verse: string;
  bible_verse_reference: string;
  drive_link_1: string;
  drive_link_2: string;
  created_at: string;
  completed_at: string;
}

interface Pastor {
  user_id: string;
  name: string;
  email: string;
  community: string;
  assigned_count: number;
}

interface GroupWithPastor {
  id: number;
  name: string;
  pastor_id: string | null;
  pastor_name: string | null;
}

interface Stats {
  overall: {
    total: number;
    pending: number;
    assigned: number;
    completed: number;
    delivered: number;
  };
}

export default function BibleCardAdminPage() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedPastorId, setSelectedPastorId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [cellFilter, setCellFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 실제 조회에 사용되는 필터 상태
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('');
  const [appliedGroupFilter, setAppliedGroupFilter] = useState('');
  const [appliedCellFilter, setAppliedCellFilter] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  
  // 실시간 업데이트 상태
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // 팝업 상태
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isGroupPastorModalOpen, setIsGroupPastorModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [selectedGroupForPastor, setSelectedGroupForPastor] = useState<GroupWithPastor | null>(null);
  const [selectedGroupPastorId, setSelectedGroupPastorId] = useState('');

  // 통계 조회
  const { data: stats } = useQuery<Stats>({
    queryKey: ['bible-card-stats'],
    queryFn: async () => {
      const response = await fetch('/api/bible-card/admin/stats');
      if (!response.ok) throw new Error('통계 조회 실패');
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false, // 실시간 업데이트 토글
  });

  // 조회 버튼 클릭 핸들러
  const handleSearch = () => {
    setAppliedStatusFilter(statusFilter);
    setAppliedGroupFilter(groupFilter);
    setAppliedCellFilter(cellFilter);
    setAppliedSearchQuery(searchQuery);
    setCurrentPage(1);
    // 조회 버튼 클릭 시 강제 새로고침 (필터가 모두 "전체"일 때도 조회 가능)
    queryClient.invalidateQueries({ queryKey: ['bible-card-applications'] });
  };

  // 신청 목록 조회 - applied 필터 사용
  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ['bible-card-applications', currentPage, appliedStatusFilter, appliedGroupFilter, appliedCellFilter, appliedSearchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      if (appliedStatusFilter) params.append('status', appliedStatusFilter);
      if (appliedGroupFilter) params.append('group_id', appliedGroupFilter);
      if (appliedCellFilter) params.append('cell_id', appliedCellFilter);
      if (appliedSearchQuery) params.append('search', appliedSearchQuery);
      
      const response = await fetch(`/api/bible-card/admin/applications?${params}`);
      if (!response.ok) throw new Error('목록 조회 실패');
      return response.json();
    },
    enabled: true, // 항상 활성화 (초기 로드 시에도 조회)
    refetchInterval: autoRefresh ? 30000 : false, // 실시간 업데이트 토글
  });
  
  // 초기 로드 시 자동 조회 (한 번만)
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 최초 마운트 시에만 실행

  // 목회자 목록 조회
  const { data: pastors } = useQuery<Pastor[]>({
    queryKey: ['bible-card-pastors'],
    queryFn: async () => {
      const response = await fetch('/api/bible-card/admin/pastors');
      if (!response.ok) throw new Error('목회자 조회 실패');
      return response.json();
    },
  });

  // 그룹별 담당 목회자 정보 조회
  const { data: groupsWithPastors } = useQuery<GroupWithPastor[]>({
    queryKey: ['groups-with-pastors'],
    queryFn: async () => {
      const response = await fetch('/api/bible-card/admin/groups-with-pastors');
      if (!response.ok) throw new Error('그룹 정보 조회 실패');
      return response.json();
    },
  });

  // 다락방 목록 조회 (그룹/다락방 필터용)
  const { data: cellsData } = useQuery<{ cells?: { id: number; name: string; group_id: number }[] }>({
    queryKey: ['common-cells'],
    queryFn: async () => {
      const response = await fetch('/api/common/cells');
      if (!response.ok) throw new Error('다락방 조회 실패');
      return response.json();
    },
  });
  const cells = cellsData?.cells ?? [];

  // 목회자 배정 뮤테이션
  const assignMutation = useMutation({
    mutationFn: async ({ applicationIds, pastorId }: { applicationIds: number[]; pastorId: string }) => {
      const response = await fetch('/api/bible-card/admin/assign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationIds, pastorId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '배정 실패');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bible-card-applications'] });
      queryClient.invalidateQueries({ queryKey: ['bible-card-pastors'] });
      queryClient.invalidateQueries({ queryKey: ['bible-card-stats'] });
      setSelectedIds([]);
      setSelectedPastorId('');
      setIsAssignModalOpen(false);
      alert('목회자 배정이 완료되었습니다.');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 그룹별 자동 배정 뮤테이션
  const assignByGroupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/bible-card/admin/assign-by-group', {
        method: 'PUT',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '자동 배정 실패');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bible-card-applications'] });
      queryClient.invalidateQueries({ queryKey: ['bible-card-pastors'] });
      queryClient.invalidateQueries({ queryKey: ['bible-card-stats'] });
      queryClient.invalidateQueries({ queryKey: ['groups-with-pastors'] });
      alert(data.message);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 그룹별 목회자 지정 뮤테이션
  const assignGroupPastorMutation = useMutation({
    mutationFn: async ({ groupId, pastorId }: { groupId: number; pastorId: string | null }) => {
      const response = await fetch('/api/bible-card/admin/group-pastor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, pastorId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '목회자 지정 실패');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groups-with-pastors'] });
      setSelectedGroupForPastor(null);
      setSelectedGroupPastorId('');
      setIsGroupPastorModalOpen(false);
      alert(data.message);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const applications = applicationsData?.data || [];
  const pagination = applicationsData?.pagination;

  const handleSelectAll = () => {
    if (selectedIds.length === applications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map((a: Application) => a.id));
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const handleOpenAssignModal = () => {
    if (selectedIds.length === 0) {
      alert('배정할 신청을 선택해주세요.');
      return;
    }
    setIsAssignModalOpen(true);
  };

  const handleAssign = () => {
    if (!selectedPastorId) {
      alert('목회자를 선택해주세요.');
      return;
    }
    assignMutation.mutate({ applicationIds: selectedIds, pastorId: selectedPastorId });
  };

  const handleOpenDetail = (app: Application) => {
    setSelectedApp(app);
    setIsDetailModalOpen(true);
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatGender = (gender: string) => {
    if (gender === 'M') return '남성';
    if (gender === 'F') return '여성';
    return '-';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: '#fef3c7', color: '#92400e', label: '대기중' },
      assigned: { bg: '#dbeafe', color: '#1e40af', label: '배정됨' },
      completed: { bg: '#d1fae5', color: '#065f46', label: '완료' },
      delivered: { bg: '#e0e7ff', color: '#4338ca', label: '전달완료' },
    };
    const style = styles[status] || styles.pending;
    return <StatusBadge bg={style.bg} textColor={style.color}>{style.label}</StatusBadge>;
  };

  const cellOptions = groupFilter
    ? cells
        .filter((c) => String(c.group_id) === groupFilter)
        .map((c) => ({ value: String(c.id), label: c.name }))
    : cells.map((c) => {
        const groupName = groupsWithPastors?.find((g) => g.id === c.group_id)?.name ?? '';
        return { value: String(c.id), label: groupName ? `${groupName} / ${c.name}` : c.name };
      });

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <Title>📜 말씀카드 관리</Title>
          <Subtitle>신청 현황 관리 및 목회자 배정</Subtitle>
        </HeaderLeft>
      </Header>

      {/* 통계 카드 */}
      <StatsGrid>
        <StatCard>
          <StatIcon>📝</StatIcon>
          <StatContent>
            <StatValue>{stats?.overall?.total || 0}</StatValue>
            <StatLabel>전체 신청</StatLabel>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon>🕐</StatIcon>
          <StatContent>
            <StatValue>{stats?.overall?.pending || 0}</StatValue>
            <StatLabel>대기중</StatLabel>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon>✍️</StatIcon>
          <StatContent>
            <StatValue>{stats?.overall?.assigned || 0}</StatValue>
            <StatLabel>배정됨</StatLabel>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon>✅</StatIcon>
          <StatContent>
            <StatValue>{stats?.overall?.completed || 0}</StatValue>
            <StatLabel>완료</StatLabel>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon>📬</StatIcon>
          <StatContent>
            <StatValue>{stats?.overall?.delivered || 0}</StatValue>
            <StatLabel>전달완료</StatLabel>
          </StatContent>
        </StatCard>
      </StatsGrid>

      {/* 필터 & 액션 버튼 */}
      <FilterSection>
        <FilterGroup>
          <Combobox
            value={statusFilter}
            onChange={(value) => { setStatusFilter(value); }}
            options={[
              { value: '', label: '전체 상태' },
              { value: 'pending', label: '대기중' },
              { value: 'assigned', label: '배정됨' },
              { value: 'completed', label: '완료' },
              { value: 'delivered', label: '전달완료' },
            ]}
            placeholder="전체 상태"
          />
          <Combobox
            value={groupFilter}
            onChange={(value) => {
              setGroupFilter(value);
              setCellFilter(''); // 그룹 변경 시 다락방 초기화
            }}
            options={[
              { value: '', label: '전체 그룹' },
              ...(groupsWithPastors?.map((g) => ({ value: String(g.id), label: g.name })) ?? []),
            ]}
            placeholder="전체 그룹"
          />
          <Combobox
            value={cellFilter}
            onChange={(value) => { setCellFilter(value); }}
            options={[{ value: '', label: '전체 다락방' }, ...cellOptions]}
            placeholder="전체 다락방"
          />
          <SearchInput
            type="text"
            placeholder="이름으로 검색..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); }}
          />
          <SearchButton onClick={handleSearch}>
            🔍 조회하기
          </SearchButton>
          <AutoRefreshButton 
            active={autoRefresh}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄 실시간 ON' : '⏸️ 실시간 OFF'}
          </AutoRefreshButton>
        </FilterGroup>
        <ActionButtons>
          <AssignByGroupButton
            onClick={() => {
              if (confirm('대기중인 신청을 그룹 담당 목회자에게 자동 배정하시겠습니까?')) {
                assignByGroupMutation.mutate();
              }
            }}
            disabled={assignByGroupMutation.isPending}
          >
            🏷️ 그룹별 자동 배정
          </AssignByGroupButton>
          <AssignButton onClick={handleOpenAssignModal}>
            ✍️ 선택 배정 ({selectedIds.length})
          </AssignButton>
        </ActionButtons>
      </FilterSection>

      {/* 그룹별 담당 목회자 현황 */}
      <GroupPastorSection>
        <SectionHeader>
          <SectionTitle>그룹별 담당 목회자</SectionTitle>
          <ManageButton onClick={() => setIsGroupPastorModalOpen(true)}>
            ⚙️ 목회자 지정
          </ManageButton>
        </SectionHeader>
        <GroupGrid>
          {groupsWithPastors?.map((group) => (
            <GroupItem key={group.id} hasPastor={!!group.pastor_name}>
              <GroupName>{group.name}</GroupName>
              <GroupPastor>{group.pastor_name || '미지정'}</GroupPastor>
            </GroupItem>
          ))}
        </GroupGrid>
      </GroupPastorSection>

      {/* 테이블 */}
      {isLoading ? (
        <LoadingState>로딩 중...</LoadingState>
      ) : (
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <Th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === applications.length && applications.length > 0}
                    onChange={handleSelectAll}
                  />
                </Th>
                <Th>신청자</Th>
                <Th>생년월일</Th>
                <Th>성별</Th>
                <Th>공동체</Th>
                <Th>그룹</Th>
                <Th>다락방</Th>
                <Th>상태</Th>
                <Th>담당목회자</Th>
                <Th>신청일시</Th>
                <Th>상세</Th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app: Application) => (
                <Tr key={app.id}>
                  <Td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(app.id)}
                      onChange={() => handleSelectOne(app.id)}
                    />
                  </Td>
                  <Td><strong>{app.name}</strong></Td>
                  <Td>{app.birth_date || '-'}</Td>
                  <Td>{formatGender(app.gender)}</Td>
                  <Td>{app.community || '-'}</Td>
                  <Td>{app.group_name || '-'}</Td>
                  <Td>{app.cell_name || '-'}</Td>
                  <Td>{getStatusBadge(app.status)}</Td>
                  <Td>{app.pastor_name || '-'}</Td>
                  <Td>{formatDateTime(app.created_at)}</Td>
                  <Td>
                    <DetailButton onClick={() => handleOpenDetail(app)}>
                      상세
                    </DetailButton>
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
          <PageButton
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            ≪
          </PageButton>
          <PageButton
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            ＜
          </PageButton>
          <PageInfo>{currentPage} / {pagination.totalPages}</PageInfo>
          <PageButton
            onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
            disabled={currentPage === pagination.totalPages}
          >
            ＞
          </PageButton>
          <PageButton
            onClick={() => setCurrentPage(pagination.totalPages)}
            disabled={currentPage === pagination.totalPages}
          >
            ≫
          </PageButton>
        </Pagination>
      )}

      {/* 목회자 배정 팝업 */}
      {isAssignModalOpen && (
        <Modal onClick={() => setIsAssignModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>목회자 배정</ModalTitle>
              <CloseButton onClick={() => setIsAssignModalOpen(false)}>×</CloseButton>
            </ModalHeader>

            <ModalBody>
              <InfoBox>
                <InfoIcon>📋</InfoIcon>
                <InfoText>선택된 신청: <strong>{selectedIds.length}명</strong></InfoText>
              </InfoBox>

              <FormGroup>
                <Label>목회자 선택</Label>
                <Combobox
                  value={selectedPastorId}
                  onChange={(value) => setSelectedPastorId(value)}
                  options={[
                    { value: '', label: '목회자를 선택하세요' },
                    ...(pastors?.map((pastor) => ({
                      value: pastor.user_id,
                      label: `${pastor.name} (${pastor.community || '-'}) - 배정: ${pastor.assigned_count}명`
                    })) || []),
                  ]}
                  placeholder="목회자를 선택하세요"
                />
              </FormGroup>

              <PastorListInModal>
                <PastorListTitle>목회자 현황</PastorListTitle>
                {pastors?.map((pastor) => (
                  <PastorItem 
                    key={pastor.user_id}
                    selected={selectedPastorId === pastor.user_id}
                    onClick={() => setSelectedPastorId(pastor.user_id)}
                  >
                    <PastorInfo>
                      <PastorName>{pastor.name}</PastorName>
                      <PastorEmail>{pastor.email}</PastorEmail>
                    </PastorInfo>
                    <PastorCount>{pastor.assigned_count}명</PastorCount>
                  </PastorItem>
                ))}
              </PastorListInModal>
            </ModalBody>

            <ModalFooter>
              <CancelButton onClick={() => setIsAssignModalOpen(false)}>취소</CancelButton>
              <ConfirmButton 
                onClick={handleAssign}
                disabled={!selectedPastorId || assignMutation.isPending}
              >
                {assignMutation.isPending ? '배정 중...' : '배정하기'}
              </ConfirmButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* 상세 정보 팝업 */}
      {isDetailModalOpen && selectedApp && (
        <Modal onClick={() => setIsDetailModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{selectedApp.name}님의 신청 정보</ModalTitle>
              <CloseButton onClick={() => setIsDetailModalOpen(false)}>×</CloseButton>
            </ModalHeader>

            <ModalBody>
              <DetailGrid>
                <DetailItem>
                  <DetailLabel>이름</DetailLabel>
                  <DetailValue>{selectedApp.name}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>생년월일</DetailLabel>
                  <DetailValue>{selectedApp.birth_date || '-'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>성별</DetailLabel>
                  <DetailValue>{formatGender(selectedApp.gender)}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>공동체</DetailLabel>
                  <DetailValue>{selectedApp.community || '-'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>그룹</DetailLabel>
                  <DetailValue>{selectedApp.group_name || '-'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>다락방</DetailLabel>
                  <DetailValue>{selectedApp.cell_name || '-'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>상태</DetailLabel>
                  <DetailValue>{getStatusBadge(selectedApp.status)}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>담당목회자</DetailLabel>
                  <DetailValue>{selectedApp.pastor_name || '-'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>신청일시</DetailLabel>
                  <DetailValue>{formatDateTime(selectedApp.created_at)}</DetailValue>
                </DetailItem>
              </DetailGrid>

              <PrayerBox>
                <PrayerLabel>📖 기도제목</PrayerLabel>
                <PrayerText>{selectedApp.prayer_request}</PrayerText>
              </PrayerBox>

              {selectedApp.bible_verse_reference && (
                <BibleBox>
                  <BibleLabel>✨ 말씀</BibleLabel>
                  <BibleReference>{selectedApp.bible_verse_reference}</BibleReference>
                  <BibleText>{selectedApp.bible_verse}</BibleText>
                </BibleBox>
              )}
            </ModalBody>

            <ModalFooter>
              <CancelButton onClick={() => setIsDetailModalOpen(false)}>닫기</CancelButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* 그룹별 목회자 지정 모달 */}
      {isGroupPastorModalOpen && (
        <Modal onClick={() => setIsGroupPastorModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>그룹별 담당 목회자 지정</ModalTitle>
              <CloseButton onClick={() => setIsGroupPastorModalOpen(false)}>×</CloseButton>
            </ModalHeader>

            <ModalBody>
              <InfoBox>
                <InfoIcon>📋</InfoIcon>
                <InfoText>각 그룹에 담당 목회자를 지정하면 그룹별 자동 배정 시 해당 목회자에게 자동으로 배정됩니다.</InfoText>
              </InfoBox>

              <GroupPastorList>
                {groupsWithPastors?.map((group) => (
                  <GroupPastorItem key={group.id}>
                    <GroupPastorItemHeader>
                      <GroupPastorItemName>{group.name}</GroupPastorItemName>
                      <GroupPastorItemCurrent>
                        현재: {group.pastor_name || '미지정'}
                      </GroupPastorItemCurrent>
                    </GroupPastorItemHeader>
                    <FormGroup>
                      <Label>담당 목회자 선택</Label>
                      <Select
                        value={group.pastor_id || ''}
                        onChange={(e) => {
                          const pastorId = e.target.value || null;
                          assignGroupPastorMutation.mutate({ 
                            groupId: group.id, 
                            pastorId 
                          });
                        }}
                        disabled={assignGroupPastorMutation.isPending}
                        fullWidth
                      >
                        <option value="">미지정</option>
                        {pastors?.map((pastor) => (
                          <option key={pastor.user_id} value={pastor.user_id}>
                            {pastor.name} ({pastor.community || '-'})
                          </option>
                        ))}
                      </Select>
                    </FormGroup>
                  </GroupPastorItem>
                ))}
              </GroupPastorList>
            </ModalBody>

            <ModalFooter>
              <CancelButton onClick={() => setIsGroupPastorModalOpen(false)}>닫기</CancelButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  padding: 0;
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
`;

const Header = styled.div`
  margin-bottom: 24px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

const HeaderLeft = styled.div`
  width: 100%;
  box-sizing: border-box;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: white;
  padding: 16px;
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
  font-size: 11px;
  color: #64748b;
`;

const FilterSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const Select = styled.select<{ fullWidth?: boolean }>`
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 150px;
  ${props => props.fullWidth && 'width: 100%;'}
`;

const SearchInput = styled.input`
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 200px;

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
  white-space: nowrap;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
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

const AssignButton = styled.button`
  padding: 10px 16px;
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

const AssignByGroupButton = styled.button`
  padding: 10px 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const GroupPastorSection = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 12px 0;
`;

const GroupGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const GroupItem = styled.div<{ hasPastor: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.hasPastor ? '#d1fae5' : '#fef3c7'};
  border-radius: 20px;
  font-size: 12px;
`;

const GroupName = styled.span`
  font-weight: 600;
  color: #1e293b;
`;

const GroupPastor = styled.span`
  color: #64748b;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const ManageButton = styled.button`
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #4f46e5;
    transform: translateY(-1px);
  }
`;

const GroupPastorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
`;

const GroupPastorItem = styled.div`
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const GroupPastorItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const GroupPastorItemName = styled.span`
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
`;

const GroupPastorItemCurrent = styled.span`
  font-size: 13px;
  color: #64748b;
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
  min-width: 900px;
`;

const Th = styled.th`
  padding: 12px 14px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
`;

const Tr = styled.tr`
  &:hover {
    background: #f8fafc;
  }
`;

const Td = styled.td`
  padding: 12px 14px;
  font-size: 13px;
  color: #334155;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
`;

const DetailButton = styled.button`
  padding: 4px 10px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  color: #475569;
  cursor: pointer;

  &:hover {
    background: #e2e8f0;
  }
`;

const StatusBadge = styled.span<{ bg: string; textColor: string }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: ${props => props.bg};
  color: ${props => props.textColor};
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

  &:hover:not(:disabled) {
    background: #f8fafc;
  }
`;

const PageInfo = styled.span`
  font-size: 14px;
  color: #64748b;
  padding: 0 12px;
`;

// Modal Styles
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
  width: 100vw;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
  }
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 540px;
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;

  @media (max-width: 768px) {
    max-width: 100vw;
    width: 100vw;
    max-height: 95vh;
    border-radius: 16px 16px 0 0;
    margin-top: auto;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 16px 20px;
    position: sticky;
    top: 0;
    background: white;
    z-index: 1;
  }
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 16px;
  }
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

  &:hover {
    background: #e2e8f0;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 16px 20px;
    position: sticky;
    bottom: 0;
    background: white;
    z-index: 1;
    flex-direction: column-reverse;
  }
`;

const InfoBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: #dbeafe;
  border-radius: 10px;
  margin-bottom: 20px;
`;

const InfoIcon = styled.span`
  font-size: 20px;
`;

const InfoText = styled.span`
  font-size: 14px;
  color: #1e40af;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
`;

const PastorListInModal = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
`;

const PastorListTitle = styled.h4`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 12px 0;
`;

const PastorItem = styled.div<{ selected?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: ${props => props.selected ? '#dbeafe' : 'white'};
  border: 1px solid ${props => props.selected ? '#6366f1' : '#e2e8f0'};
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #6366f1;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const PastorInfo = styled.div``;

const PastorName = styled.div`
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
`;

const PastorEmail = styled.div`
  font-size: 11px;
  color: #64748b;
`;

const PastorCount = styled.div`
  font-size: 12px;
  color: #6366f1;
  font-weight: 600;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 12px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #f8fafc;
  }
`;

const ConfirmButton = styled.button`
  flex: 2;
  padding: 12px;
  border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Detail Modal Styles
const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const DetailItem = styled.div``;

const DetailLabel = styled.div`
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
`;

const DetailValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
`;

const PrayerBox = styled.div`
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const PrayerLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
`;

const PrayerText = styled.div`
  font-size: 14px;
  color: #78350f;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const BibleBox = styled.div`
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 12px;
  padding: 16px;
`;

const BibleLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 8px;
`;

const BibleReference = styled.div`
  font-size: 13px;
  color: #1e40af;
  font-weight: 600;
  margin-bottom: 8px;
`;

const BibleText = styled.div`
  font-size: 14px;
  color: #1e3a8a;
  line-height: 1.6;
  white-space: pre-wrap;
`;
