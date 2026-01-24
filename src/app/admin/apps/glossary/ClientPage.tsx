"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import { Edit, Eye, EyeOff, Plus, BookOpen, Trash2, Search, X } from "lucide-react";

const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 16px;

  @media (max-width: 768px) {
    margin-bottom: 20px;
    gap: 12px;
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    font-size: 24px;
    gap: 8px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
`;

const SearchInput = styled.input`
  padding: 10px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  width: 250px;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 200px;
    font-size: 13px;
    padding: 8px 12px;
  }

  &:focus {
    outline: none;
    border-color: #10b981;
  }
`;

const Button = styled.button<{ variant?: "primary" | "danger" | "secondary" }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 14px;
    width: 100%;
    justify-content: center;
  }

  ${(props) => {
    switch (props.variant) {
      case "primary":
        return `
          background: #10b981;
          color: white;
          &:hover {
            background: #059669;
          }
        `;
      case "danger":
        return `
          background: #ef4444;
          color: white;
          &:hover {
            background: #dc2626;
          }
        `;
      case "secondary":
        return `
          background: #f3f4f6;
          color: #374151;
          &:hover {
            background: #e5e7eb;
          }
        `;
      default:
        return `
          background: #3b82f6;
          color: white;
          &:hover {
            background: #2563eb;
          }
        `;
    }
  }}
`;

const TermsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const TermCard = styled.div<{ isActive: boolean }>`
  background: white;
  border: 2px solid ${(props) => (props.isActive ? "#10b981" : "#e5e7eb")};
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 10px;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const TermHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const TermName = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const TermMeta = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const Badge = styled.span<{ type?: string }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;

  ${(props) => {
    switch (props.type) {
      case "category":
        return `
          background: #dbeafe;
          color: #1e40af;
        `;
      case "status":
        return `
          background: ${props.children === "활성" ? "#d1fae5" : "#f3f4f6"};
          color: ${props.children === "활성" ? "#065f46" : "#6b7280"};
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

