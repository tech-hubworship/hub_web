"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import {
  Edit,
  MapPin,
  Plus,
  Search,
  Star,
  Trash2,
  X,
  Check,
  XCircle,
} from "lucide-react";

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
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SearchInput = styled.input`
  padding: 10px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  width: 220px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #10b981;
  }

  @media (max-width: 768px) {
    width: 100%;
    min-width: 0;
  }
`;

const Select = styled.select`
  padding: 10px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  min-width: 120px;

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

  ${(props) => {
    switch (props.variant) {
      case "primary":
        return `
          background: #10b981;
          color: white;
          &:hover { background: #059669; }
        `;
      case "danger":
        return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
        `;
      case "secondary":
        return `
          background: #f3f4f6;
          color: #374151;
          &:hover { background: #e5e7eb; }
        `;
      default:
        return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
    }
  }}
`;

const TableWrap = styled.div`
  overflow-x: auto;
  background: white;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th,
  td {
    padding: 14px 16px;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    background: #f9fafb;
    font-weight: 600;
    color: #374151;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: #f9fafb;
  }
`;

const Badge = styled.span<{ type?: "category" | "approved" | "featured" }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;

  ${(props) => {
    switch (props.type) {
      case "category":
        return `background: #dbeafe; color: #1e40af;`;
      case "approved":
        return `background: #d1fae5; color: #065f46;`;
      default:
        return `background: #fef3c7; color: #92400e;`;
    }
  }}
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const IconButton = styled.button<{ variant?: "primary" | "danger" | "secondary" }>`
  padding: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  ${(props) => {
    switch (props.variant) {
      case "primary":
        return `background: #dbeafe; color: #1e40af; &:hover { background: #bfdbfe; }`;
      case "danger":
        return `background: #fee2e2; color: #dc2626; &:hover { background: #fecaca; }`;
      default:
        return `background: #f3f4f6; color: #6b7280; &:hover { background: #e5e7eb; }`;
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
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
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
  min-height: 80px;
  resize: vertical;

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

const CATEGORIES = ["한식", "양식", "중식", "일식", "카페", "기타"];

