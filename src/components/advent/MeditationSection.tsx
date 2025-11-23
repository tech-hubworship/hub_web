import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import { AdventComment } from '@src/lib/advent/types';
import { getDayNumber } from '@src/lib/advent/utils';

const SectionCard = styled.div`
  background: #000000;
  padding: 0 40px 40px 40px;
  color: #ffffff;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  margin-top: 0;

  @media (max-width: 1024px) {
    padding: 0 32px 32px 32px;
  }

  @media (max-width: 768px) {
    padding: 0 24px 24px 24px;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
`;

const LogoWrapper = styled.div`
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

const TitleText = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const SubtitleText = styled.div`
  font-size: 16px;
  font-weight: 400;
  color: #ffffff;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const CommentForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const CommentInput = styled.textarea`
  width: 100%;
  padding: 16px;
  border: 2px solid #ffffff;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  background: #1a1a1a;
  color: #ffffff;
  max-length: 300;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #CEB2FF;
  }

  &:disabled {
    background: #2a2a2a;
    border-color: #4B4B4B;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    min-height: 100px;
    font-size: 15px;
    padding: 12px;
  }
`;

const CharacterCount = styled.div`
  font-size: 14px;
  color: #9ca3af;
  align-self: flex-end;
  margin-top: -8px;
`;

const SubmitButton = styled.button`
  padding: 16px 48px;
  background: #ffffff;
  color: #000000;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 160px;

  &:hover {
    background: #f0f0f0;
    transform: translateY(-2px);
  }

  &:disabled {
    background: #4B4B4B;
    color: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 14px 32px;
  }
`;

const MeditationList = styled.div`
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

const MeditationPostIt = styled.div<{ colorIndex: number }>`
  position: relative;
  padding: 20px;
  border-radius: 8px;
  min-height: 180px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  text-align: left;

  &:hover {
    transform: scale(1.05);
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
    padding: 16px;
    min-height: 160px;
  }
`;

const MeditationHeader = styled.div`
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  text-align: left;
`;

const MeditationTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.5;
  text-align: left;
`;

const MeditationContent = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: #1a1a1a;
  white-space: pre-wrap;
  word-break: break-word;
  flex: 1;
  text-align: left;
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

const ButtonWrapper = styled.div`
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

const LoadMoreButton = styled.button`
  padding: 12px 32px;
  background: transparent;
  color: #ffffff;
  border: 2px solid #ffffff;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 24px;
  width: 100%;
  max-width: 200px;
  margin-left: auto;
  margin-right: auto;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 10px 24px;
    font-size: 14px;
  }
`;

interface MeditationSectionProps {
  comments: AdventComment[];
  commentText: string;
  submitting: boolean;
  isLoggedIn: boolean;
  showMyMeditation: boolean;
  hasMore: boolean;
  onCommentTextChange: (text: string) => void;
  onCommentSubmit: (e: React.FormEvent) => void;
  onToggleMyMeditation: () => void;
  onLoadMore: () => void;
}

export const MeditationSection: React.FC<MeditationSectionProps> = ({
  comments,
  commentText,
  submitting,
  isLoggedIn,
  showMyMeditation,
  hasMore,
  onCommentTextChange,
  onCommentSubmit,
  onToggleMyMeditation,
  onLoadMore,
}) => {
  const router = useRouter();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 300) {
      onCommentTextChange(text);
    }
  };

  const handleLoginRedirect = () => {
    const currentPath = router.asPath;
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  return (
    <SectionCard>
      <ContentWrapper>
        <LogoWrapper>
          <img src="/icons/chat1.svg" alt="chat icon" />
        </LogoWrapper>
        
        <TitleText>이번 영상에 대해</TitleText>
        <SubtitleText>짧게 묵상을 나누어보세요.</SubtitleText>

        {isLoggedIn && (
          <ButtonWrapper>
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

        {isLoggedIn ? (
          <CommentForm onSubmit={onCommentSubmit}>
            <CommentInput
              value={commentText}
              onChange={handleTextChange}
              placeholder="묵상을 입력해주세요..."
              maxLength={300}
            />
            <CharacterCount>
              {commentText.length}/300
            </CharacterCount>
            <SubmitButton type="submit" disabled={submitting || !commentText.trim()}>
              {submitting ? '올리는 중...' : '묵상올리기'}
            </SubmitButton>
          </CommentForm>
        ) : (
          <CommentForm onSubmit={(e) => {
            e.preventDefault();
            handleLoginRedirect();
          }}>
            <CommentInput
              placeholder="로그인이 필요합니다."
              disabled
            />
            <CharacterCount>0/300</CharacterCount>
            <SubmitButton 
              type="button"
              onClick={handleLoginRedirect}
            >
              로그인 필요
            </SubmitButton>
          </CommentForm>
        )}

        <MeditationList>
          {comments.length === 0 ? (
            <EmptyState>
              {showMyMeditation ? '아직 작성한 묵상이 없습니다.' : '아직 묵상이 없습니다. 첫 번째 묵상을 나눠보세요!'}
            </EmptyState>
          ) : (
            comments.map((comment, index) => {
              const dayNumber = getDayNumber(comment.post_dt);
              const userName = comment.user_name || comment.reg_id;
              const dayText = dayNumber ? `${dayNumber}일차 묵상` : '묵상';
              return (
                <MeditationPostIt key={comment.comment_id} colorIndex={index}>
                  <MeditationHeader>
                    <MeditationTitle>{userName}님의 {dayText}</MeditationTitle>
                  </MeditationHeader>
                  <MeditationContent>{comment.content}</MeditationContent>
                </MeditationPostIt>
              );
            })
          )}
        </MeditationList>

        {!showMyMeditation && hasMore && (
          <LoadMoreButton onClick={onLoadMore}>
            더보기
          </LoadMoreButton>
        )}
      </ContentWrapper>
    </SectionCard>
  );
};
