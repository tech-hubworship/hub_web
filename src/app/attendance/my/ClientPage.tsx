"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import PageLayout from "@src/components/common/PageLayout";

function LateFeeAccountCard() {
  const [copied, setCopied] = useState(false);

  const copyAccount = () => {
    const text = "3333-18-2424686";
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  };

  const fallbackCopy = (text: string, done: () => void) => {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(el);
    done();
  };

  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "8px 12px",
        marginBottom: "28px",
        fontSize: "12px",
        color: "#475569",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0 8px",
      }}
    >
      <span style={{ fontWeight: "700" }}>💸 지각비</span>
      <span style={{ color: "#cbd5e1" }}>|</span>
      <span>카카오뱅크</span>
      <button
        onClick={copyAccount}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          background: "none",
          border: "none",
          padding: 0,
          fontSize: "12px",
          fontWeight: "700",
          color: "#2563eb",
          cursor: "pointer",
        }}
      >
        3333-18-2424686
        <span
          style={{
            fontSize: "10px",
            fontWeight: "600",
            color: copied ? "#16a34a" : "#2563eb",
            background: copied ? "#f0fdf4" : "#eff6ff",
            padding: "1px 5px",
            borderRadius: "6px",
          }}
        >
          {copied ? "✓" : "복사"}
        </span>
      </button>
      <span style={{ color: "#cbd5e1" }}>|</span>
      <span>이지원</span>
      <span style={{ color: "#cbd5e1" }}>|</span>
      <span style={{ color: "#94a3b8" }}>송금시: 다락방/이름</span>
    </div>
  );
}

type AttendanceRow = {
  id: number;
  week_date: string;
  status: string | null;
  attended_at: string | null;
  late_fee: number | null;
  is_report_required: boolean | null;
  late_fee_excused: boolean | null;
  report_excused: boolean | null;
  note: string | null;
};

type SettlementRow = {
  id: number;
  amount: number;
  note: string | null;
  settled_at: string;
};

type LateFeeSummary = {
  totalLateFee: number;
  totalSettled: number;
  remaining: number;
};

type MyAttendanceResponse = {
  attendance: AttendanceRow[];
  lateFeeSummary: LateFeeSummary;
  settlements: SettlementRow[];
};

function formatDate(s: string | null): string {
  if (!s) return "-";
  try {
    const d = new Date(s);
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "-";
  }
}

