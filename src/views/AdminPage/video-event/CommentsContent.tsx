"use client";

import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { VIDEO_EVENT } from "@src/lib/video-event/constants";

const Container = styled.div`
  padding: 24px;
  background: #f8fafc;
  min-height: 400px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px 0;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Input = styled.input`
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 160px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background: #EF0017;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #c90014;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TableWrap = styled.div`
  overflow-x: auto;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 14px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
  background: #f8fafc;
`;

const Td = styled.td`
  padding: 14px 16px;
  font-size: 14px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
`;

const Tr = styled.tr`
  &:hover {
    background: #f8fafc;
  }
`;

const ContentCell = styled(Td)`
  max-width: 360px;
  white-space: pre-wrap;
  word-break: break-word;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
`;

const PageBtn = styled.button<{ active?: boolean }>`
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  background: ${(p) => (p.active ? "#EF0017" : "#fff")};
  color: ${(p) => (p.active ? "#fff" : "#475569")};
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: ${(p) => (p.active ? "#c90014" : "#f1f5f9")};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface CommentRow {
  comment_id: number;
  post_dt: string;
  reg_id: string;
  content: string;
  reg_dt: string;
  user_name: string;
  user_affiliation: string;
}

export default function CommentsContent() {
  const [date, setDate] = useState(() => {
    const now = new Date();
    const korean = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return korean.toISOString().slice(0, 10);
  });
  const [appliedDate, setAppliedDate] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<CommentRow[]>([]);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchComments = async () => {
    const d = date.replace(/-/g, "");
    setAppliedDate(d);
    setPage(1);
  };

  useEffect(() => {
    if (!appliedDate) return;
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (appliedDate.length === 8) params.set("date", appliedDate);

    fetch(`/api/admin/video-event/comments?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
          return;
        }
        setList(data.list || []);
        setTotal(data.total ?? 0);
      })
      .catch(() => alert("묵상 목록을 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [appliedDate, page]);

  const totalPages = Math.ceil(total / limit) || 1;
  const formatDt = (s: string) => (s ? s.slice(0, 10).replace(/-/g, ".") : "-");
  const formatPostDt = (s: string) =>
    s && s.length === 8 ? `${s.slice(4, 6)}/${s.slice(6, 8)}` : "-";

  return (
    <Container>
      <Title>{VIDEO_EVENT.DISPLAY_NAME} 묵상 관리</Title>
      <Subtitle>날짜별로 묵상(댓글) 목록을 조회합니다.</Subtitle>

      <Toolbar>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button onClick={fetchComments} disabled={loading}>
          {loading ? "조회 중..." : "조회"}
        </Button>
        {appliedDate && (
          <span style={{ fontSize: 14, color: "#64748b" }}>
            총 {total}건
          </span>
        )}
      </Toolbar>

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>날짜</Th>
              <Th>작성자</Th>
              <Th>소속</Th>
              <Th>내용</Th>
              <Th>작성일시</Th>
            </tr>
          </thead>
          <tbody>
            {loading && list.length === 0 ? (
              <tr>
                <Td colSpan={5} style={{ textAlign: "center", padding: 40 }}>
                  조회 중...
                </Td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <Td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                  {appliedDate ? "해당 날짜에 묵상이 없습니다." : "날짜를 선택한 뒤 조회해주세요."}
                </Td>
              </tr>
            ) : (
              list.map((row) => (
                <Tr key={row.comment_id}>
                  <Td>{formatPostDt(row.post_dt)}</Td>
                  <Td>{row.user_name}</Td>
                  <Td>{row.user_affiliation || "-"}</Td>
                  <ContentCell>{row.content || "-"}</ContentCell>
                  <Td>{formatDt(row.reg_dt)}</Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableWrap>

      {totalPages > 1 && (
        <Pagination>
          <PageBtn
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            이전
          </PageBtn>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page - 2 + i;
            if (p > totalPages) return null;
            return (
              <PageBtn
                key={p}
                type="button"
                active={p === page}
                onClick={() => setPage(p)}
              >
                {p}
              </PageBtn>
            );
          })}
          <PageBtn
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            다음
          </PageBtn>
        </Pagination>
      )}
    </Container>
  );
}
