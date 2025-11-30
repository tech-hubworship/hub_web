// 파일 경로: src/views/AdminPage/bible-card/PastorPage.tsx
// 목회자 전용 페이지 - 배정된 지체 목록 & 말씀 입력

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';

interface Application {
  id: number;
  name: string;
  community: string;
  group_name: string;
  cell_name: string;
  birth_date: string;
  gender: string;
  prayer_request: string;
  status: string;
  bible_verse: string;
  bible_verse_reference: string;
  pastor_message: string;
  assigned_at: string;
  completed_at: string;
}

export default function BibleCardPastorPage() {
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // 실시간 업데이트 상태
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [formData, setFormData] = useState({
    bible_verse_reference: '',
    bible_verse: '',
    pastor_message: '',
  });

  // 성경 구절 선택 상태
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedBookShort, setSelectedBookShort] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number | ''>('');
  const [selectedVerse, setSelectedVerse] = useState<number | ''>('');

  // 로드된 옵션들
  const [books, setBooks] = useState<Array<{full_name: string, short_name: string}>>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [verses, setVerses] = useState<number[]>([]);

  // 로딩 상태
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [isLoadingText, setIsLoadingText] = useState(false);

  // 배정된 지체 목록 조회
  const { data: assignedData, isLoading } = useQuery({
    queryKey: ['pastor-assigned', statusFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/bible-card/pastor/assigned?${params}`);
      if (!response.ok) throw new Error('조회 실패');
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false, // 실시간 업데이트 토글
  });

  // 말씀 입력 뮤테이션
  const completeMutation = useMutation({
    mutationFn: async (data: { applicationId: number } & typeof formData) => {
      const response = await fetch('/api/bible-card/pastor/complete', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '저장 실패');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastor-assigned'] });
      handleCloseModal();
      alert('말씀이 저장되었습니다.');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const applications = assignedData?.data || [];
  const stats = assignedData?.stats;
  const pagination = assignedData?.pagination;

  // 책 목록 로드 (컴포넌트 마운트 시)
  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoadingBooks(true);
      try {
        const response = await fetch('/api/bible-card/pastor/bible?type=books');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || '책 목록 조회 실패');
        }
        const data = await response.json();
        console.log('[PastorPage] 책 목록 로드 성공:', data.length, '개');
        console.log('[PastorPage] 첫 5개 책:', data.slice(0, 5));
        setBooks(data);
      } catch (error) {
        console.error('책 목록 로드 실패:', error);
      } finally {
        setIsLoadingBooks(false);
      }
    };
    fetchBooks();
  }, []);

  // 기존 구절 파싱 함수
  const parseReference = (reference: string) => {
    const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (!match) return null;
    return {
      book: match[1].trim(),
      chapter: parseInt(match[2], 10),
      verse: parseInt(match[3], 10),
    };
  };

  // 책 선택 핸들러
  const handleBookChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bookFullName = e.target.value;
    const book = books.find(b => b.full_name === bookFullName);
    
    setSelectedBook(bookFullName);
    setSelectedBookShort(book?.short_name || '');
    setSelectedChapter('');
    setSelectedVerse('');
    setChapters([]);
    setVerses([]);
    
    if (book?.short_name) {
      setIsLoadingChapters(true);
      try {
        const response = await fetch(
          `/api/bible-card/pastor/bible?type=chapters&book=${encodeURIComponent(book.short_name)}`
        );
        if (!response.ok) throw new Error('장 목록 조회 실패');
        const data = await response.json();
        setChapters(data.chapters);
      } catch (error) {
        console.error('장 목록 로드 실패:', error);
        alert('장 목록을 불러올 수 없습니다.');
      } finally {
        setIsLoadingChapters(false);
      }
    }
  };

  // 장 선택 핸들러
  const handleChapterChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chapter = e.target.value ? parseInt(e.target.value) : '';
    setSelectedChapter(chapter);
    setSelectedVerse('');
    setVerses([]);
    
    if (selectedBookShort && chapter) {
      setIsLoadingVerses(true);
      try {
        const response = await fetch(
          `/api/bible-card/pastor/bible?type=verses&book=${encodeURIComponent(selectedBookShort)}&chapter=${chapter}`
        );
        if (!response.ok) throw new Error('절 목록 조회 실패');
        const data = await response.json();
        setVerses(data.verses);
      } catch (error) {
        console.error('절 목록 로드 실패:', error);
        alert('절 목록을 불러올 수 없습니다.');
      } finally {
        setIsLoadingVerses(false);
      }
    }
  };

  // 절 선택 핸들러
  const handleVerseChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const verse = e.target.value ? parseInt(e.target.value) : '';
    setSelectedVerse(verse);
    
    if (selectedBookShort && selectedChapter && verse) {
      setIsLoadingText(true);
      try {
        const response = await fetch(
          `/api/bible-card/pastor/bible?type=text&book=${encodeURIComponent(selectedBookShort)}&chapter=${selectedChapter}&verse=${verse}`
        );
        if (!response.ok) throw new Error('본문 조회 실패');
        const data = await response.json();
        
        // 자동 입력!
        setFormData(prev => ({
          ...prev,
          bible_verse_reference: data.reference,
          bible_verse: data.text,
        }));
      } catch (error) {
        console.error('본문 로드 실패:', error);
        alert('본문을 불러올 수 없습니다.');
      } finally {
        setIsLoadingText(false);
      }
    }
  };

  const handleOpenModal = async (app: Application) => {
    setSelectedApp(app);
    
    // 초기화
    setSelectedBook('');
    setSelectedBookShort('');
    setSelectedChapter('');
    setSelectedVerse('');
    setChapters([]);
    setVerses([]);
    
    // 기존에 저장된 구절이 있으면 복원
    if (app.bible_verse_reference) {
      const parsed = parseReference(app.bible_verse_reference);
      if (parsed && books.length > 0) {
        const book = books.find(b => b.full_name === parsed.book);
        if (book) {
          setSelectedBook(book.full_name);
          setSelectedBookShort(book.short_name);
          
          // 장 목록 로드
          setIsLoadingChapters(true);
          try {
            const chaptersRes = await fetch(
              `/api/bible-card/pastor/bible?type=chapters&book=${encodeURIComponent(book.short_name)}`
            );
            if (chaptersRes.ok) {
              const chaptersData = await chaptersRes.json();
              setChapters(chaptersData.chapters);
              setSelectedChapter(parsed.chapter);
              
              // 절 목록 로드
              setIsLoadingVerses(true);
              const versesRes = await fetch(
                `/api/bible-card/pastor/bible?type=verses&book=${encodeURIComponent(book.short_name)}&chapter=${parsed.chapter}`
              );
              if (versesRes.ok) {
                const versesData = await versesRes.json();
                setVerses(versesData.verses);
                setSelectedVerse(parsed.verse);
              }
            }
          } catch (error) {
            console.error('기존 구절 복원 실패:', error);
          } finally {
            setIsLoadingChapters(false);
            setIsLoadingVerses(false);
          }
        }
      }
    }
    
    setFormData({
      bible_verse_reference: app.bible_verse_reference || '',
      bible_verse: app.bible_verse || '',
      pastor_message: app.pastor_message || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApp(null);
    // 선택 상태 초기화
    setSelectedBook('');
    setSelectedBookShort('');
    setSelectedChapter('');
    setSelectedVerse('');
    setChapters([]);
    setVerses([]);
  };

  const handleSubmit = () => {
    if (!selectedApp) return;
    if (!formData.bible_verse_reference.trim() || !formData.bible_verse.trim()) {
      alert('성경 구절과 말씀 본문은 필수입니다.');
      return;
    }
    completeMutation.mutate({
      applicationId: selectedApp.id,
      ...formData,
    });
  };

  const formatGender = (gender: string) => {
    if (gender === 'M') return '남';
    if (gender === 'F') return '여';
    return '-';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      assigned: { bg: '#fef3c7', color: '#92400e', label: '작성대기' },
      completed: { bg: '#d1fae5', color: '#065f46', label: '작성완료' },
      delivered: { bg: '#e0e7ff', color: '#4338ca', label: '전달완료' },
    };
    const style = styles[status] || styles.assigned;
    return <StatusBadge bg={style.bg} textColor={style.color}>{style.label}</StatusBadge>;
  };

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Title>✍️ 말씀 작성</Title>
          <Subtitle>배정된 지체들의 기도제목을 보고 말씀을 작성해주세요</Subtitle>
        </HeaderContent>
      </Header>

      {/* 통계 */}
      <StatsGrid>
        <StatCard color="#f1f5f9">
          <StatValue>{stats?.total || 0}</StatValue>
          <StatLabel>전체 배정</StatLabel>
        </StatCard>
        <StatCard color="#fef3c7">
          <StatValue>{stats?.assigned || 0}</StatValue>
          <StatLabel>작성 대기</StatLabel>
        </StatCard>
        <StatCard color="#d1fae5">
          <StatValue>{stats?.completed || 0}</StatValue>
          <StatLabel>작성 완료</StatLabel>
        </StatCard>
        <StatCard color="#e0e7ff">
          <StatValue>{stats?.delivered || 0}</StatValue>
          <StatLabel>전달 완료</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* 필터 */}
      <FilterBar>
        <FilterSelect
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="">전체</option>
          <option value="assigned">작성 대기</option>
          <option value="completed">작성 완료</option>
          <option value="delivered">전달 완료</option>
        </FilterSelect>
        <AutoRefreshButton 
          active={autoRefresh}
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          {autoRefresh ? '🔄 실시간 ON' : '⏸️ 실시간 OFF'}
        </AutoRefreshButton>
      </FilterBar>

      {/* 목록 - 데스크톱 테이블 / 모바일 카드 */}
      {isLoading ? (
        <LoadingState>로딩 중...</LoadingState>
      ) : applications.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📭</EmptyIcon>
          <EmptyText>배정된 지체가 없습니다.</EmptyText>
        </EmptyState>
      ) : (
        <>
          {/* 데스크톱 테이블 */}
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <Th>이름</Th>
                  <Th>생년월일</Th>
                  <Th>성별</Th>
                  <Th>공동체</Th>
                  <Th>그룹</Th>
                  <Th>다락방</Th>
                  <Th>기도제목</Th>
                  <Th>상태</Th>
                  <Th>말씀</Th>
                  <Th>작성</Th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app: Application) => (
                  <Tr key={app.id} onClick={() => handleOpenModal(app)}>
                    <Td><strong>{app.name}</strong></Td>
                    <Td>{app.birth_date || '-'}</Td>
                    <Td>{formatGender(app.gender)}</Td>
                    <Td>{app.community || '-'}</Td>
                    <Td>{app.group_name || '-'}</Td>
                    <Td>{app.cell_name || '-'}</Td>
                    <Td>
                      <PrayerPreview>{app.prayer_request}</PrayerPreview>
                    </Td>
                    <Td>{getStatusBadge(app.status)}</Td>
                    <Td>
                      {app.bible_verse_reference ? (
                        <BiblePreview>📖 {app.bible_verse_reference}</BiblePreview>
                      ) : '-'}
                    </Td>
                    <Td>
                      <ActionButton status={app.status}>
                        {app.status === 'assigned' ? '작성' : '보기'}
                      </ActionButton>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>

          {/* 모바일 목록 */}
          <MobileList>
            {applications.map((app: Application) => (
              <MobileListItem key={app.id} onClick={() => handleOpenModal(app)}>
                <MobileListLeft>
                  <MobileListName>{app.name}</MobileListName>
                  <MobileListInfo>
                    {app.community || '-'} / {app.group_name || '-'} / {app.cell_name || '-'}
                  </MobileListInfo>
                  {app.prayer_request && (
                    <MobileListPrayer>{app.prayer_request}</MobileListPrayer>
                  )}
                </MobileListLeft>
                <MobileListRight>
                  {getStatusBadge(app.status)}
                  {app.bible_verse_reference && (
                    <MobileListBible>📖 {app.bible_verse_reference}</MobileListBible>
                  )}
                  <ActionButton status={app.status}>
                    {app.status === 'assigned' ? '작성' : '보기'}
                  </ActionButton>
                </MobileListRight>
              </MobileListItem>
            ))}
          </MobileList>
        </>
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

      {/* 말씀 입력 모달 */}
      {isModalOpen && selectedApp && (
        <Modal onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{selectedApp.name}님에게 드릴 말씀</ModalTitle>
              <CloseButton onClick={handleCloseModal}>×</CloseButton>
            </ModalHeader>

            <ModalBody>
              {/* 지체 정보 */}
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>이름</InfoLabel>
                  <InfoValue>{selectedApp.name}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>생년월일</InfoLabel>
                  <InfoValue>{selectedApp.birth_date || '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>성별</InfoLabel>
                  <InfoValue>{formatGender(selectedApp.gender)}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>공동체</InfoLabel>
                  <InfoValue>{selectedApp.community || '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>그룹</InfoLabel>
                  <InfoValue>{selectedApp.group_name || '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>다락방</InfoLabel>
                  <InfoValue>{selectedApp.cell_name || '-'}</InfoValue>
                </InfoItem>
              </InfoGrid>

              <PrayerBox>
                <PrayerLabel>📖 기도제목</PrayerLabel>
                <PrayerText>{selectedApp.prayer_request}</PrayerText>
              </PrayerBox>

              <FormGroup>
                <Label>성경 구절 *</Label>
                <BibleSelectorRow>
                  <Select
                    value={selectedBook}
                    onChange={handleBookChange}
                    disabled={selectedApp.status !== 'assigned' || isLoadingBooks}
                  >
                    <option value="">책 선택</option>
                    {books.map(book => (
                      <option key={book.full_name} value={book.full_name}>
                        {book.full_name}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={selectedChapter}
                    onChange={handleChapterChange}
                    disabled={!selectedBook || isLoadingChapters || selectedApp.status !== 'assigned'}
                  >
                    <option value="">장 선택</option>
                    {isLoadingChapters ? (
                      <option disabled>로딩 중...</option>
                    ) : (
                      chapters.map(ch => (
                        <option key={ch} value={ch}>{ch}장</option>
                      ))
                    )}
                  </Select>

                  <Select
                    value={selectedVerse}
                    onChange={handleVerseChange}
                    disabled={!selectedChapter || isLoadingVerses || selectedApp.status !== 'assigned'}
                  >
                    <option value="">절 선택</option>
                    {isLoadingVerses ? (
                      <option disabled>로딩 중...</option>
                    ) : (
                      verses.map(v => (
                        <option key={v} value={v}>{v}절</option>
                      ))
                    )}
                  </Select>
                </BibleSelectorRow>

                {isLoadingText && (
                  <LoadingText>본문을 불러오는 중...</LoadingText>
                )}

                {selectedBook && selectedChapter && selectedVerse && !isLoadingText && (
                  <VerseReference>
                    {selectedBook} {selectedChapter}:{selectedVerse}
                  </VerseReference>
                )}
              </FormGroup>

              <FormGroup>
                <Label>말씀 본문 *</Label>
                <Textarea
                  placeholder="말씀을 입력해주세요..."
                  value={formData.bible_verse}
                  onChange={(e) => setFormData(prev => ({ ...prev, bible_verse: e.target.value }))}
                  rows={5}
                  disabled={selectedApp.status !== 'assigned'}
                />
              </FormGroup>

              <FormGroup>
                <Label>목회자 메시지 (선택)</Label>
                <Textarea
                  placeholder="기도나 격려의 말씀을 남겨주세요..."
                  value={formData.pastor_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, pastor_message: e.target.value }))}
                  rows={3}
                  disabled={selectedApp.status !== 'assigned'}
                />
              </FormGroup>
            </ModalBody>

            <ModalFooter>
              {selectedApp.status === 'assigned' ? (
                <>
                  <CancelButton onClick={handleCloseModal}>취소</CancelButton>
                  <SaveButton 
                    onClick={handleSubmit}
                    disabled={completeMutation.isPending}
                  >
                    {completeMutation.isPending ? '저장 중...' : '말씀 저장'}
                  </SaveButton>
                </>
              ) : (
                <>
                  <CompletedNote>
                    ✅ 이미 말씀이 작성된 신청입니다.
                  </CompletedNote>
                  <CancelButton onClick={handleCloseModal} style={{ flex: 1 }}>닫기</CancelButton>
                </>
              )}
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
`;

const HeaderContent = styled.div`
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
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    overflow-x: hidden;
    padding-bottom: 4px;
    max-width: 100%;
  }
`;

const StatCard = styled.div<{ color: string }>`
  background: ${props => props.color};
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 12px 8px;
    width: 100%;
    min-width: 0;
  }
`;


const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
`;

const FilterBar = styled.div`
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const FilterSelect = styled.select`
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 150px;
  flex: 1;

  @media (max-width: 768px) {
    width: 100%;
    padding: 12px 14px;
    font-size: 16px; /* iOS 줌 방지 */
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
    width: 100%;
    font-size: 12px;
    padding: 8px 12px;
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
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
`;

const EmptyText = styled.p`
  margin: 0;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  overflow-x: auto;

  @media (max-width: 768px) {
    display: none;
  }
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
  cursor: pointer;
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

const PrayerPreview = styled.div`
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #64748b;
  font-size: 12px;
`;

const BiblePreview = styled.div`
  color: #6366f1;
  font-size: 12px;
  font-weight: 500;
`;

const ActionButton = styled.button<{ status: string }>`
  padding: 5px 12px;
  background: ${props => props.status === 'assigned' 
    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
    : '#f1f5f9'};
  color: ${props => props.status === 'assigned' ? 'white' : '#64748b'};
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    opacity: 0.9;
  }

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 11px;
    min-width: 50px;
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
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 6px;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }
`;

const PageButton = styled.button`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  min-width: 44px; /* 터치 타겟 크기 */
  min-height: 44px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 16px;
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
  align-items: flex-start;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  overflow-y: auto;
  width: 100vw;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
    width: 100vw;
    max-width: 100vw;
  }
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  max-height: calc(90vh - 40px);
  margin-top: 5vh;
  margin-bottom: 5vh;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  position: relative;

  @media (max-width: 768px) {
    max-width: 100vw;
    width: 100vw;
    max-height: 95vh;
    border-radius: 16px 16px 0 0;
    margin-top: auto;
    overflow-x: hidden;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;

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

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px;
    width: 100%;
    max-width: 100%;
  }
