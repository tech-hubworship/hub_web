import { useEffect, useState, useCallback, useMemo } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { FaqItem, getAllFaqs, searchFaqs } from '@src/lib/api/faq';
import FaqSection from '@src/views/MainPage/components/Faq/FaqSection';
import Link from 'next/link';
import Head from 'next/head';
import PageLayout from '@src/components/common/PageLayout';
import { useQuery } from '@tanstack/react-query';

// debounce 함수 직접 구현
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// 한 페이지에 표시할 FAQ 항목 수
const ITEMS_PER_PAGE = 10;

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  // React Query를 사용하여 FAQ 데이터 캐싱 및 로딩 상태 관리
  const { data: allFaqs = [], isLoading: isLoadingFaqs } = useQuery({
    queryKey: ['faqs'],
    queryFn: getAllFaqs,
    staleTime: 5 * 60 * 1000, // 5분 동안 데이터 재요청 없음
    gcTime: 30 * 60 * 1000,   // 30분 동안 캐시 유지
  });

  // 검색 쿼리 실행 (디바운싱 적용)
  const { data: searchResults = [], isLoading: isSearchLoading } = useQuery({
    queryKey: ['faqSearch', searchQuery],
    queryFn: () => searchQuery ? searchFaqs(searchQuery) : Promise.resolve([]),
    enabled: searchQuery.length > 0 && isSearching,
    staleTime: 2 * 60 * 1000, // 2분 동안 같은 검색어로는 재요청 없음
  });

  // 검색 디바운싱 적용 (타이핑 중에 매번 요청하지 않도록)
  const debouncedSearch = useCallback(
    debounce(() => {
      setIsSearching(true);
    }, 300),
    []
  );

  // 검색어 변경 핸들러
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    setIsSearching(false); // 검색 중 상태 리셋
    
    if (value) {
      debouncedSearch();
    }
  };

  // 검색 버튼 클릭 핸들러
  const handleSearch = () => {
    setIsSearching(true);
    setCurrentPage(1);
  };

  // 표시할 FAQ 목록 결정 (검색 결과 또는 전체 목록)
  const displayedFaqs = useMemo(() => {
    return searchQuery && isSearching ? searchResults : allFaqs;
  }, [searchQuery, isSearching, searchResults, allFaqs]);

  // 현재 페이지에 표시할 FAQ 항목
  const paginatedFaqs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayedFaqs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [displayedFaqs, currentPage]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(displayedFaqs.length / ITEMS_PER_PAGE);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지 상단으로 스크롤
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 로딩 상태 결정
  const isLoading = isLoadingFaqs || (isSearching && isSearchLoading);

  return (
    <PageLayout>
      <Head>
        <title>자주 묻는 질문 (FAQ) | 허브 커뮤니티</title>
        <meta name="description" content="허브 커뮤니티의 자주 묻는 질문들을 확인하세요." />
      </Head>

      <Container>
        <Header>
          <Title>자주 묻는 질문</Title>
        </Header>

        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="검색어를 입력하세요"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <SearchButton onClick={handleSearch}>검색</SearchButton>
        </SearchContainer>

        <Content>
          {isLoading ? (
            <LoadingContainer>
              <LoadingSpinner />
              <LoadingText>FAQ를 불러오는 중입니다...</LoadingText>
            </LoadingContainer>
          ) : (
            <>
              {displayedFaqs.length > 0 ? (
                <>
                  <FaqList>
                    {paginatedFaqs.map((item) => (
                      <FaqSection
                        key={item.id}
                        tag={item.tag}
                        title={item.title}
                        contents={item.contents}
                      />
                    ))}
                  </FaqList>
                  
                  {totalPages > 1 && (
                    <Pagination>
                      <PaginationButton 
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        이전
                      </PaginationButton>
                      
                      <PageInfo>{currentPage} / {totalPages}</PageInfo>
                      
                      <PaginationButton 
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        다음
                      </PaginationButton>
                    </Pagination>
                  )}
                </>
              ) : (
                <NoData>검색 결과가 없습니다. 다른 검색어로 시도해 보세요.</NoData>
              )}
            </>
          )}
        </Content>
      </Container>
    </PageLayout>
  );
}

const Container = styled.div`
  max-width: 100%;
  padding: 0;
  background-color: #fff;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  
  @media (min-width: 768px) {
    max-width: 375px;
    margin: 0 auto;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
`;

const Header = styled.header`
  margin-top: 60px;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  background-color: #fff;
  position: relative;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 16px 0 0 0;
  text-align: center;
  letter-spacing: -0.48px;
  color: #000;
`;

const SearchContainer = styled.div`
  display: flex;
  padding: 16px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 16px;
  outline: none;
  
  &:focus {
    border-color: #000;
  }
`;

const SearchButton = styled.button`
  padding: 10px 16px;
  background-color: #000;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    background:rgb(56, 55, 55);
  }
`;

const Content = styled.main`
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FaqList = styled.ul`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  list-style: none;
  gap: 12px;
  margin: 0 auto;
  padding: 0;
  
  li {
    width: 100%;
  }
`;

// 로딩 관련 스타일 추가
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  width: 100%;
  gap: 16px;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #000;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.div`
  width: 100%;
  text-align: center;
  padding: 20px;
  color: #777;
  font-size: 16px;
`;

const NoData = styled.div`
  width: 100%;
  text-align: center;
  padding: 20px;
  color: #777;
  font-size: 16px;
`;

// 페이지네이션 스타일
const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  width: 100%;
`;

const PaginationButton = styled.button`
  padding: 8px 16px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background-color: #e9e9e9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  font-size: 14px;
  color: #555;
`;
