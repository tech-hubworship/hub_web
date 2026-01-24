"use client";

import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, TrendingUp, X, Link2 } from "lucide-react";
import dynamic from "next/dynamic";

const Footer = dynamic(() => import("@src/components/Footer"), { ssr: true });

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(160deg, #f7f8fb 0%, #eff2f8 50%, #e0e7ff 100%);
  padding: 44px 20px 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow-x: hidden;
`;

const Title = styled.h1`
  font-size: 38px;
  font-weight: 800;
  color: #1f2a5c;
  text-align: center;
  margin-bottom: 8px;
  letter-spacing: -0.01em;

  @media (max-width: 768px) {
    font-size: 26px;
  }
`;

const Subtitle = styled.p`
  font-size: 17px;
  color: rgba(31, 42, 92, 0.7);
  text-align: center;
  margin-bottom: 30px;
  max-width: 460px;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 22px;
  }
`;

const SearchContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin-bottom: 32px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 20px 16px 52px;
  border: 2px solid rgba(31, 42, 92, 0.12);
  border-radius: 16px;
  font-size: 16px;
  background: #ffffff;
  color: #1f2a5c;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  @media (max-width: 768px) {
    padding: 12px 16px 12px 44px;
    font-size: 14px;
    border-radius: 12px;
  }

  &:focus {
    outline: none;
    border-color: #0066ff;
    box-shadow: 0 4px 16px rgba(0, 102, 255, 0.12);
  }

  &::placeholder {
    color: rgba(31, 42, 92, 0.4);
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(31, 42, 92, 0.4);
  width: 20px;
  height: 20px;
`;

const CategoryFilter = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 32px;
  width: 100%;
  max-width: 600px;

  @media (max-width: 768px) {
    gap: 8px;
    margin-bottom: 24px;
    padding: 0 8px;
  }
`;

const CategoryButton = styled.button<{ $active: boolean }>`
  padding: 10px 20px;
  border-radius: 20px;
  border: 2px solid ${(props) => (props.$active ? "#0066ff" : "rgba(31, 42, 92, 0.12)")};
  background: ${(props) => (props.$active ? "#0066ff" : "#ffffff")};
  color: ${(props) => (props.$active ? "#ffffff" : "#1f2a5c")};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 13px;
  }

  &:hover {
    border-color: #0066ff;
    transform: translateY(-1px);
  }
`;

const TermsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 0 8px;
  }
`;

const TermCard = styled(motion.div)`
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 12px;
  }

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 102, 255, 0.12);
    border-color: rgba(0, 102, 255, 0.2);
    transform: translateY(-2px);
  }
`;

const TermHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const TermName = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #1f2a5c;
  margin: 0;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const CategoryBadge = styled.span<{ $category: string }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${(props) => {
    switch (props.$category) {
      case "신앙":
        return "rgba(0, 102, 255, 0.1)";
      case "공동체":
        return "rgba(16, 185, 129, 0.1)";
      case "행사":
        return "rgba(245, 158, 11, 0.1)";
      case "조직":
        return "rgba(236, 72, 153, 0.1)";
      default:
        return "rgba(139, 92, 246, 0.1)";
    }
  }};
  color: ${(props) => {
    switch (props.$category) {
      case "신앙":
        return "#0066ff";
      case "공동체":
        return "#10b981";
      case "행사":
        return "#f59e0b";
      case "조직":
        return "#ec4899";
      default:
        return "#8b5cf6";
    }
  }};
`;

const TermDefinition = styled.p`
  font-size: 15px;
  color: rgba(31, 42, 92, 0.7);
  line-height: 1.6;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: 768px) {
    font-size: 14px;
    -webkit-line-clamp: 2;
  }
`;

const TermExample = styled.div`
  font-size: 13px;
  color: rgba(31, 42, 92, 0.5);
  font-style: italic;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(31, 42, 92, 0.08);
`;

const TermSchedule = styled.div`
  font-size: 13px;
  color: rgba(0, 102, 255, 0.8);
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
`;

const TermLocation = styled.div`
  font-size: 13px;
  color: rgba(16, 185, 129, 0.8);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
`;

const PopularTerms = styled.div`
  width: 100%;
  max-width: 1200px;
  margin-bottom: 32px;
