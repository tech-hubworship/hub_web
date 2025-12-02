import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { AdventComment } from '@src/lib/advent/types';
import { getDayNumber } from '@src/lib/advent/utils';

const SectionCard = styled(motion.div)`
  background: #000000;
  padding: 0 40px 40px 40px;
  color: #ffffff;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  margin-top: 0;
  will-change: transform, opacity;

  @media (max-width: 1024px) {
    padding: 0 32px 32px 32px;
  }

  @media (max-width: 768px) {
    padding: 0 24px 24px 24px;
  }
`;

const ContentWrapper = styled(motion.div)`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
`;

const LogoWrapper = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0;
  margin-bottom: 24px;

  img {
    width: 48px;
    height: 48px;

    @media (max-width: 768px) {
      width: 40px;
      height: 40px;
    }
  }
`;

const TitleText = styled(motion.div)`
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const SubtitleText = styled(motion.div)`
  font-size: 16px;
  font-weight: 400;
  color: #ffffff;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const MeditationList = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-top: 32px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const MeditationPostIt = styled(motion.div)<{ colorIndex: number }>`
  position: relative;
  padding: 16px;
  border-radius: 8px;
  min-height: 140px;
  max-height: 160px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  text-align: left;
  overflow: hidden;
  will-change: transform, opacity;

  &:hover {
    transform: scale(1.03);
    z-index: 10;
  }

  background: ${props => {
    const colors = ['#FFFFFF', '#EE9EEA', '#A479EE', '#CEB2FF'];
    return colors[props.colorIndex % colors.length];
  }};
  color: ${props => {
    const colors = ['#FFFFFF', '#EE9EEA', '#A479EE', '#CEB2FF'];
    return colors[props.colorIndex % colors.length] === '#FFFFFF' ? '#000000' : '#000000';
  }};

  @media (max-width: 768px) {
    padding: 12px;
    min-height: 120px;
    max-height: 140px;
  }
`;

const MeditationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  gap: 4px;
`;

const MeditationTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
  text-align: left;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const MeditationAffiliation = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  line-height: 1.4;
  text-align: right;
  word-break: keep-all;

  @media (max-width: 768px) {
    font-size: 10px;
  }
`;

const MeditationContent = styled.div`
  font-size: 13px;
  line-height: 1.5;
  color: #1a1a1a;
  white-space: pre-wrap;
  word-break: break-word;
  flex: 1;
  text-align: left;
  overflow: hidden;

  @media (max-width: 768px) {
    font-size: 12px;
    line-height: 1.4;
  }
`;

const MoreIndicator = styled.span`
  color: #6b7280;
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #9ca3af;
  padding: 60px 20px;
  font-size: 18px;
  grid-column: 1 / -1;

  @media (max-width: 768px) {
    padding: 40px 16px;
    font-size: 16px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  grid-column: 1 / -1;
  
  img {
    width: 48px;
    height: 66px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.4;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  @media (max-width: 768px) {
    padding: 40px 16px;
  }
`;

const ButtonWrapper = styled(motion.div)`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const ToggleButton = styled.button<{ active: boolean }>`
  padding: 12px 24px;
  background: ${props => props.active ? '#CEB2FF' : 'transparent'};
  color: ${props => props.active ? '#000000' : '#ffffff'};
  border: 2px solid #CEB2FF;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? '#CEB2FF' : 'rgba(206, 178, 255, 0.2)'};
  }

  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 14px;
  }
`;

// 페이징 스타일
const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 32px;
  flex-wrap: wrap;
`;

const PageButton = styled.button<{ active?: boolean }>`
  min-width: 40px;
  height: 40px;
  padding: 8px 12px;
  background: ${props => props.active ? '#CEB2FF' : 'transparent'};
  color: ${props => props.active ? '#000000' : '#ffffff'};
  border: 2px solid ${props => props.active ? '#CEB2FF' : '#ffffff'};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.active ? '#CEB2FF' : 'rgba(255, 255, 255, 0.2)'};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    min-width: 36px;
    height: 36px;
    padding: 6px 10px;
    font-size: 12px;
  }
`;

const PageInfo = styled.span`
  color: #ffffff;
  font-size: 14px;
  padding: 0 8px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

// 모달 스타일
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
  padding: 20px;
`;

const ModalContent = styled.div<{ colorIndex: number }>`
  position: relative;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 100000;

  background: ${props => {
    const colors = ['#FFFFFF', '#EE9EEA', '#A479EE', '#CEB2FF'];
    return colors[props.colorIndex % colors.length];
  }};

  @media (max-width: 768px) {
    padding: 24px;
    max-height: 70vh;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.1);
`;

const ModalTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const ModalAffiliation = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  margin-top: 4px;
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  color: #1a1a1a;
  flex-shrink: 0;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
`;

const ModalBody = styled.div`
  font-size: 16px;
  line-height: 1.8;
  color: #1a1a1a;
  white-space: pre-wrap;
  word-break: break-word;

  @media (max-width: 768px) {
    font-size: 15px;
    line-height: 1.7;
  }
`;

interface MeditationSectionProps {
  comments: AdventComment[];
  totalComments: number;
  currentPage: number;
  isLoggedIn: boolean;
  showMyMeditation: boolean;
  loading: boolean;
  onToggleMyMeditation: () => void;
  onPageChange: (page: number) => void;
}

