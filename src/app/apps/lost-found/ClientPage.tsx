"use client";

import React, { useState } from "react";
import styled from "@emotion/styled";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { X, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import dynamic from "next/dynamic";
import { Header } from "@src/components/Header";

const Footer = dynamic(() => import("@src/components/Footer"), { ssr: true });

export interface LostFoundPost {
  id: number;
  post_date: string;
  image_urls: string[];
  memo: string | null;
  created_at: string;
}

const Container = styled.div`
  min-height: 100vh;
  background: #f5f6fa;
  padding-bottom: 80px;
`;

const AppHeader = styled.div`
  padding: 100px 24px 24px;
  text-align: left;

  @media (max-width: 768px) {
    padding: 60px 20px 20px;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #191f28;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Subtitle = styled.p`
  font-size: 15px;
  color: #8b95a1;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const FeedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 0 24px;
  max-width: 900px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding: 0 16px;
  }
`;

const PostCard = styled(motion.div)`
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  border: none;
  padding: 0;
  cursor: pointer;
  background: #e8eaef;
  position: relative;

  &:focus-visible {
    outline: 2px solid #3182f6;
    outline-offset: 2px;
  }
`;

const PostThumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const PostThumbPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b95a1;
  font-size: 12px;
`;

const DateBadge = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const EmptyState = styled.div`
  padding: 48px 24px;
  text-align: center;
  color: #8b95a1;
  font-size: 15px;
`;

const BackdropClickArea = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  cursor: pointer;
`;

const ContentClickArea = styled.div`
  pointer-events: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  padding: 24px;
`;

const ModalBackdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const ModalContent = styled(motion.div)`
  background: #fff;
  border-radius: 16px;
  max-width: 520px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalImages = styled.div`
  display: flex;
  gap: 0;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;

  & > * {
    scroll-snap-align: start;
    min-width: 100%;
  }
`;

const ModalImage = styled.img`
  width: 100%;
  display: block;
  vertical-align: top;
  max-height: 60vh;
  object-fit: contain;
  background: #f0f0f0;
`;

const ModalBody = styled.div`
  padding: 16px 20px 24px;
  flex-shrink: 0;
`;

const ModalDate = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #191f28;
  margin-bottom: 8px;
`;

const ModalMemo = styled.p`
  font-size: 14px;
  color: #4e5968;
  margin: 0;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: #191f28;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;

  &:hover {
    background: #fff;
  }
`;

export default function LostFoundClientPage() {
  const [selectedPost, setSelectedPost] = useState<LostFoundPost | null>(null);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: LostFoundPost[] }>({
    queryKey: ["public-lost-found"],
    queryFn: async () => {
      const res = await fetch("/api/public/lost-found");
      if (!res.ok) throw new Error("분실물 목록을 불러오지 못했습니다.");
      return res.json();
    },
  });

  const posts = data?.data ?? [];

  return (
    <>
      <Header />
      <Container>
        <AppHeader>
          <Title>분실물 찾기</Title>
          <Subtitle>그날 분실물 사진을 확인해 보세요</Subtitle>
        </AppHeader>

        {isLoading && (
          <EmptyState>불러오는 중...</EmptyState>
        )}
        {error && (
          <EmptyState>목록을 불러오는데 실패했습니다. 잠시 후 다시 시도해 주세요.</EmptyState>
        )}
        {!isLoading && !error && posts.length === 0 && (
          <EmptyState>아직 등록된 분실물 사진이 없습니다.</EmptyState>
        )}
        {!isLoading && !error && posts.length > 0 && (
          <FeedGrid>
            {posts.map((post) => (
              <div
                key={post.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPost(post)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedPost(post)}
                style={{ cursor: "pointer" }}
              >
                <PostCard layoutId={undefined} whileTap={{ scale: 0.98 }}>
                  {post.image_urls?.[0] ? (
                    <>
                      <PostThumb
                        src={post.image_urls[0]}
                        alt={`${post.post_date} 분실물`}
                        loading="lazy"
                      />
                      <DateBadge>
                        <Calendar size={12} />
                        {format(new Date(post.post_date), "yyyy년 M월 d일 (EEE)", { locale: ko })}
                      </DateBadge>
                    </>
                  ) : (
                    <PostThumbPlaceholder>이미지 없음</PostThumbPlaceholder>
                  )}
                </PostCard>
              </div>
            ))}
          </FeedGrid>
        )}
      </Container>

      <AnimatePresence>
        {selectedPost && (
          <BackdropClickArea onClick={() => setSelectedPost(null)}>
            <ModalBackdrop
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ pointerEvents: "none" }}
            >
              <ContentClickArea onClick={(e) => e.stopPropagation()}>
                <ModalContent
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                <CloseButton type="button" onClick={() => setSelectedPost(null)} aria-label="닫기">
                  <X size={20} />
                </CloseButton>
                <ModalImages>
                  {(selectedPost.image_urls ?? []).map((url, i) => (
                    <ModalImage
                      key={i}
                      src={url}
                      alt={`${selectedPost.post_date} 분실물 ${i + 1}`}
                    />
                  ))}
                </ModalImages>
                <ModalBody>
                  <ModalDate>
                    <Calendar size={18} />
                    {format(new Date(selectedPost.post_date), "yyyy년 M월 d일 (EEEE)", { locale: ko })}
                  </ModalDate>
                  {selectedPost.memo && (
                    <ModalMemo>{selectedPost.memo}</ModalMemo>
                  )}
                </ModalBody>
                </ModalContent>
              </ContentClickArea>
            </ModalBackdrop>
          </BackdropClickArea>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
