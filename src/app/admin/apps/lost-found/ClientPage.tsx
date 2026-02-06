"use client";

import React, { useState, useRef } from "react";
import styled from "@emotion/styled";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, Calendar, X, Upload } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export interface LostFoundPost {
  id: number;
  post_date: string;
  image_urls: string[];
  memo: string | null;
  created_at: string;
  updated_at: string;
}

const Container = styled.div`
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const Button = styled.button<{ variant?: "primary" | "danger" | "secondary" }>`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  ${(p) =>
    p.variant === "danger"
      ? "background: #ef4444; color: #fff;"
      : p.variant === "secondary"
        ? "background: #f3f4f6; color: #374151;"
        : "background: #f59e0b; color: #fff;"}
  &:hover {
    opacity: 0.9;
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PostCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const Thumbs = styled.div`
  display: flex;
  gap: 8px;
`;

const Thumb = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  background: #f3f4f6;
`;

const PostInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PostDate = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PostMemo = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px 0;
  white-space: pre-wrap;
`;

const PostMeta = styled.div`
  font-size: 12px;
  color: #9ca3af;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const ModalBox = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: #1f2937;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  box-sizing: border-box;
`;

const UploadZone = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  background: #f9fafb;

  &:hover {
    border-color: #f59e0b;
    background: #fffbeb;
  }
`;

const PreviewRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const PreviewImg = styled.img`
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-end;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

export default function LostFoundAdminClientPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<LostFoundPost | null>(null);
  const [postDate, setPostDate] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<{ data: LostFoundPost[] }>({
    queryKey: ["admin-lost-found"],
    queryFn: async () => {
      const res = await fetch("/api/admin/lost-found");
      if (!res.ok) throw new Error("목록 조회 실패");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: { post_date: string; image_urls: string[]; memo: string | null }) => {
      const res = await fetch("/api/admin/lost-found", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "등록 실패");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lost-found"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: number;
      body: { post_date?: string; image_urls?: string[]; memo?: string | null };
    }) => {
      const res = await fetch(`/api/admin/lost-found/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "수정 실패");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lost-found"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/lost-found/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제 실패");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lost-found"] });
    },
  });

  function openCreate() {
    setEditingPost(null);
    setPostDate(format(new Date(), "yyyy-MM-dd"));
    setImageUrls([]);
    setMemo("");
    setModalOpen(true);
  }

  function openEdit(post: LostFoundPost) {
    setEditingPost(post);
    setPostDate(post.post_date);
    setImageUrls(post.image_urls ?? []);
    setMemo(post.memo ?? "");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingPost(null);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || imageUrls.length >= 2) return;
    const formData = new FormData();
    formData.set("file", file);
    try {
      const res = await fetch("/api/admin/lost-found/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "업로드 실패");
      }
      const j = (await res.json()) as { url: string };
      setImageUrls((prev) => [...prev, j.url].slice(0, 2));
    } catch (err) {
      alert(err instanceof Error ? err.message : "업로드 실패");
    }
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function submit() {
    if (!postDate.trim()) {
      alert("날짜를 선택해 주세요.");
      return;
    }
    if (imageUrls.length === 0) {
      alert("이미지를 1장 이상 올려 주세요.");
      return;
    }
    if (editingPost) {
      updateMutation.mutate({
        id: editingPost.id,
        body: { post_date: postDate, image_urls: imageUrls, memo: memo || null },
      });
    } else {
      createMutation.mutate({
        post_date: postDate,
        image_urls: imageUrls,
        memo: memo || null,
      });
    }
  }

  const posts = data?.data ?? [];

  return (
    <Container>
      <Header>
        <Title>분실물 관리</Title>
        <Button type="button" onClick={openCreate}>
          <Plus size={18} />
          새 포스트
        </Button>
      </Header>

      {isLoading && <p>불러오는 중...</p>}
      {!isLoading && (
        <List>
          {posts.length === 0 && <p style={{ color: "#6b7280" }}>등록된 포스트가 없습니다.</p>}
          {posts.map((post) => (
            <PostCard key={post.id}>
              <Thumbs>
                {(post.image_urls ?? []).slice(0, 2).map((url, i) => (
                  <Thumb key={i} src={url} alt="" />
                ))}
              </Thumbs>
              <PostInfo>
                <PostDate>
                  <Calendar size={16} />
                  {format(new Date(post.post_date), "yyyy년 M월 d일 (EEE)", { locale: ko })}
                </PostDate>
                {post.memo && <PostMemo>{post.memo}</PostMemo>}
                <PostMeta>등록: {format(new Date(post.created_at), "yyyy-MM-dd HH:mm")}</PostMeta>
              </PostInfo>
              <Actions>
                <Button type="button" variant="secondary" onClick={() => openEdit(post)}>
                  <Edit2 size={16} />
                  수정
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (confirm("이 포스트를 삭제할까요?")) deleteMutation.mutate(post.id);
                  }}
                >
                  <Trash2 size={16} />
                  삭제
                </Button>
              </Actions>
            </PostCard>
          ))}
        </List>
      )}

      {modalOpen && (
        <ModalBackdrop onClick={closeModal}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{editingPost ? "포스트 수정" : "새 포스트 등록"}</ModalTitle>
            <FormGroup>
              <Label>날짜</Label>
              <Input
                type="date"
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>이미지 (1~2장, Cloudinary 업로드)</Label>
              <UploadZone
                onClick={() => {
                  if (imageUrls.length < 2) fileInputRef.current?.click();
                }}
              >
                <Upload size={20} style={{ display: "block", margin: "0 auto 8px" }} />
                클릭하여 업로드 (최대 2장)
              </UploadZone>
              <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
              />
              <PreviewRow>
                {imageUrls.map((url, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <PreviewImg src={url} alt="" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: "none",
                        background: "#ef4444",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </PreviewRow>
            </FormGroup>
            <FormGroup>
              <Label>메모 (선택)</Label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 본당 앞 테이블"
              />
            </FormGroup>
            <ModalActions>
              <Button type="button" variant="secondary" onClick={closeModal}>
                취소
              </Button>
              <Button
                type="button"
                onClick={submit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingPost ? "수정" : "등록"}
              </Button>
            </ModalActions>
          </ModalBox>
        </ModalBackdrop>
      )}
    </Container>
  );
}