function formatTime(s: string | null): string {
  if (!s) return "-";
  try {
    const d = new Date(s);
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function formatDateTime(s: string | null): string {
  if (!s) return "-";
  try {
    const d = new Date(s);
    return d.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function statusLabel(status: string | null): string {
  switch (status) {
    case "present":
      return "출석";
    case "late":
      return "지각";
    case "excused_absence":
      return "결석(인정)";
    case "unexcused_absence":
      return "무단 결석";
    case "no_status":
    default:
      return "미출석";
  }
}

const sectionTitle = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#1e293b",
  marginBottom: "12px",
} as const;

const summaryBox = {
  flex: 1,
  minWidth: 0,
  padding: "16px",
  borderRadius: "12px",
  textAlign: "center" as const,
};
const summaryLabel = { fontSize: "12px", color: "#64748b", marginBottom: "6px" } as const;
const summaryValue = { fontSize: "20px", fontWeight: "700" } as const;

export default function MyAttendancePage() {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MyAttendanceResponse | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }

    if (status !== "authenticated") return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/attendance/my");
        const body = await res.json();
        if (!res.ok) {
          setError(body?.error || "조회에 실패했습니다.");
          setData(null);
          return;
        }
        setData(body);
      } catch {
        setError("네트워크 오류가 발생했습니다.");
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [status]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <PageLayout>
        <div style={{ padding: "24px", textAlign: "center" }}>로딩 중...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div style={{ padding: "20px 16px", maxWidth: "560px", margin: "0 auto" }}>
        {/* 상단: 뒤로가기 + 제목 */}
        <div style={{ marginBottom: "24px" }}>
          <Link
            href="/myinfo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              color: "#64748b",
              textDecoration: "none",
              marginBottom: "8px",
            }}
          >
            ‹ 내 정보로
          </Link>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
            출석·지각비
          </h1>
        </div>

        {loading && (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "15px" }}>
            불러오는 중...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "#fef2f2",
              color: "#dc2626",
              fontSize: "14px",
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* 지각비 요약: 3개 박스 */}
            <div style={{ marginBottom: "28px" }}>
              <div style={sectionTitle}>지각비 요약</div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ ...summaryBox, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={summaryLabel}>총 지각비</div>
                  <div style={summaryValue}>
                    {data.lateFeeSummary.totalLateFee.toLocaleString()}원
                  </div>
                </div>
                <div style={{ ...summaryBox, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <div style={summaryLabel}>정산 완료</div>
                  <div style={{ ...summaryValue, color: "#16a34a" }}>
                    {data.lateFeeSummary.totalSettled.toLocaleString()}원
                  </div>
                </div>
                <div
                  style={{
                    ...summaryBox,
                    background:
                      data.lateFeeSummary.remaining > 0 ? "#fef2f2" : "#f8fafc",
                    border:
                      data.lateFeeSummary.remaining > 0
                        ? "1px solid #fecaca"
                        : "1px solid #e2e8f0",
                  }}
                >
                  <div style={summaryLabel}>남은 금액</div>
                  <div
                    style={{
                      ...summaryValue,
                      color: data.lateFeeSummary.remaining > 0 ? "#dc2626" : "#64748b",
                    }}
                  >
                    {data.lateFeeSummary.remaining.toLocaleString()}원
                  </div>
                </div>
              </div>
            </div>

            {/* 지각비 계좌 안내 */}
            <LateFeeAccountCard />

            {/* 출석 내역 */}
            <div style={{ marginBottom: "28px" }}>
              <div style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: "8px" }}>
                출석 내역 (OD)
              </div>

              {data.attendance.length === 0 ? (
                <div
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "14px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                  }}
                >
                  출석 기록이 없습니다.
                </div>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      marginBottom: "10px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px 12px",
                    }}
                  >
                    <span>출석</span>
                    <span>지각</span>
                    <span>결석(인정)</span>
                    <span>무단 결석</span>
                    <span>미출석</span>
                  </div>
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th
                            style={{
                              padding: "12px 10px",
                              textAlign: "left",
                              fontWeight: "600",
                              color: "#475569",
                            }}
                          >
                            날짜
                          </th>
                          <th
                            style={{
                              padding: "12px 10px",
                              textAlign: "left",
                              fontWeight: "600",
                              color: "#475569",
                            }}
                          >
                            상태
                          </th>
                          <th
                            style={{
                              padding: "12px 10px",
                              textAlign: "left",
                              fontWeight: "600",
                              color: "#475569",
                            }}
                          >
                            시각
                          </th>
                          <th
                            style={{
                              padding: "12px 10px",
                              textAlign: "right",
                              fontWeight: "600",
                              color: "#475569",
                            }}
                          >
                            지각비
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.attendance.map((row) => {
                          const excused = !!row.late_fee_excused;
                          const displayLateFee = excused ? 0 : (row.late_fee ?? 0);
                          return (
                            <tr
                              key={row.id}
                              style={{ borderTop: "1px solid #f1f5f9" }}
                            >
                              <td style={{ padding: "12px 10px", color: "#1e293b" }}>
                                {formatDate(row.week_date)}
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                {statusLabel(row.status)}
                                {excused && row.late_fee ? " (예외)" : ""}
                              </td>
                              <td style={{ padding: "12px 10px", color: "#64748b" }}>
                                {formatTime(row.attended_at)}
                              </td>
                              <td style={{ padding: "12px 10px", textAlign: "right" }}>
                                {displayLateFee > 0
                                  ? `${displayLateFee.toLocaleString()}원`
                                  : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {data.attendance.some(
                    (r) => r.note && r.note.trim() !== ""
                  ) && (
                    <details
                      style={{
                        marginTop: "10px",
                        fontSize: "13px",
                        color: "#64748b",
                      }}
                    >
                      <summary style={{ cursor: "pointer" }}>비고 보기</summary>
                      <ul style={{ margin: "8px 0 0", paddingLeft: "18px" }}>
                        {data.attendance
                          .filter((r) => r.note && r.note.trim() !== "")
                          .map((r) => (
                            <li key={r.id}>
                              {formatDate(r.week_date)}: {r.note}
                            </li>
                          ))}
                      </ul>
                    </details>
                  )}
                </>
              )}
            </div>

            {/* 정산 내역 */}
            {data.settlements.length > 0 && (
              <div>
                <div style={sectionTitle}>정산 내역</div>
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "12px 14px",
                  }}
                >
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "14px" }}>
                    {data.settlements.map((row) => (
                      <li
                        key={row.id}
                        style={{
                          marginBottom: "6px",
                          color: "#475569",
                          listStyle: "disc",
                        }}
                      >
                        {formatDateTime(row.settled_at)} ·{" "}
                        <strong>{row.amount.toLocaleString()}원</strong>
                        {row.note ? ` (${row.note})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