`;

const InfoItem = styled.div``;

const InfoLabel = styled.div`
  font-size: 11px;
  color: #64748b;
  margin-bottom: 2px;
`;

const InfoValue = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
`;

const PrayerBox = styled.div`
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
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

const FormGroup = styled.div`
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
`;

const BibleSelectorRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Select = styled.select`
  flex: 1;
  padding: 10px 14px;
  padding-right: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: #1e293b;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;

  &:disabled {
    background-color: #f1f5f9;
    color: #94a3b8;
    cursor: not-allowed;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:hover:not(:disabled) {
    border-color: #cbd5e1;
  }
`;

const LoadingText = styled.div`
  padding: 8px 0;
  color: #64748b;
  font-size: 14px;
  text-align: center;
`;

const VerseReference = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 8px;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #6366f1;
  }

  &:disabled {
    background: #f8fafc;
  }

  @media (max-width: 768px) {
    padding: 14px;
    font-size: 16px; /* iOS 줌 방지 */
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  line-height: 1.6;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #6366f1;
  }

  &:disabled {
    background: #f8fafc;
  }

  @media (max-width: 768px) {
    padding: 14px;
    font-size: 16px; /* iOS 줌 방지 */
  }
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;

  @media (max-width: 768px) {
    padding: 16px 20px;
    position: sticky;
    bottom: 0;
    background: white;
    z-index: 1;
    flex-direction: column-reverse;
  }
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 14px;
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

const SaveButton = styled.button`
  flex: 2;
  padding: 14px;
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

const CompletedNote = styled.div`
  flex: 2;
  text-align: center;
  padding: 14px;
  background: #d1fae5;
  color: #065f46;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
`;

// 모바일 목록 스타일
const MobileList = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    overflow-x: hidden;
    width: 100%;
    box-sizing: border-box;
  }
`;

const MobileListItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #f8fafc;
  }
`;

const MobileListLeft = styled.div`
  flex: 1;
  min-width: 0;
  margin-right: 12px;
  overflow: hidden;
  max-width: calc(100% - 100px);
`;

const MobileListName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
`;

const MobileListInfo = styled.div`
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const MobileListPrayer = styled.div`
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const MobileListRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
  min-width: 80px;
  max-width: 100px;
`;

const MobileListBible = styled.div`
  font-size: 11px;
  color: #6366f1;
  font-weight: 500;
  white-space: nowrap;
`;
