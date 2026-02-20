"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import * as S from "../users/style";

// "1월 20일", "1/20" 형태를 현재 연도 기준 YYYY-MM-DD로 파싱
function parseMonthDay(input: string, year?: number): string | null {
  const y = year ?? dayjs().year();
  const trimmed = input.trim().replace(/\s/g, "");
  const match1 = trimmed.match(/^(\d{1,2})월\s*(\d{1,2})일?$/);
  const match2 = trimmed.match(/^(\d{1,2})\/(\d{1,2})$/);
  const m = match1 ? [match1[1], match1[2]] : match2 ? [match2[1], match2[2]] : null;
  if (!m) return null;
  const month = parseInt(m[0], 10);
  const day = parseInt(m[1], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = dayjs(`${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  return d.isValid() ? d.format("YYYY-MM-DD") : null;
}

const CELL_SIZE = 14;
const COL_WIDTH = 22;
const ROW_HEIGHT = 22;
const ROW_HEIGHT_HEADER = 24;
const FEE_COLORS: Record<number, string> = {
  0: "#39d353",
  1000: "#9be9a8",
  2000: "#40c463",
  3000: "#30a14e",
  4000: "#216e39",
  5000: "#0e4429",
};
const NO_DATA_COLOR = "#ebedf0";
const LABEL_WIDTH = 140;

function getCellColor(fee: number | null): string {
  if (fee === null) return NO_DATA_COLOR;
  return FEE_COLORS[fee as keyof typeof FEE_COLORS] ?? "#9be9a8";
}

export default function AttendanceOverallStats() {
  const [start, setStart] = useState(dayjs().startOf("year").format("YYYY-MM-DD"));
  const [end, setEnd] = useState(dayjs().format("YYYY-MM-DD"));
  const [extraDates, setExtraDates] = useState<string[]>([]);
  const [addDateInput, setAddDateInput] = useState("");
  const [addDateError, setAddDateError] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin-attendance-overall-stats", start, end],
    queryFn: async () => {
      const res = await fetch(`/api/admin/attendance/overall-stats?start=${start}&end=${end}`);
      if (!res.ok) throw new Error("조회 실패");
      return res.json();
    },
  });

  const apiWeekDates = data?.weekDates ?? [];
  const rows = data?.rows ?? [];
  const quarterlyTotals = data?.quarterlyTotals ?? [];

  const allDates = useMemo(() => {
    const set = new Set<string>([...apiWeekDates, ...extraDates]);
    return Array.from(set).sort();
  }, [apiWeekDates, extraDates]);

  const handleAddDate = () => {
    setAddDateError("");
    const parsed = parseMonthDay(addDateInput, dayjs(start).year());
    if (parsed) {
      if (allDates.includes(parsed)) {
        setAddDateError("이미 추가된 날짜입니다.");
        return;
      }
      setExtraDates((prev) => [...prev, parsed].sort());
      setAddDateInput("");
    } else {
      const asDate = addDateInput.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(asDate)) {
        if (allDates.includes(asDate)) {
          setAddDateError("이미 추가된 날짜입니다.");
          return;
        }
        setExtraDates((prev) => [...prev, asDate].sort());
        setAddDateInput("");
      } else {
        setAddDateError('예: 1월 20일, 1/20, 2024-01-20');
      }
    }
  };

  const removeAddedDate = (date: string) => {
    setExtraDates((prev) => prev.filter((d) => d !== date));
  };

  const runImport = async () => {
    let rows: { name: string; group_name?: string; cell_name?: string; week_date: string; late_fee: number }[];
    try {
      rows = JSON.parse(importJson || "[]");
    } catch {
      setImportResult("JSON 형식이 올바르지 않습니다.");
      return;
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      setImportResult("rows 배열을 입력해주세요.");
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/attendance/import-weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult(`완료: 신규 ${data.inserted}건, 수정 ${data.updated}건${data.notFound?.length ? ` · 매칭 안 됨: ${data.notFound.slice(0, 5).join(", ")}${data.notFound.length > 5 ? "…" : ""}` : ""}`);
        setImportJson("");
        refetch();
      } else {
        setImportResult(data.error || "이관 실패");
      }
    } catch (e) {
      setImportResult(`오류: ${(e as Error)?.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <S.Header>
        <S.HeaderLeft>
          <S.Title>📊 OD 출석 전체 통계</S.Title>
          <S.Subtitle>GitHub 잔디처럼 한눈에 보는 주차별 지각비 현황</S.Subtitle>
        </S.HeaderLeft>
      </S.Header>

      <S.Container>
        {/* 기간 선택 + 날짜 추가 */}
        <div
          style={{
            marginBottom: 16,
            padding: "14px 18px",
            background: "#f6f8fa",
            border: "1px solid #d0d7de",
            borderRadius: 10,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 16,
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#24292f" }}>시작일</span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={{
                padding: "6px 10px",
                border: "1px solid #d0d7de",
                borderRadius: 6,
                fontSize: 13,
                background: "#fff",
              }}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#24292f" }}>종료일</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              style={{
                padding: "6px 10px",
                border: "1px solid #d0d7de",
                borderRadius: 6,
                fontSize: 13,
                background: "#fff",
              }}
            />
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="text"
              value={addDateInput}
              onChange={(e) => setAddDateInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddDate()}
              placeholder="1월 20일 또는 2024-01-20"
              style={{
                width: 180,
                padding: "6px 10px",
                border: "1px solid #d0d7de",
                borderRadius: 6,
                fontSize: 13,
                background: "#fff",
              }}
            />
            <button
              type="button"
              onClick={handleAddDate}
              style={{
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: "#238636",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              날짜 추가
            </button>
          </div>
          {addDateError && (
            <span style={{ fontSize: 12, color: "#cf222e" }}>{addDateError}</span>
          )}
          {isRefetching && <span style={{ fontSize: 12, color: "#57606a" }}>갱신 중…</span>}
        </div>

        {/* 사용자 추가 날짜 태그 (제거 가능) */}
        {extraDates.length > 0 && (
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, color: "#57606a" }}>추가한 날짜:</span>
            {extraDates.map((d) => (
              <span
                key={d}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                  background: "#ddf4ff",
                  border: "1px solid #54aeff",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                {dayjs(d).format("M월 D일")}
                <button
                  type="button"
                  onClick={() => removeAddedDate(d)}
                  style={{
                    padding: 0,
                    margin: 0,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: "#0969da",
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                  aria-label="제거"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* 엑셀 이관 */}
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setImportOpen((o) => !o)}
            style={{
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "#0969da",
              background: "#fff",
              border: "1px solid #54aeff",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {importOpen ? "▲ 엑셀 이관 접기" : "▼ 엑셀 이관 (JSON 붙여넣기)"}
          </button>
          {importOpen && (
            <div
              style={{
                marginTop: 10,
                padding: 14,
                background: "#f6f8fa",
                border: "1px solid #d0d7de",
                borderRadius: 8,
              }}
            >
              <p style={{ fontSize: 12, color: "#57606a", margin: "0 0 8px 0" }}>
                rows 배열 JSON. 예: {`[{"name":"홍길동","week_date":"2024-01-20","late_fee":0}]`}
              </p>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='[{"name":"이름","week_date":"2024-01-20","late_fee":0}, ...]'
                rows={4}
                style={{
                  width: "100%",
                  maxWidth: 560,
                  padding: 10,
                  border: "1px solid #d0d7de",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={runImport}
                  disabled={importing}
                  style={{
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    background: importing ? "#8b949e" : "#238636",
                    border: "none",
                    borderRadius: 6,
                    cursor: importing ? "not-allowed" : "pointer",
                  }}
                >
                  {importing ? "이관 중…" : "이관 실행"}
                </button>
                {importResult && (
                  <span style={{ fontSize: 12, color: importResult.startsWith("완료") ? "#1a7f37" : "#cf222e" }}>
                    {importResult}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 분기별 납부 현황 - 한 줄로 컴팩트 */}
        {quarterlyTotals.length > 0 && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              background: "#ddf4ff",
              border: "1px solid #54aeff",
              borderRadius: 8,
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 20px",
              fontSize: 13,
            }}
          >
            {quarterlyTotals.map((q: { quarter: string; total: number }) => (
              <span key={q.quarter} style={{ color: "#0969da" }}>
                <strong>{q.quarter}</strong> {q.total.toLocaleString()}원
              </span>
            ))}
          </div>
        )}

        {/* 범례 (잔디 색상 설명) */}
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 12,
            color: "#57606a",
          }}
        >
          <span>적음</span>
          <div style={{ display: "flex", gap: 2 }}>
            {[0, 1000, 2000, 3000, 4000, 5000].map((fee) => (
              <span
                key={fee}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  borderRadius: 3,
                  background: getCellColor(fee),
                  border: "1px solid #d0d7de",
                }}
                title={fee === 0 ? "출석(0원)" : `${fee.toLocaleString()}원`}
              />
            ))}
          </div>
          <span>많음</span>
          <span style={{ marginLeft: 8 }}>
            <span
              style={{
                display: "inline-block",
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderRadius: 3,
                background: NO_DATA_COLOR,
                border: "1px solid #d0d7de",
                verticalAlign: "middle",
                marginRight: 4,
              }}
            />
            미기록
          </span>
        </div>

        {/* 잔디 그리드: 한 행에 이름 + 해당 잔디 셀만 있어서 항상 정렬됨 */}
        {isLoading ? (
          <S.LoadingState>
            <S.Spinner />
            <p>전체 통계를 불러오는 중…</p>
          </S.LoadingState>
        ) : rows.length === 0 ? (
          <S.EmptyState>
            <S.EmptyText>해당 기간 OD 명단이 없거나 출석 데이터가 없습니다.</S.EmptyText>
          </S.EmptyState>
        ) : (
          <div
            style={{
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: "70vh",
              border: "1px solid #d0d7de",
              borderRadius: 8,
              background: "#fff",
            }}
          >
            <div style={{ minWidth: "max-content" }}>
              {/* 헤더 행: 이름 열 + 날짜 열들 */}
              <div
                style={{
                  display: "flex",
                  flexShrink: 0,
                  borderBottom: "1px solid #d0d7de",
                  background: "#f6f8fa",
                  position: "sticky",
                  top: 0,
                  zIndex: 3,
                }}
              >
                <div
                  style={{
                    width: LABEL_WIDTH,
                    minWidth: LABEL_WIDTH,
                    flexShrink: 0,
                    height: ROW_HEIGHT_HEADER,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 8,
                    fontSize: 11,
                    color: "#57606a",
                    fontWeight: 600,
                    borderRight: "1px solid #d0d7de",
                  }}
                >
                  이름 · 그룹 / 다락방
                </div>
                {allDates.map((w) => (
                  <div
                    key={w}
                    style={{
                      width: COL_WIDTH,
                      minWidth: COL_WIDTH,
                      height: ROW_HEIGHT_HEADER,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      color: "#57606a",
                    }}
                  >
                    {dayjs(w).format("M/D")}
                  </div>
                ))}
              </div>
              {/* 데이터 행: 한 사람당 한 행에 이름 + 잔디 셀 */}
              {rows.map((row: any) => (
                <div
                  key={row.user_id}
                  style={{
                    display: "flex",
                    flexShrink: 0,
                    borderBottom: "1px solid #eaeef2",
                    height: ROW_HEIGHT,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: LABEL_WIDTH,
                      minWidth: LABEL_WIDTH,
                      flexShrink: 0,
                      height: ROW_HEIGHT,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 8,
                      fontSize: 11,
                      color: "#24292f",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      borderRight: "1px solid #d0d7de",
                      background: "#fff",
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                    }}
                    title={`${row.name} · ${row.group_name} / ${row.cell_name}${row.is_group_leader ? " (그룹장)" : row.is_cell_leader ? " (다락방장)" : ""}`}
                  >
                    {row.name}
                    {(row.is_group_leader || row.is_cell_leader) && (
                      <span style={{ color: "#0969da", marginLeft: 4 }}>
                        {row.is_group_leader ? "G" : "C"}
                      </span>
                    )}
                  </div>
                  {allDates.map((w) => {
                    const fee = row.weeklyFees?.[w] ?? null;
                    const color = getCellColor(fee);
                    const label =
                      fee === null
                        ? "미기록"
                        : fee === 0
                          ? "출석 0원"
                          : `${fee.toLocaleString()}원`;
                    return (
                      <div
                        key={w}
                        style={{
                          width: COL_WIDTH,
                          minWidth: COL_WIDTH,
                          height: ROW_HEIGHT,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                        title={`${dayjs(w).format("YYYY년 M월 D일")} · ${row.name} · ${label}`}
                      >
                        <span
                          style={{
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                            borderRadius: 3,
                            background: color,
                            border: "1px solid #d0d7de",
                            cursor: "default",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </S.Container>
    </>
  );
}
