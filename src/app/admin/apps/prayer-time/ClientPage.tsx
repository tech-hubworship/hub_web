"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import { Users, Clock, Calendar, RefreshCw } from "lucide-react";

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px 0;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const DateInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #3b82f6;
  color: white;
  &:hover {
    background: #2563eb;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Section = styled.section`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
`;

const StatCard = styled.div`
  padding: 12px 20px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;
const StatLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  display: block;
  margin-bottom: 4px;
`;
const StatValue = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
`;

const ActiveList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;
const ActiveItem = styled.li`
  padding: 10px 16px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  font-size: 14px;
  color: #065f46;
  & .meta {
    font-size: 12px;
    color: #047857;
    margin-top: 2px;
  }
`;

const RankList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  counter-reset: rank;
`;
const RankItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
  counter-increment: rank;
  &::before {
    content: counter(rank) ". ";
    font-weight: 600;
    color: #6b7280;
    margin-right: 8px;
  }
  &:last-child {
    border-bottom: none;
  }
`;

const PaginationWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
`;
const PaginationInfo = styled.span`
  font-size: 14px;
  color: #6b7280;
`;
const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
const PageBtn = styled.button<{ active?: boolean }>`
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background: ${(p) => (p.active ? "#3b82f6" : "white")};
  color: ${(p) => (p.active ? "white" : "#374151")};
  cursor: pointer;
  &:hover:not(:disabled) {
    background: ${(p) => (p.active ? "#2563eb" : "#f3f4f6")};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
const PageSizeSelect = styled.select`
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  margin-left: 8px;
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  th,
  td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }
  th {
    font-weight: 600;
    color: #374151;
    background: #f9fafb;
  }
  tr:hover td {
    background: #f9fafb;
  }
`;

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ActiveUser = {
  user_id: string;
  name: string;
  group_name: string;
  cell_name: string;
  start_time: string;
  duration_seconds: number;
};
type TodayStat = {
  user_id: string;
  name: string;
  group_name: string;
  cell_name: string;
  total_seconds: number;
};
type RecordRow = {
  id: number;
  user_id: string;
  name: string;
  group_name: string;
  cell_name: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
};

type PaginationInfo = {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
};

type OverviewData = {
  date: string;
  start_date: string;
  end_date: string;
  active_users: ActiveUser[];
  community_total_seconds: number;
  today_user_stats: TodayStat[];
  recent_records: RecordRow[];
  pagination: PaginationInfo;
};

export default function PrayerTimeAdminClientPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = useCallback(
    async (start?: string, end?: string, p = 1, size = 20) => {
      const params = new URLSearchParams();
      if (start) params.set("start_date", start);
      if (end) params.set("end_date", end);
      params.set("page", String(p));
      params.set("page_size", String(size));
      const res = await fetch(`/api/admin/prayer-time/overview?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json?.data) setData(json.data);
    },
    []
  );

  const fetchData = useCallback(
    (p?: number, newPageSize?: number) => {
      setRefreshing(true);
      const nextPage = p ?? page;
      const size = newPageSize ?? pageSize;
      if (newPageSize != null) setPageSize(newPageSize);
      if (p != null) setPage(p);
      loadOverview(startDate || undefined, endDate || undefined, nextPage, size).finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
    },
    [loadOverview, startDate, endDate, page, pageSize]
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && !(session?.user as any)?.isAdmin) {
      router.replace("/");
      return;
    }
    if (status === "authenticated" && (session?.user as any)?.isAdmin) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      setEndDate(end.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }));
      setStartDate(start.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }));
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated" || !(session?.user as any)?.isAdmin) return;
    if (!startDate || !endDate) return;
    setPage(1);
    fetchData(1);
  }, [status, session?.user, startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "loading" || (status === "authenticated" && !(session?.user as any)?.isAdmin)) {
    return (
      <Container>
        <p>로딩 중...</p>
      </Container>
    );
  }

  return (
    <Container>
      <Title>기도 시간 관리</Title>
      <Subtitle>공동체 기도 시간 통계와 기록을 확인합니다.</Subtitle>

      <Toolbar>
        <DateInput
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <span>~</span>
        <DateInput
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <Button onClick={() => fetchData()} disabled={refreshing}>
          <RefreshCw size={16} style={{ opacity: refreshing ? 0.7 : 1 }} />
          {refreshing ? "조회 중..." : "조회"}
        </Button>
      </Toolbar>

      {loading && !data && <p>데이터를 불러오는 중...</p>}
      {!loading && data && (
        <>
          <Section>
            <SectionTitle>
              <Users size={20} />
              현재 기도 중 ({data.active_users.length}명)
            </SectionTitle>
            {data.active_users.length === 0 ? (
              <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
                현재 기도 중인 사람이 없습니다.
              </p>
            ) : (
              <ActiveList>
                {data.active_users.map((u) => (
                  <ActiveItem key={u.user_id}>
                    {u.name} · {formatDuration(u.duration_seconds)}
                    {(u.group_name !== "-" || u.cell_name !== "-") && (
                      <div className="meta">
                        {u.group_name !== "-" && <span>그룹 {u.group_name}</span>}
                        {u.group_name !== "-" && u.cell_name !== "-" && " · "}
                        {u.cell_name !== "-" && <span>다락방 {u.cell_name}</span>}
                      </div>
                    )}
                  </ActiveItem>
                ))}
              </ActiveList>
            )}
          </Section>

          <Section>
            <SectionTitle>
              <Clock size={20} />
              오늘·전체 통계
            </SectionTitle>
            <StatRow>
              <StatCard>
                <StatLabel>공동체 누적 기도 시간</StatLabel>
                <StatValue>{formatDuration(data.community_total_seconds)}</StatValue>
              </StatCard>
            </StatRow>
            <SectionTitle style={{ marginTop: 16, marginBottom: 8 }}>
              <Calendar size={18} />
              오늘({data.date}) 기도 시간 순위
            </SectionTitle>
            {data.today_user_stats.length === 0 ? (
              <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>오늘 기록이 없습니다.</p>
            ) : (
              <RankList>
                {data.today_user_stats.map((u) => (
                  <RankItem key={u.user_id}>
                    <span>
                      {u.name}
                      {(u.group_name !== "-" || u.cell_name !== "-") && (
                        <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 6 }}>
                          ({[u.group_name !== "-" ? u.group_name : null, u.cell_name !== "-" ? u.cell_name : null]
                            .filter(Boolean)
                            .join(" · ")}
                          )
                        </span>
                      )}
                    </span>
                    <span>{formatDuration(u.total_seconds)}</span>
                  </RankItem>
                ))}
              </RankList>
            )}
          </Section>

          <Section>
            <SectionTitle>
              <Calendar size={20} />
              기간별 기록 ({data.start_date} ~ {data.end_date})
            </SectionTitle>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>공동체 그룹</th>
                    <th>다락방</th>
                    <th>시작 시각</th>
                    <th>기도 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_records.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ color: "#6b7280", textAlign: "center", padding: 24 }}>
                        해당 기간 기록이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    data.recent_records.map((r) => (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>{r.group_name}</td>
                        <td>{r.cell_name}</td>
                        <td>{formatDateTime(r.start_time)}</td>
                        <td>{formatDuration(r.duration_seconds)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableWrap>
            {data.pagination && data.pagination.total_count > 0 && (
              <PaginationWrap>
                <PaginationInfo>
                  전체 {data.pagination.total_count}건 · {data.pagination.page} / {data.pagination.total_pages}페이지
                </PaginationInfo>
                <PaginationControls>
                  <PageSizeSelect
                    value={pageSize}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      fetchData(1, v);
                    }}
                  >
                    <option value={10}>10개씩</option>
                    <option value={20}>20개씩</option>
                    <option value={50}>50개씩</option>
                    <option value={100}>100개씩</option>
                  </PageSizeSelect>
                  <PaginationControls>
                    <PageBtn
                      type="button"
                      disabled={data.pagination.page <= 1 || refreshing}
                      onClick={() => fetchData(data.pagination.page - 1)}
                    >
                      이전
                    </PageBtn>
                    {Array.from({ length: data.pagination.total_pages }, (_, i) => i + 1)
                      .filter((p) => {
                        const cur = data.pagination.page;
                        return p === 1 || p === data.pagination.total_pages || (p >= cur - 2 && p <= cur + 2);
                      })
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: "0 4px" }}>…</span>}
                          <PageBtn
                            type="button"
                            active={p === data.pagination.page}
                            onClick={() => fetchData(p)}
                            disabled={refreshing}
                          >
                            {p}
                          </PageBtn>
                        </React.Fragment>
                      ))}
                    <PageBtn
                      type="button"
                      disabled={data.pagination.page >= data.pagination.total_pages || refreshing}
                      onClick={() => fetchData(data.pagination.page + 1)}
                    >
                      다음
                    </PageBtn>
                  </PaginationControls>
                </PaginationControls>
              </PaginationWrap>
            )}
          </Section>
        </>
      )}
    </Container>
  );
}