const TermDefinition = styled.div`
  font-size: 15px;
  color: #4b5563;
  margin-bottom: 12px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TermExample = styled.div`
  font-size: 13px;
  color: #6b7280;
  font-style: italic;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button<{ variant?: "primary" | "danger" | "secondary" }>`
  padding: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  ${(props) => {
    switch (props.variant) {
      case "primary":
        return `
          background: #dbeafe;
          color: #1e40af;
          &:hover {
            background: #bfdbfe;
          }
        `;
      case "danger":
        return `
          background: #fee2e2;
          color: #dc2626;
          &:hover {
            background: #fecaca;
          }
        `;
      case "secondary":
        return `
          background: #f3f4f6;
          color: #6b7280;
          &:hover {
            background: #e5e7eb;
          }
        `;
      default:
        return `
          background: #f3f4f6;
          color: #6b7280;
          &:hover {
            background: #e5e7eb;
          }
        `;
    }
  }}
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 12px;
    max-height: 95vh;
    margin: 8px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #10b981;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  min-height: 120px;
  resize: vertical;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #10b981;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #10b981;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const RelatedTermsInput = styled(Input)`
  font-size: 14px;
  &::placeholder {
    color: #9ca3af;
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
  is_active: boolean;
  order_index: number;
  search_count?: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ["신앙", "공동체", "행사", "기타", "조직"];

export default function ClientPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [terms, setTerms] = useState<Term[]>([]);
  const [filteredTerms, setFilteredTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    term_name: "",
    category: "신앙",
    definition: "",
    example: "",
    schedule: "",
    location: "",
    related_terms: [] as number[],
    is_active: true,
    order_index: 0,
  });

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isAdmin) {
      alert("관리자만 접근할 수 있는 페이지입니다.");
      router.push("/");
    }
  }, [status, session, router]);

  const fetchTerms = async () => {
    try {
      const response = await fetch("/api/admin/glossary/terms");
      const data = await response.json();
      if (response.ok) {
        setTerms(data.terms || []);
        setFilteredTerms(data.terms || []);
      }
    } catch (error) {
      console.error("용어 목록 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.isAdmin) {
      fetchTerms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.isAdmin]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = terms.filter(
        (term) =>
          term.term_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          term.definition.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTerms(filtered);
    } else {
      setFilteredTerms(terms);
    }
  }, [searchQuery, terms]);

  const handleSave = async () => {
    try {
      const url = editingTerm
        ? `/api/admin/glossary/terms/${editingTerm.id}`
        : "/api/admin/glossary/terms";

      const method = editingTerm ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingTerm(null);
        setFormData({
          term_name: "",
          category: "신앙",
          definition: "",
          example: "",
          schedule: "",
          location: "",
          related_terms: [],
          is_active: true,
          order_index: 0,
        });
        fetchTerms();
      } else {
        const error = await response.json();
        alert(error.error || "용어 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("용어 저장 오류:", error);
      alert("용어 저장에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/admin/glossary/terms/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTerms();
      }
    } catch (error) {
      console.error("용어 삭제 오류:", error);
      alert("용어 삭제에 실패했습니다.");
    }
  };

  const handleToggleStatus = async (term: Term) => {
    try {
      const response = await fetch(`/api/admin/glossary/terms/${term.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...term,
          is_active: !term.is_active,
        }),
      });

      if (response.ok) {
        fetchTerms();
      }
    } catch (error) {
      console.error("상태 변경 오류:", error);
      alert("상태 변경에 실패했습니다.");
    }
  };

  const handleEdit = (term: Term) => {
    setEditingTerm(term);
    setFormData({
      term_name: term.term_name,
      category: term.category,
      definition: term.definition,
      example: term.example || "",
      schedule: term.schedule || "",
      location: term.location || "",
      related_terms: term.related_terms || [],
      is_active: term.is_active,
      order_index: term.order_index,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingTerm(null);
    setFormData({
      term_name: "",
      category: "신앙",
      definition: "",
      example: "",
      schedule: "",
      location: "",
      related_terms: [],
      is_active: true,
      order_index: 0,
    });
    setShowModal(true);
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated" || !session?.user?.isAdmin) {
    return null;
  }

  return (
    <Container>
      <Header>
        <Title>
          <BookOpen size={32} />
          용어사전 관리
        </Title>
        <HeaderActions>
          <div style={{ position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
              }}
            />
            <SearchInput
              type="text"
              placeholder="용어 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "40px" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <Button variant="primary" onClick={handleAdd}>
            <Plus size={20} />
            용어 추가
          </Button>
        </HeaderActions>
      </Header>

      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <TermsGrid>
          {filteredTerms.map((term) => (
            <TermCard key={term.id} isActive={term.is_active}>
              <TermHeader>
                <TermName>{term.term_name}</TermName>
              </TermHeader>
              <TermMeta>
                <Badge type="category">{term.category}</Badge>
                <Badge type="status">{term.is_active ? "활성" : "비활성"}</Badge>
                {term.search_count !== undefined && (
                  <Badge>조회: {term.search_count}</Badge>
                )}
              </TermMeta>
              <TermDefinition>{term.definition}</TermDefinition>
              {term.schedule && (
                <div style={{ fontSize: "13px", color: "rgba(0, 102, 255, 0.8)", marginTop: "8px" }}>
                  ⏰ {term.schedule}
                </div>
              )}
              {term.location && (
                <div style={{ fontSize: "13px", color: "rgba(16, 185, 129, 0.8)", marginTop: "4px" }}>
                  📍 {term.location}
                </div>
              )}
              {term.example && <TermExample>예: {term.example}</TermExample>}
              <Actions>
                <IconButton onClick={() => handleEdit(term)}>
                  <Edit size={16} />
                </IconButton>
                <IconButton
                  variant="secondary"
                  onClick={() => handleToggleStatus(term)}
                >
                  {term.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                </IconButton>
                <IconButton variant="danger" onClick={() => handleDelete(term.id)}>
                  <Trash2 size={16} />
                </IconButton>
              </Actions>
            </TermCard>
          ))}
        </TermsGrid>
      )}

      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{editingTerm ? "용어 수정" : "용어 추가"}</ModalTitle>
              <IconButton onClick={() => setShowModal(false)}>
                <X size={20} />
              </IconButton>
            </ModalHeader>

            <FormGroup>
              <Label>용어명 *</Label>
              <Input
                value={formData.term_name}
                onChange={(e) =>
                  setFormData({ ...formData, term_name: e.target.value })
                }
                placeholder="용어명을 입력하세요"
              />
            </FormGroup>

            <FormGroup>
              <Label>카테고리 *</Label>
              <Select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>정의 *</Label>
              <TextArea
                value={formData.definition}
                onChange={(e) =>
                  setFormData({ ...formData, definition: e.target.value })
                }
                placeholder="용어의 정의를 입력하세요"
              />
            </FormGroup>

            <FormGroup>
              <Label>사용 예시</Label>
              <TextArea
                value={formData.example}
                onChange={(e) =>
                  setFormData({ ...formData, example: e.target.value })
                }
                placeholder="사용 예시를 입력하세요 (선택사항)"
              />
            </FormGroup>

            <FormGroup>
              <Label>일시 (조직 정보용)</Label>
              <Input
                value={formData.schedule}
                onChange={(e) =>
                  setFormData({ ...formData, schedule: e.target.value })
                }
                placeholder="예: 일요일 오후 2:00 (선택사항)"
              />
            </FormGroup>

            <FormGroup>
              <Label>장소 (조직 정보용)</Label>
              <Input
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="예: 양재 온누리교회 기쁨홀 (선택사항)"
              />
            </FormGroup>

            <FormGroup>
              <Label>관련 용어 ID (쉼표로 구분)</Label>
              <RelatedTermsInput
                value={formData.related_terms.join(", ")}
                onChange={(e) => {
                  const ids = e.target.value
                    .split(",")
                    .map((id) => parseInt(id.trim(), 10))
                    .filter((id) => !isNaN(id));
                  setFormData({ ...formData, related_terms: ids });
                }}
                placeholder="예: 1, 2, 3"
              />
            </FormGroup>

            <FormGroup>
              <Label>순서</Label>
              <Input
                type="number"
                value={formData.order_index}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order_index: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </FormGroup>

            <ModalActions>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                취소
              </Button>
              <Button variant="primary" onClick={handleSave}>
                저장
              </Button>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
}
