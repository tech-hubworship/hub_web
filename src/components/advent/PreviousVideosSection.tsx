import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { PreviousPost } from '@src/lib/advent/types';

const SectionCard = styled(motion.div)`
  background: #6940B0;
  padding: 40px;
  text-align: center;
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

const SectionTitle = styled(motion.h2)`
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  line-height: 1.4;
  width: 100%;

  @media (max-width: 1024px) {
    font-size: 28px;
  }

  @media (min-width: 769px) {
    flex-direction: row;
    gap: 8px;
    justify-content: center;
  }

  @media (max-width: 768px) {
    font-size: 24px;
    margin-bottom: 20px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
  }

  span {
    text-align: center;
  }
`;

const PreviousVideosGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
    margin-top: 20px;
  }
`;

const VideoCard = styled(motion.div)`
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    border-radius: 8px;
  }
`;

const VideoThumbnail = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background: #000;
  overflow: hidden;

  &:hover > div:last-child {
    background: rgba(102, 126, 234, 0.9);
    transform: translate(-50%, -50%) scale(1.1);
  }
`;

const VideoThumbnailImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PlayIconOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.3s ease;
  z-index: 1;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }
`;

const VideoCardContent = styled.div`
  padding: 16px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const VideoCardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 6px;
  }
`;

const VideoCardDate = styled.div`
  font-size: 14px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const LoadingText = styled.div`
  text-align: center;
  color: #6b7280;
  font-size: 18px;
  padding: 40px;

  @media (max-width: 768px) {
    font-size: 16px;
    padding: 32px 20px;
  }
`;

const YouTubeChannelButtonBase = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 40px;
  background: #ffffff;
  color: #000000;
  text-decoration: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #f0f0f0;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 16px 32px;
    font-size: 16px;
    max-width: 100%;
  }
`;

const YouTubeChannelButton = motion(YouTubeChannelButtonBase);

const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #000000;
`;

interface PreviousVideosSectionProps {
  previousPosts: PreviousPost[];
  loading: boolean;
  onVideoClick: (date: string) => void;
}

export const PreviousVideosSection: React.FC<PreviousVideosSectionProps> = ({
  previousPosts,
  loading,
  onVideoClick,
}) => {
  const YOUTUBE_PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLoPlKRWMoWwOoqAvlzXibGmxsaCrJn2YB';

  const containerVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        staggerChildren: 0.15,
        delayChildren: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.9,
        ease: [0.34, 1.56, 0.64, 1]
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.7, rotate: -5 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.8,
        type: "spring",
        stiffness: 150,
        damping: 20,
        ease: [0.34, 1.56, 0.64, 1]
      }
    },
    hover: {
      scale: 1.08,
      y: -10,
      rotate: 2,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.7, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        type: "spring",
        stiffness: 200,
        damping: 15,
        ease: [0.34, 1.56, 0.64, 1]
      }
    },
    hover: {
      scale: 1.1,
      y: -5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  return (
    <SectionCard
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-200px" }}
      variants={containerVariants}
    >
      <SectionTitle variants={itemVariants}>
        <span>지난 묵상 영상도</span>
        <span>다시볼수있어요</span>
      </SectionTitle>
      <YouTubeChannelButton
        variants={buttonVariants}
        whileHover="hover"
        href={YOUTUBE_PLAYLIST_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ButtonContent>
          <Play size={24} fill="#000000" color="#000000" />
          <span>허브 유튜브 채널 {'->'}</span>
        </ButtonContent>
      </YouTubeChannelButton>
    </SectionCard>
  );
};

