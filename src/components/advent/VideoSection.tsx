import React from 'react';
import styled from '@emotion/styled';
import { AdventPost } from '@src/lib/advent/types';
import { getYouTubeEmbedUrl, getDayNumber, formatDate, getYouTubeWatchUrl } from '@src/lib/advent/utils';

const SectionCard = styled.div`
  background: #E3D2FF;
  padding: 40px;
  border-bottom: 1px solid #f3f4f6;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);

  @media (max-width: 1024px) {
    padding: 32px;
  }

  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-family: 'Wanted Sans', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 8px;
  line-height: 37px;
  letter-spacing: -0.56px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  @media (max-width: 768px) {
    font-size: 28px;
    line-height: 32px;
    margin-bottom: 6px;
  }
`;

const SectionSubtitle = styled.div`
  font-family: 'Wanted Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #6b7280;
  line-height: 37px;
  letter-spacing: -0.32px;
  text-align: center;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 20px;
  }
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  margin-bottom: 24px;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const ThumbnailImage = styled.img`
  width: 100%;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const PostContent = styled.div`
  font-size: 18px;
  line-height: 1.8;
  color: #374151;
  white-space: pre-wrap;

  @media (max-width: 768px) {
    font-size: 16px;
    line-height: 1.7;
  }
`;

const YouTubeLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  font-family: 'Wanted Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 100%;
  letter-spacing: -0.24px;
  text-align: center;
  color: #000000;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #333333;
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    font-size: 16px;
    margin-top: 20px;
  }
`;

interface VideoSectionProps {
  post: AdventPost;
  currentDate: string;
}

export const VideoSection: React.FC<VideoSectionProps> = ({ post, currentDate }) => {
  const dayNumber = getDayNumber(currentDate);
  const formattedDate = formatDate(currentDate);
  const youtubeWatchUrl = getYouTubeWatchUrl(post.video_url);

  const handleYouTubeLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!youtubeWatchUrl) {
      e.preventDefault();
      return;
    }
    window.open(youtubeWatchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <SectionCard>
      <ContentWrapper>
        <SectionTitle>대림절 3분 묵상</SectionTitle>
        <SectionSubtitle>
          {dayNumber && `${dayNumber}일차`} / {formattedDate}
        </SectionSubtitle>
        
        {post.thumbnail_url && !post.video_url && (
          <ThumbnailImage 
            src={post.thumbnail_url} 
            alt={post.title}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {post.video_url && getYouTubeEmbedUrl(post.video_url) && (
          <>
            <VideoContainer>
              <iframe
                src={getYouTubeEmbedUrl(post.video_url) || ''}
                title={post.title.replace(/advent/gi, '').replace(/test/gi, '').trim()}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </VideoContainer>
            {youtubeWatchUrl && (
              <YouTubeLink 
                href={youtubeWatchUrl}
                onClick={handleYouTubeLinkClick}
              >
                허브 유튜브로 이동하기 →
              </YouTubeLink>
            )}
          </>
        )}

      </ContentWrapper>
    </SectionCard>
  );
};

