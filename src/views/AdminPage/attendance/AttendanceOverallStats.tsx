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
const COLOR_PRESENT = "#39d353"; // 출석(0원) 녹색
const COLOR_LATE = "#eab308";    // 지각 노란색
const COLOR_UNEXCUSED = "#dc2626"; // 무단 결석 빨간색
const NO_DATA_COLOR = "#ebedf0";
const COL_GROUP = 52;
const COL_CELL = 52;
const COL_NAME = 58;

type CellData = { fee: number | null; status: string | null; late_fee_excused: boolean; report_excused: boolean; note: string | null };

function getCellStyle(cell: CellData | null): { bg: string; text?: string; isExcused?: boolean } {
  if (!cell) return { bg: NO_DATA_COLOR };
  const isExcused = cell.late_fee_excused || cell.report_excused;
  const isLate = cell.status === "late" && (cell.fee == null || cell.fee > 0);
  if (isExcused && isLate) return { bg: COLOR_LATE, isExcused: true }; // 지각 + 예외 → 노란색에 X
  if (isExcused) return { bg: "#f1f5f9", isExcused: true };
  if (cell.status === "unexcused_absence") return { bg: COLOR_UNEXCUSED };
  if (isLate) return { bg: COLOR_LATE, text: String(Math.round((cell.fee ?? 0) / 1000)) };
  if (cell.fee === 0 || cell.status === "present") return { bg: COLOR_PRESENT };
  if (cell.fee != null && cell.fee > 0) return { bg: COLOR_LATE, text: String(Math.round(cell.fee / 1000)) };
  return { bg: NO_DATA_COLOR };
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

  // 같은 그룹 / 같은 다락방 연속 행 개수 (rowSpan용)
  const rowSpans = useMemo(() => {
    const groupSpan: number[] = [];
    const cellSpan: number[] = [];
    for (let i = 0; i < rows.length; i++) {
      let g = 1;
      while (i + g < rows.length && (rows[i + g] as any).group_name === (rows[i] as any).group_name) g++;
      groupSpan.push(g);
      let c = 1;
      while (
        i + c < rows.length &&
        (rows[i + c] as any).group_name === (rows[i] as any).group_name &&
        (rows[i + c] as any).cell_name === (rows[i] as any).cell_name
      )
        c++;
      cellSpan.push(c);
    }
    return { groupSpan, cellSpan };
  }, [rows]);

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

        {/* 범례 */}
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 12,
            color: "#57606a",
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: CELL_SIZE, height: CELL_SIZE, borderRadius: 3, background: COLOR_PRESENT, border: "1px solid #d0d7de" }} />
            출석
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: CELL_SIZE, height: CELL_SIZE, borderRadius: 3, background: COLOR_LATE, border: "1px solid #d0d7de" }} />
            지각(1~4천원→1~4)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: CELL_SIZE, height: CELL_SIZE, borderRadius: 3, background: COLOR_UNEXCUSED, border: "1px solid #d0d7de" }} />
            무단결석
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: CELL_SIZE, height: CELL_SIZE, borderRadius: 3, background: "#f1f5f9", border: "1px solid #d0d7de", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#64748b" }}>✕</span>
            예외(지각비/보고서)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: CELL_SIZE, height: CELL_SIZE, borderRadius: 3, background: NO_DATA_COLOR, border: "1px solid #d0d7de" }} />
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
            <table style={{ minWidth: "max-content", borderCollapse: "collapse", tableLayout: "fixed", width: "max-content" }}>
              <thead>
                <tr style={{ background: "#f6f8fa", position: "sticky", top: 0, zIndex: 3 }}>
                  <th style={{ width: COL_GROUP, minWidth: COL_GROUP, height: ROW_HEIGHT_HEADER, paddingLeft: 6, fontSize: 11, color: "#57606a", fontWeight: 600, border: "1px solid #d0d7de", textAlign: "left", position: "sticky", left: 0, zIndex: 4, background: "#f6f8fa" }}>
                    그룹
                  </th>
                  <th style={{ width: COL_CELL, minWidth: COL_CELL, height: ROW_HEIGHT_HEADER, paddingLeft: 6, fontSize: 11, color: "#57606a", fontWeight: 600, border: "1px solid #d0d7de", textAlign: "left", position: "sticky", left: COL_GROUP, zIndex: 4, background: "#f6f8fa" }}>
                    다락방
                  </th>
                  <th style={{ width: COL_NAME, minWidth: COL_NAME, height: ROW_HEIGHT_HEADER, paddingLeft: 6, fontSize: 11, color: "#57606a", fontWeight: 600, border: "1px solid #d0d7de", textAlign: "left", position: "sticky", left: COL_GROUP + COL_CELL, zIndex: 4, background: "#f6f8fa" }}>
                    이름
                  </th>
                  {allDates.map((w) => (
                    <th
                      key={w}
                      style={{
                        width: COL_WIDTH,
                        minWidth: COL_WIDTH,
                        height: ROW_HEIGHT_HEADER,
                        fontSize: 10,
                        color: "#57606a",
                        border: "1px solid #d0d7de",
                        fontWeight: 600,
                      }}
                    >
                      {dayjs(w).format("M/D")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, i: number) => {
                  const rowBg = row.is_group_leader ? "#eff6ff" : row.is_cell_leader ? "#fefce8" : undefined;
                  const showGroup = i === 0 || (rows[i - 1] as any).group_name !== row.group_name;
                  const showCell = i === 0 || (rows[i - 1] as any).group_name !== row.group_name || (rows[i - 1] as any).cell_name !== row.cell_name;
                  const baseTd = { paddingLeft: 6, fontSize: 11, color: "#24292f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, border: "1px solid #d0d7de", verticalAlign: "middle" };
                  return (
                    <tr key={row.user_id} style={{ background: rowBg, height: ROW_HEIGHT }}>
                      {showGroup && (
                        <td
                          rowSpan={rowSpans.groupSpan[i]}
                          style={{
                            ...baseTd,
                            width: COL_GROUP,
                            minWidth: COL_GROUP,
                            height: ROW_HEIGHT,
                            background: rowBg ?? "#fff",
                            position: "sticky",
                            left: 0,
                            zIndex: 1,
                          }}
                          title={row.group_name}
                        >
                          {row.group_name}
                        </td>
                      )}
                      {showCell && (
                        <td
                          rowSpan={rowSpans.cellSpan[i]}
                          style={{
                            ...baseTd,
                            width: COL_CELL,
                            minWidth: COL_CELL,
                            height: ROW_HEIGHT,
                            background: rowBg ?? "#fff",
                            position: "sticky",
                            left: COL_GROUP,
                            zIndex: 1,
                          }}
                          title={row.cell_name}
                        >
                          {row.cell_name}
                        </td>
                      )}
                      <td
                        style={{
                          ...baseTd,
                          width: COL_NAME,
                          minWidth: COL_NAME,
                          height: ROW_HEIGHT,
                          background: rowBg ?? "#fff",
                          position: "sticky",
                          left: COL_GROUP + COL_CELL,
                          zIndex: 1,
                        }}
                        title={`${row.name}${row.is_group_leader ? " (그룹장)" : row.is_cell_leader ? " (다락방장)" : ""}`}
                      >
                        {row.name}
                        {(row.is_group_leader || row.is_cell_leader) && (
                          <span style={{ color: "#0969da", marginLeft: 4 }}>
                            {row.is_group_leader ? "G" : "C"}
                          </span>
                        )}
                      </td>
                      {allDates.map((w) => {
                        const cell: CellData | null = row.weeklyData?.[w] ?? null;
                        const fee = row.weeklyFees?.[w] ?? null;
                        const { bg, text, isExcused } = getCellStyle(cell);
                        const label =
                          fee === null && !cell
                            ? "미기록"
                            : isExcused
                              ? `예외${cell?.note ? `: ${cell.note}` : ""}`
                              : fee === 0
                                ? "출석 0원"
                                : cell?.status === "unexcused_absence"
                                  ? "무단결석"
                                  : `${(fee ?? 0).toLocaleString()}원`;
                        return (
                          <td
                            key={w}
                            style={{
                              width: COL_WIDTH,
                              minWidth: COL_WIDTH,
                              height: ROW_HEIGHT,
                              border: "1px solid #d0d7de",
                              verticalAlign: "middle",
                              textAlign: "center",
                              padding: 0,
                            }}
                            title={`${dayjs(w).format("YYYY년 M월 D일")} · ${row.name} · ${label}`}
                          >
                            <span
                              style={{
                                width: CELL_SIZE,
                                height: CELL_SIZE,
                                borderRadius: 3,
                                background: bg,
                                border: "1px solid #d0d7de",
                                cursor: "default",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 700,
                                color: isExcused ? "#64748b" : cell?.status === "unexcused_absence" || (cell?.status === "late" && (cell?.fee ?? 0) > 0) ? "#fff" : "transparent",
                              }}
                            >
                              {isExcused ? "✕" : text ?? ""}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </S.Container>
    </>
  );
}