export const MeditationSection: React.FC<MeditationSectionProps> = ({
  comments,
  totalComments,
  currentPage,
  isLoggedIn,
  showMyMeditation,
  loading,
  onToggleMyMeditation,
  onPageChange,
}) => {
  const [selectedComment, setSelectedComment] = useState<AdventComment | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // 화면 크기 및 가로 모드 감지
  useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width <= 768);
      setIsLandscape(width > height);
      // 작은 화면: 높이가 600px 이하이거나 너비가 400px 이하
      setIsSmallScreen(height <= 600 || width <= 400);
    };
    
    checkScreen();
    window.addEventListener('resize', checkScreen);
    window.addEventListener('orientationchange', checkScreen);
    return () => {
      window.removeEventListener('resize', checkScreen);
      window.removeEventListener('orientationchange', checkScreen);
    };
  }, []);

  const itemsPerPage = isMobile ? 10 : 20;
  const totalPages = Math.ceil(totalComments / itemsPerPage);

  // 100자 제한 함수
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength);
  };

  // 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = isMobile ? 5 : 7;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const half = Math.floor(maxVisiblePages / 2);
      let start = currentPage - half;
      let end = currentPage + half;

      if (start < 1) {
        start = 1;
        end = maxVisiblePages;
      }
      if (end > totalPages) {
        end = totalPages;
        start = totalPages - maxVisiblePages + 1;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.08,
        delayChildren: 0.1,
        ease: "easeOut"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const postItVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <SectionCard
      initial={isLandscape || isSmallScreen ? "visible" : "hidden"}
      animate={isLandscape || isSmallScreen ? "visible" : undefined}
      whileInView={isLandscape || isSmallScreen ? undefined : "visible"}
      viewport={isLandscape || isSmallScreen ? undefined : { once: true, margin: "-200px", amount: 0.3 }}
      variants={containerVariants}
    >
      <ContentWrapper>
        <LogoWrapper variants={itemVariants}>
          <img src="/icons/chat1.svg" alt="chat icon" />
        </LogoWrapper>
        
        <TitleText variants={itemVariants}>
          다른 지체들의 묵상
        </TitleText>
        <SubtitleText variants={itemVariants}>
          함께 나눈 묵상을 확인해보세요.
        </SubtitleText>

        {isLoggedIn && (
          <ButtonWrapper variants={itemVariants}>
            <ToggleButton 
              active={!showMyMeditation}
              onClick={onToggleMyMeditation}
            >
              전체 묵상
            </ToggleButton>
            <ToggleButton 
              active={showMyMeditation}
              onClick={onToggleMyMeditation}
            >
              내 묵상 보기
            </ToggleButton>
          </ButtonWrapper>
        )}

        <MeditationList 
          key={`meditation-list-${showMyMeditation ? 'my' : 'all'}-${comments.length}`}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {loading ? (
            <LoadingContainer>
              <img src="/icons/advent_logo.svg" alt="loading" />
            </LoadingContainer>
          ) : comments.length === 0 ? (
            <EmptyState>
              {showMyMeditation ? '아직 작성한 묵상이 없습니다.' : '아직 묵상이 없습니다. 첫 번째 묵상을 나눠보세요!'}
            </EmptyState>
          ) : (
            comments.map((comment, index) => {
              const dayNumber = getDayNumber(comment.post_dt);
              const userName = comment.user_name || '익명';
              const userAffiliation = comment.user_affiliation || '';
              const dayText = dayNumber ? `${dayNumber}일차 묵상` : '묵상';
              const isLong = comment.content.length > 100;
              // comment_id를 기반으로 색상 결정 (각 댓글마다 고유한 색상)
              const colorIdx = comment.comment_id % 4;
              
              return (
                <MeditationPostIt
                  key={comment.comment_id} 
                  colorIndex={colorIdx}
                  variants={postItVariants}
                  onTap={() => setSelectedComment(comment)}
                  style={{ cursor: 'pointer' }}
                >
                  <MeditationHeader>
                    <MeditationTitle>{userName}님의 {dayText}</MeditationTitle>
                    {userAffiliation && <MeditationAffiliation>{userAffiliation}</MeditationAffiliation>}
                  </MeditationHeader>
                  <MeditationContent>
                    {truncateContent(comment.content)}
                    {isLong && <MoreIndicator>...</MoreIndicator>}
                  </MeditationContent>
                </MeditationPostIt>
              );
            })
          )}
        </MeditationList>

        {/* 페이징 (내 묵상은 페이징 없음) */}
        {!showMyMeditation && totalPages > 1 && (
          <PaginationWrapper>
            <PageButton 
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ◀
            </PageButton>
            
            {getPageNumbers().map(page => (
              <PageButton
                key={page}
                active={page === currentPage}
                onClick={() => onPageChange(page)}
              >
                {page}
              </PageButton>
            ))}
            
            <PageButton 
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              ▶
            </PageButton>
            
            <PageInfo>
              ({currentPage} / {totalPages})
            </PageInfo>
          </PaginationWrapper>
        )}
      </ContentWrapper>

      {/* 모달 - Portal을 사용하여 body에 직접 렌더링 */}
      {selectedComment && typeof window !== 'undefined' && createPortal(
        <ModalOverlay onClick={() => setSelectedComment(null)}>
          <ModalContent 
            colorIndex={selectedComment.comment_id % 4}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <div>
                <ModalTitle>
                  {selectedComment.user_name || '익명'}님의 {getDayNumber(selectedComment.post_dt) ? `${getDayNumber(selectedComment.post_dt)}일차 묵상` : '묵상'}
                </ModalTitle>
                {selectedComment.user_affiliation && (
                  <ModalAffiliation>{selectedComment.user_affiliation}</ModalAffiliation>
                )}
              </div>
              <CloseButton onClick={() => setSelectedComment(null)}>✕</CloseButton>
            </ModalHeader>
            <ModalBody>{selectedComment.content}</ModalBody>
          </ModalContent>
        </ModalOverlay>,
        document.body
      )}
    </SectionCard>
  );
};
