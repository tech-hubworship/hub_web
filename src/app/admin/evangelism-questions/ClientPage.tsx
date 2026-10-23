"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Question {
  id: string;
  created_at: string;
  name: string | null;
  contact: string | null;
  question: string;
  status: string;
  answer: string | null;
  answered_at: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  new: "새 질문",
  answered: "답변 완료",
  closed: "종료",
};

const Page = styled.div`
  min-height: 100vh;
  background: #f5f6fa;
  padding: 90px 20px 80px;

  @media (max-width: 768px) {
    padding: 70px 14px 60px;
  }
`;

const Inner = styled.div`
  max-width: 920px;
  margin: 0 auto;
`;

const Head = styled.div`
  margin-bottom: 20px;

  h1 {
    font-size: 24px;
    font-weight: 800;
    color: #191f28;
    margin: 0 0 4px;
  }
  p {
    font-size: 14px;
    color: #8b95a1;
    margin: 0;
  }
`;

const Filters = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;

  button {
    border: 1px solid #e2e8f0;
    background: #fff;
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 13px;
    cursor: pointer;

    &.active {
      background: #0066ff;
      color: #fff;
      border-color: #0066ff;
      font-weight: 700;
    }
  }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 12px;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #8b95a1;
  margin-bottom: 10px;
`;

const Badge = styled.span<{ status: string }>`
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  background: ${(p) =>
    p.status === "answered"
      ? "#e6f4ea"
      : p.status === "closed"
        ? "#eceff3"
        : "#fff3e0"};
  color: ${(p) =>
    p.status === "answered"
      ? "#1e7e34"
      : p.status === "closed"
        ? "#67727e"
        : "#b26a00"};
`;

const Contact = styled.div`
  font-size: 13px;
  margin-bottom: 10px;

  b {
    color: #0066ff;
  }
  .none {
    color: #b0b8c1;
  }
`;

const QuestionText = styled.div`
  font-size: 15px;
  line-height: 1.7;
  color: #191f28;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: break-word;
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
`;

const AnswerArea = styled.textarea`
  width: 100%;
  min-height: 90px;
  border: 1px solid #d8dee6;
  border-radius: 10px;
  padding: 11px 13px;
  font: inherit;
  font-size: 14px;
  resize: vertical;

  &:focus {
    outline: 2px solid #a8c4ff;
    outline-offset: 1px;
  }
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;

  button {
    border: none;
    border-radius: 999px;
    padding: 9px 16px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }
  .save {
    background: #0066ff;
    color: #fff;
  }
  .close {
    background: #eceff3;
    color: #47545f;
  }
  .del {
    background: #fbecec;
    color: #b43b3b;
    margin-left: auto;
  }
  button:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const Empty = styled.div`
  text-align: center;
  color: #8b95a1;
  padding: 60px 0;
`;

function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  } catch {
    return ts;
  }
}

export default function ClientPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const isAdmin = Boolean((session?.user as { isAdmin?: boolean } | undefined)?.isAdmin);

  // 접근 가드
  useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      alert("⛔️ 관리자만 접근할 수 있는 페이지입니다.");
      router.replace("/");
    }
    if (status === "unauthenticated") {
      router.replace(
        `/login?redirect=${encodeURIComponent("/admin/evangelism-questions")}`
      );
    }
  }, [status, isAdmin, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/evangelism/questions/admin${qs}`);
      const json = await res.json();
      if (res.ok) {
        const data: Question[] = json.data || [];
        setItems(data);
        setDrafts(
          Object.fromEntries(data.map((q) => [q.id, q.answer ?? ""]))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const saveAnswer = async (id: string) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/evangelism/questions/admin/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: drafts[id] ?? "" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "저장 실패");
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const setStatus = async (id: string, newStatus: string) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/evangelism/questions/admin/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "변경 실패");
      }
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("이 질문을 삭제할까요?")) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/evangelism/questions/admin/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "삭제 실패");
      }
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const counts = useMemo(() => {
    return {
      total: items.length,
    };
  }, [items]);

  if (status === "loading" || !isAdmin) {
    return (
      <Page>
        <Inner>
          <Empty>불러오는 중...</Empty>
        </Inner>
      </Page>
    );
  }

  return (
    <Page>
      <Inner>
        <Head>
          <h1>전도 질문 관리</h1>
          <p>
            전도 페이지(/evangelism)에서 들어온 질문입니다. 연락처가 있는 질문은
            답변을 남기고 해당 연락처로 직접 전해 주세요.
          </p>
        </Head>

        <Filters>
          {[
            { key: "all", label: "전체" },
            { key: "new", label: "새 질문" },
            { key: "answered", label: "답변 완료" },
            { key: "closed", label: "종료" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              className={filter === f.key ? "active" : undefined}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </Filters>

        {loading ? (
          <Empty>불러오는 중...</Empty>
        ) : items.length === 0 ? (
          <Empty>해당하는 질문이 없습니다.</Empty>
        ) : (
          items.map((q) => (
            <Card key={q.id}>
              <Meta>
                <Badge status={q.status}>
                  {STATUS_LABEL[q.status] || q.status}
                </Badge>
                <span>{q.name ? q.name : "익명"}</span>
                <span>· {fmt(q.created_at)}</span>
              </Meta>

              <Contact>
                답변 연락처:{" "}
                {q.contact ? (
                  <b>{q.contact}</b>
                ) : (
                  <span className="none">없음 (익명 질문)</span>
                )}
              </Contact>

              <QuestionText>{q.question}</QuestionText>

              <AnswerArea
                value={drafts[q.id] ?? ""}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [q.id]: e.target.value }))
                }
                placeholder="답변 내용을 적어두세요. (이 내용을 보고 위 연락처로 직접 전해 주세요)"
              />
              {q.answered_at && (
                <div style={{ fontSize: 12, color: "#8b95a1", marginTop: 6 }}>
                  마지막 답변 저장: {fmt(q.answered_at)}
                </div>
              )}

              <Row>
                <button
                  type="button"
                  className="save"
                  disabled={savingId === q.id}
                  onClick={() => saveAnswer(q.id)}
                >
                  {savingId === q.id ? "저장 중..." : "답변 저장"}
                </button>
                {q.status !== "closed" && (
                  <button
                    type="button"
                    className="close"
                    disabled={savingId === q.id}
                    onClick={() => setStatus(q.id, "closed")}
                  >
                    종료 처리
                  </button>
                )}
                {q.status === "closed" && (
                  <button
                    type="button"
                    className="close"
                    disabled={savingId === q.id}
                    onClick={() => setStatus(q.id, "new")}
                  >
                    다시 열기
                  </button>
                )}
                <button
                  type="button"
                  className="del"
                  disabled={savingId === q.id}
                  onClick={() => remove(q.id)}
                >
                  삭제
                </button>
              </Row>
            </Card>
          ))
        )}

        <div style={{ marginTop: 16, fontSize: 12, color: "#8b95a1" }}>
          총 {counts.total}건
        </div>
      </Inner>
    </Page>
  );
}
