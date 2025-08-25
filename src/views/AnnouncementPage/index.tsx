import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { supabase } from '@src/lib/supabase';
import { useAuthStore, initializeAuthState } from '@src/store/auth';
import PageLayout from '@src/components/common/PageLayout';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface Announcement {
  id: number;
  title: string;
  contents: string;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// 한 페이지에 표시할 공지사항 항목 수
const ITEMS_PER_PAGE = 10;

export default function AnnouncementPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = initializeAuthState();
      if (!isAuth && !useAuthStore.getState().isAuthenticated) {
        localStorage.setItem('login_redirect', '/announcements');
        router.replace('/login');
        return;
      }
    }

    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_visible', true)
          .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          setAnnouncements(data);
        }
      } catch (error) {
        console.error('공지사항 로딩 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}. ${month}. ${day}`;
  };

  // 현재 페이지에 표시할 공지사항 항목
  const paginatedAnnouncements = announcements.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 총 페이지 수 계산
  const totalPages = Math.ceil(announcements.length / ITEMS_PER_PAGE);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지 상단으로 스크롤
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <PageLayout>
      <Head>
        <title>공지사항 | 허브 커뮤니티</title>
        <meta name="description" content="허브 커뮤니티의 공지사항을 확인하세요." />
      </Head>
      
      <Container>
        <Header>
          <PageTitle>공지사항</PageTitle>
        </Header>

        <Content>
          {loading ? (
            <LoadingContainer>
              <LoadingSpinner />
              <LoadingText>공지사항을 불러오는 중입니다...</LoadingText>
            </LoadingContainer>
          ) : (
            <>
              {announcements.length > 0 ? (
                <>
                  <AnnouncementList>
                    {paginatedAnnouncements.map(announcement => (
                      <AnnouncementSection
                        key={announcement.id}
                        tag="공지"
                        title={announcement.title}
                        contents={announcement.contents}
                      />
                    ))}
                  </AnnouncementList>
                  
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
                <NoData>등록된 공지사항이 없습니다.</NoData>
              )}
            </>
          )}
        </Content>
      </Container>
    </PageLayout>
  );
}

interface AnnouncementSectionProps {
  tag: string;
  title: string;
  contents: string;
}

function AnnouncementSection({ tag, title, contents }: AnnouncementSectionProps) {
  const [isOpened, setIsOpened] = useState(false);

  const handleClick = () => {
    setIsOpened((prev) => !prev);
  };

  // URL을 링크로 변환하는 함수
  const convertUrlsToLinks = (text: string) => {
    if (!text) return "";

    // URL을 찾기 위한 정규식 패턴
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // 텍스트를 줄바꿈으로 분리
    const parts = text.split("\n");
    
    // 각 줄에 대해 URL을 링크로 변환
    return parts.map((part, index) => {
      const linkifiedPart = part.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      });
      
      return (
        <React.Fragment key={index}>
          <span dangerouslySetInnerHTML={{ __html: linkifiedPart }} />
          {index < parts.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <Root>
      <Tag>{tag}</Tag>
      <Section onClick={handleClick}>
        <Title>{title}</Title>
        <Button isOpened={isOpened} />
      </Section>
      <Contents isOpened={isOpened}>
        {convertUrlsToLinks(contents)}
      </Contents>
    </Root>
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
  padding: 16px 8px;
  background-color: #fff;
  position: relative;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 16px 0 0 0;
  text-align: center;
  letter-spacing: -0.48px;
  color: #000;
`;

const Content = styled.main`
  padding: 20px;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 16px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #333;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.div`
  width: 100%;
  text-align: center;
  padding: 20px;
  color: #777;
  font-size: 16px;
`;

const AnnouncementList = styled.ul`
  width: 100%;
  display: flex;
  flex-direction: column;
  list-style: none;
  gap: 12px;
  margin: 0;
  padding: 0;
  
  li {
    width: 100%;
    &:last-child {
      border: none;
    }
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 24px;
  gap: 16px;
`;

const PaginationButton = styled.button`
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    background-color: #f5f5f5;
  }
`;

const PageInfo = styled.span`
  font-size: 14px;
  color: #666;
`;

const NoData = styled.div`
  width: 100%;
  text-align: center;
  padding: 20px;
  color: #777;
  font-size: 16px;
`;

const Root = styled.li`
  border-bottom: 1px solid #000000;
  width: 80vw;
  padding-bottom: 14px;
  padding-top: 14px;
  
  @media (min-width: 58.75rem) {
    width: 100%;
    max-width: 550px;
    padding-bottom: 20px;
  }
`;

const Section = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  width: 100%;
  padding-top: 12px;
`;

const Tag = styled.span`
  color: #838383;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-wanted);
  letter-spacing: -0.24px;
  margin-bottom: 4px;
  display: block;
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  padding: 0;
  color: #000;
  word-break: keep-all;
  overflow-wrap: break-word;
  white-space: normal;
  letter-spacing: -0.32px;
  line-height: 1.4;
`;

const ArrowUpAnimation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(180deg);
  }
`;

const ArrowDownAnimation = keyframes`
  from {
    transform: rotate(180deg);
  }
  to {
    transform: rotate(0deg);
  }
`;

const Button = styled.button<{ isOpened: boolean }>`
  outline: inherit;
  background: no-repeat url("/plus.svg");
  cursor: pointer;
  width: 16px;
  height: 16px;
  animation: ${({ isOpened }) =>
    isOpened ? ArrowUpAnimation : ArrowDownAnimation} 0.3s forwards;
  -moz-animation: ${({ isOpened }) =>
    isOpened ? ArrowUpAnimation : ArrowDownAnimation} 0.3s forwards;
  -webkit-animation: ${({ isOpened }) =>
    isOpened ? ArrowUpAnimation : ArrowDownAnimation} 0.3s forwards;
  -o-animation: ${({ isOpened }) =>
    isOpened ? ArrowUpAnimation : ArrowDownAnimation} 0.3s forwards;
  color: inherit;
`;

const Contents = styled.div<{ isOpened: boolean }>`
  overflow: hidden;
  padding-top: 14px;
  white-space: pre-line;
  color: black;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.28px;
  line-height: 21px;
  padding-left: 8px;
  padding-right: 8px;

  ${({ isOpened }) =>
    isOpened
      ? `
          transition: max-height 0.2s ease-in;
          max-height: 3500px;
          opacity: 1;
          @media screen and (max-width: 80rem) {
            max-height: 5000px;
          }
        `
      : `
          transition: max-height 0.15s ease-out, opacity 0.15s ease-out;
          max-height: 0;
          opacity: 0;
        `}
        
  a {
    color: #0066cc;
    text-decoration: underline;
    font-weight: 500;
    transition: color 0.2s;
    
    &:hover {
      color: #004499;
      text-decoration: underline;
    }
    
    &:visited {
      color: #551A8B;
    }
  }
`; 