`;

const PopularTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #1f2a5c;
  margin-bottom: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: rgba(31, 42, 92, 0.5);
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(7, 15, 32, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
  overflow-y: auto;
`;

const Modal = styled(motion.div)`
  background: #ffffff;
  border-radius: 24px;
  padding: 32px;
  max-width: 700px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 32px 72px rgba(15, 31, 74, 0.18);

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 16px;
    max-height: 90vh;
    margin: 16px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #1f2a5c;
  margin: 0;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 22px;
  }
`;

const CloseButton = styled.button`
  padding: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: rgba(31, 42, 92, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(31, 42, 92, 0.08);
    color: #1f2a5c;
  }
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #1f2a5c;
  margin: 0;
`;

const SectionContent = styled.div`
  font-size: 15px;
  color: rgba(31, 42, 92, 0.8);
  line-height: 1.7;
`;

const RelatedTerms = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const RelatedTermTag = styled.button`
  padding: 6px 14px;
  border-radius: 12px;
  border: 1px solid rgba(0, 102, 255, 0.2);
  background: rgba(0, 102, 255, 0.05);
  color: #0066ff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 102, 255, 0.1);
    border-color: #0066ff;
  }
`;

interface Term {
  id: number;
  term_name: string;
  category: string;
  definition: string;
  example?: string;
  schedule?: string;
  location?: string;
  related_terms?: number[];
  search_count?: number;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ["전체", "신앙", "공동체", "행사", "기타", "조직"];

export default function ClientPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [popularTerms, setPopularTerms] = useState<Term[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [relatedTerms, setRelatedTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTerms();
    fetchPopularTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const response = await fetch("/api/glossary/search");
      const data = await response.json();
      if (response.ok) {
        setTerms(data.terms || []);
      }
    } catch (error) {
      console.error("용어 목록 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularTerms = async () => {
    try {
      const response = await fetch("/api/glossary/popular");
      const data = await response.json();
      if (response.ok) {
        setPopularTerms(data.terms || []);
      }
    } catch (error) {
      console.error("인기 용어 조회 오류:", error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (selectedCategory !== "전체") params.append("category", selectedCategory);

      const response = await fetch(`/api/glossary/search?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setTerms(data.terms || []);
      }
    } catch (error) {
      console.error("검색 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTermClick = async (term: Term) => {
    setSelectedTerm(term);
    // 검색 카운트 증가
    try {
      await fetch(`/api/glossary/${term.id}`, { method: "POST" });
    } catch (error) {
      console.error("조회 카운트 증가 오류:", error);
    }

    // 관련 용어 가져오기
    if (term.related_terms && term.related_terms.length > 0) {
      try {
        const response = await fetch(
          `/api/glossary/related?ids=${term.related_terms.join(",")}`
        );
        const data = await response.json();
        if (response.ok) {
          setRelatedTerms(data.terms || []);
        }
      } catch (error) {
        console.error("관련 용어 조회 오류:", error);
      }
    } else {
      setRelatedTerms([]);
    }
  };

  const handleRelatedTermClick = async (termId: number) => {
    try {
      const response = await fetch(`/api/glossary/${termId}`);
      const data = await response.json();
      if (response.ok && data.term) {
        handleTermClick(data.term);
      }
    } catch (error) {
      console.error("관련 용어 상세 조회 오류:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery || selectedCategory !== "전체") {
        handleSearch();
      } else {
        fetchTerms();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const filteredTerms = terms.filter((term) => {
    if (selectedCategory !== "전체" && term.category !== selectedCategory) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        term.term_name.toLowerCase().includes(query) ||
        term.definition.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <>
      <Container>
        <Title>📖 허브 용어사전</Title>
        <Subtitle>공동체만의 특별한 용어와 개념을 정리하고 공유하는 사전</Subtitle>

        <SearchContainer>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="용어를 검색해보세요..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
        </SearchContainer>

        <CategoryFilter>
          {CATEGORIES.map((category) => (
            <CategoryButton
              key={category}
              $active={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </CategoryButton>
          ))}
        </CategoryFilter>

        {popularTerms.length > 0 && (
          <PopularTerms>
            <PopularTitle>
              <TrendingUp size={20} />
              인기 용어
            </PopularTitle>
            <TermsGrid>
              {popularTerms.slice(0, 4).map((term) => (
                <TermCard
                  key={term.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onTap={() => handleTermClick(term)}
                >
                  <TermHeader>
                    <TermName>{term.term_name}</TermName>
                    <CategoryBadge $category={term.category}>{term.category}</CategoryBadge>
                  </TermHeader>
                  <TermDefinition>{term.definition}</TermDefinition>
                  {term.schedule && (
                    <TermSchedule>
                      <span>⏰</span>
                      {term.schedule}
                    </TermSchedule>
                  )}
                  {term.location && (
                    <TermLocation>
                      <span>📍</span>
                      {term.location}
                    </TermLocation>
                  )}
                  {term.example && (
                    <TermExample>예: {term.example}</TermExample>
                  )}
                </TermCard>
              ))}
            </TermsGrid>
          </PopularTerms>
        )}

        {loading ? (
          <EmptyState>로딩 중...</EmptyState>
        ) : filteredTerms.length === 0 ? (
          <EmptyState>
            <BookOpen size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
            검색 결과가 없습니다.
          </EmptyState>
        ) : (
          <TermsGrid>
            <AnimatePresence>
              {filteredTerms.map((term) => (
                <TermCard
                  key={term.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onTap={() => handleTermClick(term)}
                >
                  <TermHeader>
                    <TermName>{term.term_name}</TermName>
                    <CategoryBadge $category={term.category}>{term.category}</CategoryBadge>
                  </TermHeader>
                  <TermDefinition>{term.definition}</TermDefinition>
                  {term.schedule && (
                    <TermSchedule>
                      <span>⏰</span>
                      {term.schedule}
                    </TermSchedule>
                  )}
                  {term.location && (
                    <TermLocation>
                      <span>📍</span>
                      {term.location}
                    </TermLocation>
                  )}
                  {term.example && (
                    <TermExample>예: {term.example}</TermExample>
                  )}
                </TermCard>
              ))}
            </AnimatePresence>
          </TermsGrid>
        )}
      </Container>

      <Footer />

      <AnimatePresence>
        {selectedTerm && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              style={{ position: "absolute", inset: 0 }}
              onClick={() => setSelectedTerm(null)}
            />
            <Modal
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <ModalHeader>
                <ModalTitle>{selectedTerm.term_name}</ModalTitle>
                <CloseButton onClick={() => setSelectedTerm(null)}>
                  <X size={24} />
                </CloseButton>
              </ModalHeader>
              <ModalContent>
                <Section>
                  <SectionTitle>카테고리</SectionTitle>
                  <CategoryBadge $category={selectedTerm.category}>
                    {selectedTerm.category}
                  </CategoryBadge>
                </Section>
                <Section>
                  <SectionTitle>정의</SectionTitle>
                  <SectionContent>{selectedTerm.definition}</SectionContent>
                </Section>
                {selectedTerm.schedule && (
                  <Section>
                    <SectionTitle>⏰ 일시</SectionTitle>
                    <SectionContent>{selectedTerm.schedule}</SectionContent>
                  </Section>
                )}
                {selectedTerm.location && (
                  <Section>
                    <SectionTitle>📍 장소</SectionTitle>
                    <SectionContent>{selectedTerm.location}</SectionContent>
                  </Section>
                )}
                {selectedTerm.example && (
                  <Section>
                    <SectionTitle>사용 예시</SectionTitle>
                    <SectionContent>{selectedTerm.example}</SectionContent>
                  </Section>
                )}
                {relatedTerms.length > 0 && (
                  <Section>
                    <SectionTitle>
                      <Link2 size={16} style={{ display: "inline", marginRight: "8px" }} />
                      관련 용어
                    </SectionTitle>
                    <RelatedTerms>
                      {relatedTerms.map((term) => (
                        <RelatedTermTag
                          key={term.id}
                          onClick={() => handleRelatedTermClick(term.id)}
                        >
                          {term.term_name}
                        </RelatedTermTag>
                      ))}
                    </RelatedTerms>
                  </Section>
                )}
              </ModalContent>
            </Modal>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </>
  );
}