export interface RestaurantPlace {
  id: number;
  name: string;
  category: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  image_url: string | null;
  phone: string | null;
  opening_hours: string | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

const defaultForm = {
  name: "",
  category: "한식",
  address: "",
  latitude: "" as string | number,
  longitude: "" as string | number,
  description: "",
  image_url: "",
  phone: "",
  opening_hours: "",
  is_approved: false,
  is_featured: false,
};

export default function ClientPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [list, setList] = useState<RestaurantPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RestaurantPlace | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterApproved, setFilterApproved] = useState("");
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (status === "authenticated" && !(session?.user as { isAdmin?: boolean })?.isAdmin) {
      router.push("/");
    }
  }, [status, session, router]);

  const fetchList = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set("category", filterCategory);
      if (filterApproved !== "") params.set("is_approved", filterApproved);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/restaurant?${params.toString()}`);
      const json = await res.json();
      if (res.ok) setList(json.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && (session?.user as { isAdmin?: boolean })?.isAdmin) {
      fetchList();
    }
  }, [status, session?.user, filterCategory, filterApproved, search]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("맛집명을 입력하세요.");
      return;
    }
    if (!formData.category.trim()) {
      alert("카테고리를 선택하세요.");
      return;
    }
    try {
      const url = editing
        ? `/api/admin/restaurant/${editing.id}`
        : "/api/admin/restaurant";
      const method = editing ? "PUT" : "POST";
      const body = {
        ...formData,
        latitude: formData.latitude === "" ? null : Number(formData.latitude),
        longitude: formData.longitude === "" ? null : Number(formData.longitude),
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        setShowModal(false);
        setEditing(null);
        setFormData(defaultForm);
        fetchList();
      } else {
        alert(json.error || "저장에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("저장에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/restaurant/${id}`, { method: "DELETE" });
      if (res.ok) fetchList();
      else {
        const json = await res.json();
        alert(json.error || "삭제에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleApproved = async (row: RestaurantPlace) => {
    try {
      const res = await fetch(`/api/admin/restaurant/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, is_approved: !row.is_approved }),
      });
      if (res.ok) fetchList();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFeatured = async (row: RestaurantPlace) => {
    try {
      const res = await fetch(`/api/admin/restaurant/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, is_featured: !row.is_featured }),
      });
      if (res.ok) fetchList();
    } catch (e) {
      console.error(e);
    }
  };

  const openEdit = (row: RestaurantPlace) => {
    setEditing(row);
    setFormData({
      name: row.name,
      category: row.category,
      address: row.address ?? "",
      latitude: row.latitude ?? "",
      longitude: row.longitude ?? "",
      description: row.description ?? "",
      image_url: row.image_url ?? "",
      phone: row.phone ?? "",
      opening_hours: row.opening_hours ?? "",
      is_approved: row.is_approved,
      is_featured: row.is_featured,
    });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditing(null);
    setFormData(defaultForm);
    setShowModal(true);
  };

  if (status === "loading") return <div>로딩 중...</div>;
  if (status === "unauthenticated" || !(session?.user as { isAdmin?: boolean })?.isAdmin) return null;

  return (
    <Container>
      <Header>
        <Title>
          <MapPin size={28} />
          맛집지도 관리
        </Title>
        <HeaderActions>
          <SearchInput
            type="text"
            placeholder="맛집명·주소 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">전체 카테고리</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Select
            value={filterApproved}
            onChange={(e) => setFilterApproved(e.target.value)}
          >
            <option value="">전체 승인</option>
            <option value="true">승인됨</option>
            <option value="false">미승인</option>
          </Select>
          <Button variant="primary" onClick={openAdd}>
            <Plus size={20} />
            맛집 추가
          </Button>
        </HeaderActions>
      </Header>

      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>이름</th>
                <th>카테고리</th>
                <th>주소</th>
                <th>승인</th>
                <th>인기</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    {row.phone && (
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>{row.phone}</div>
                    )}
                  </td>
                  <td><Badge type="category">{row.category}</Badge></td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.address || "-"}
                  </td>
                  <td>
                    <Badge type="approved">{row.is_approved ? "승인" : "미승인"}</Badge>
                    <IconButton
                      variant="secondary"
                      onClick={() => toggleApproved(row)}
                      title={row.is_approved ? "승인 취소" : "승인"}
                      style={{ marginLeft: 6 }}
                    >
                      {row.is_approved ? <XCircle size={14} /> : <Check size={14} />}
                    </IconButton>
                  </td>
                  <td>
                    <IconButton
                      variant={row.is_featured ? "primary" : "secondary"}
                      onClick={() => toggleFeatured(row)}
                      title={row.is_featured ? "인기 해제" : "인기 지정"}
                    >
                      <Star size={14} fill={row.is_featured ? "currentColor" : "none"} />
                    </IconButton>
                  </td>
                  <td>
                    <Actions>
                      <IconButton onClick={() => openEdit(row)} title="수정">
                        <Edit size={16} />
                      </IconButton>
                      <IconButton variant="danger" onClick={() => handleDelete(row.id)} title="삭제">
                        <Trash2 size={16} />
                      </IconButton>
                    </Actions>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {list.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
              등록된 맛집이 없습니다.
            </div>
          )}
        </TableWrap>
      )}

      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{editing ? "맛집 수정" : "맛집 추가"}</ModalTitle>
              <IconButton onClick={() => setShowModal(false)}>
                <X size={20} />
              </IconButton>
            </ModalHeader>

            <FormGroup>
              <Label>맛집명 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="맛집 이름"
              />
            </FormGroup>

            <FormGroup>
              <Label>카테고리 *</Label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>주소</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="주소 (지도 연동용)"
              />
            </FormGroup>

            <FormGroup>
              <Label>위도 / 경도 (선택)</Label>
              <div style={{ display: "flex", gap: 8 }}>
                <Input
                  type="number"
                  step="any"
                  placeholder="위도"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="경도"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
            </FormGroup>

            <FormGroup>
              <Label>전화번호</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="02-1234-5678"
              />
            </FormGroup>

            <FormGroup>
              <Label>영업시간</Label>
              <Input
                value={formData.opening_hours}
                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                placeholder="예: 09:00 - 21:00"
              />
            </FormGroup>

            <FormGroup>
              <Label>설명</Label>
              <TextArea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="한 줄 소개"
              />
            </FormGroup>

            <FormGroup>
              <Label>이미지 URL</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </FormGroup>

            {editing && (
              <>
                <FormGroup>
                  <Label>승인</Label>
                  <Select
                    value={formData.is_approved ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({ ...formData, is_approved: e.target.value === "true" })
                    }
                  >
                    <option value="false">미승인</option>
                    <option value="true">승인</option>
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>인기 맛집 지정</Label>
                  <Select
                    value={formData.is_featured ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({ ...formData, is_featured: e.target.value === "true" })
                    }
                  >
                    <option value="false">아니오</option>
                    <option value="true">예</option>
                  </Select>
                </FormGroup>
              </>
            )}

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
