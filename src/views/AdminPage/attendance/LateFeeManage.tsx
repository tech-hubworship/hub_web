"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import * as S from "../users/style";

const QUARTER_LABELS: Record<string, string> = {
  "": "전체",
  "1": "1분기",
  "2": "2분기",
  "3": "3분기",
  "4": "4분기",
};
const QUARTER_DATES: Record<string, string> = {
  "": "",
  "1": "25.11.15~26.1.15",
  "2": "26.1.24~4.25",
  "3": "26.4.30~7.25",
  "4": "26.7.30~",
};

export default function LateFeeManage() {
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailManualId, setDetailManualId] = useState<string | null>(null);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNote, setSettleNote] = useState("");
  const [settleSubmitting, setSettleSubmitting] = useState(false);

  // 수동 추가 모달
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addGroup, setAddGroup] = useState("");
  const [addCell, setAddCell] = useState("");
  const [addNote, setAddNote] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  // ── 분기 필터 ──
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");

  // ── 필터 상태 ──
  const [searchName, setSearchName] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterCell, setFilterCell] = useState("");

  const { data: listData, isLoading } = useQuery({
    queryKey: ["admin-late-fees", selectedQuarter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedQuarter) params.set("quarter", selectedQuarter);
      const res = await fetch(`/api/admin/attendance/late-fees${params.toString() ? "?" + params.toString() : ""}`);
      if (!res.ok) throw new Error("조회 실패");
      return res.json();
    },
  });

  const queryClient = useQueryClient();
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-late-fees-detail", detailUserId, detailManualId, selectedQuarter],
    queryFn: async () => {
      const qParam = selectedQuarter ? `&quarter=${selectedQuarter}` : "";
      if (detailManualId) {
        const res = await fetch(`/api/admin/attendance/late-fees?manualId=${detailManualId}`);
        if (!res.ok) throw new Error("조회 실패");
        return res.json();
      }
      const res = await fetch(`/api/admin/attendance/late-fees?userId=${detailUserId}${qParam}`);
      if (!res.ok) throw new Error("조회 실패");
      return res.json();
    },
    enabled: !!(detailUserId || detailManualId),
  });

  useEffect(() => {
    if ((detailUserId || detailManualId) && detailData?.totalLateFee != null && settleModalOpen) {
      setSettleAmount(String(detailData.remaining ?? detailData.totalLateFee));
    }
  }, [detailUserId, detailManualId, detailData?.totalLateFee, detailData?.remaining, settleModalOpen]);

  const openSettleModal = () => {
    setSettleAmount(String(remaining));
    setSettleNote("");
    setSettleModalOpen(true);
  };

  const submitSettle = async () => {
    if (!detailUserId && !detailManualId) return;
    const amountNum = parseInt(settleAmount, 10);
    if (Number.isNaN(amountNum) || amountNum < 0) {
      alert("0 이상의 금액을 입력해주세요.");
      return;
    }
    setSettleSubmitting(true);
    try {
      let res: Response;
      if (detailManualId) {
        // 수동 항목 정산
        res = await fetch("/api/admin/attendance/late-fees", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ manual_id: detailManualId, settled: amountNum }),
        });
      } else {
        res = await fetch("/api/admin/attendance/late-fees/settle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: detailUserId, amount: amountNum, note: settleNote.trim() || undefined }),
        });
      }
      const data = await res.json();
      if (res.ok) {
        setSettleModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ["admin-late-fees-detail", detailUserId, detailManualId, selectedQuarter] });
        queryClient.invalidateQueries({ queryKey: ["admin-late-fees", selectedQuarter] });
        alert("정산 기록되었습니다.");
      } else {
        alert(data.error || "저장 실패");
      }
    } catch {
      alert("오류가 발생했습니다.");
    } finally {
      setSettleSubmitting(false);
    }
  };

  const submitAdd = async () => {
    if (!addName.trim() || !addAmount) { alert("이름과 금액을 입력해주세요."); return; }
    setAddSubmitting(true);
    try {
      const res = await fetch("/api/admin/attendance/late-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName.trim(), amount: Number(addAmount), group_name: addGroup || undefined, cell_name: addCell || undefined, note: addNote || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddModalOpen(false);
        setAddName(""); setAddAmount(""); setAddGroup(""); setAddCell(""); setAddNote("");
        queryClient.invalidateQueries({ queryKey: ["admin-late-fees", selectedQuarter] });
      } else {
        alert(data.error || "추가 실패");
      }
    } catch {
      alert("오류가 발생했습니다.");
    } finally {
      setAddSubmitting(false);
    }
  };

  const deleteManual = async (manual_id: string, name: string) => {
    if (!confirm(`"${name}" 항목을 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/attendance/late-fees?manual_id=${manual_id}`, { method: "DELETE" });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["admin-late-fees"] });
    } else {
      alert("삭제 실패");
    }
  };

  const list: any[] = listData?.data || [];
  const stats = listData?.stats || {};
  const groupStats: any[] = listData?.groupStats || [];
  const unpaidSummaryText: string = listData?.unpaidSummaryText || "";
  const detailLogs = detailData?.logs || [];
  const detailSettlements = detailData?.settlements || [];
  const detailName = detailData?.name || "-";
  const totalLateFee = detailData?.totalLateFee ?? 0;
  const totalSettled = detailData?.totalSettled ?? 0;
  const remaining = (detailData?.remaining ?? Math.max(0, totalLateFee - totalSettled)) as number;

  // ── 그룹/다락방 목록 추출 ──
  const groupOptions = useMemo(() => {
    const set = new Set<string>();
    list.forEach((item) => { if (item.group_name && item.group_name !== "-") set.add(item.group_name); });
    return Array.from(set).sort();
  }, [list]);

  const cellOptions = useMemo(() => {
    const set = new Set<string>();
    list.forEach((item) => {
      if (item.cell_name && item.cell_name !== "-") {
        if (!filterGroup || item.group_name === filterGroup) set.add(item.cell_name);
      }
    });
    return Array.from(set).sort();
  }, [list, filterGroup]);

  // ── 필터링된 목록 ──
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      if (searchName && !item.name?.includes(searchName)) return false;
      if (filterGroup && item.group_name !== filterGroup) return false;
      if (filterCell && item.cell_name !== filterCell) return false;
      return true;
    });
  }, [list, searchName, filterGroup, filterCell]);

  // ── 엑셀(CSV) 다운로드 ──
  const exportCsv = () => {
    const rows = [
      ["이름", "그룹", "다락방", "지각비", "정산된 지각비", "잔여 지각비"],
      ...filteredList.map((item) => [
        item.name,
        item.group_name,
        item.cell_name,
        item.total_late_fee,
        item.total_settled ?? 0,
        item.remaining ?? item.total_late_fee,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `지각비_${dayjs().format("YYYYMMDD")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <S.Header>
        <S.HeaderLeft>
          <S.Title>💰 지각비 관리</S.Title>
          <S.Subtitle>OD 명단 회원별 지각비 현황 및 상세 로그</S.Subtitle>
        </S.HeaderLeft>
      </S.Header>

      <S.Container>
        {/* ── 분기 탭 ── */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
          {Object.entries(QUARTER_LABELS).map(([q, label]) => (
            <button
              key={q}
              onClick={() => { setSelectedQuarter(q); setSearchName(""); setFilterGroup(""); setFilterCell(""); }}
              style={{
                padding: "8px 16px",
                background: selectedQuarter === q ? "#2563eb" : "#f1f5f9",
                color: selectedQuarter === q ? "white" : "#475569",
                border: selectedQuarter === q ? "none" : "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: selectedQuarter === q ? "700" : "500",
                cursor: "pointer",
              }}
            >
              {label}
              {QUARTER_DATES[q] && (
                <span style={{ marginLeft: "6px", fontSize: "11px", opacity: 0.75 }}>
                  {QUARTER_DATES[q]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 요약 통계 */}
        {stats.totalMembers !== undefined && (
          <div style={{ marginBottom: "20px", padding: "20px", background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: 0 }}>📊 지각비 요약</h3>
            <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "#64748b" }}>지각비 발생 인원</div>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#2563eb" }}>{stats.membersWithLateFee || 0}명</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "#64748b" }}>총 지각비</div>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#dc2626" }}>{(stats.totalLateFee || 0).toLocaleString()}원</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "#64748b" }}>정산된 지각비</div>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#16a34a" }}>{(stats.totalSettled ?? 0).toLocaleString()}원</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "#64748b" }}>미정산 지각비</div>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#ea580c" }}>{(stats.totalUnsettled ?? 0).toLocaleString()}원</div>
              </div>
            </div>
          </div>
        )}

        {/* ── 그룹별 통계 ── */}
        {groupStats.length > 0 && (
          <div style={{ marginBottom: "20px", padding: "20px", background: "white", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#1e293b", margin: "0 0 14px 0" }}>
              📊 그룹별 지각비 현황
              {selectedQuarter && <span style={{ marginLeft: "8px", fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>{QUARTER_LABELS[selectedQuarter]} ({QUARTER_DATES[selectedQuarter]})</span>}
            </h3>

            {/* 미납 현황 텍스트 + 복사 버튼 */}
            {unpaidSummaryText && (
              <div style={{ marginBottom: "16px", padding: "14px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <pre style={{ margin: 0, fontSize: "13px", lineHeight: "1.8", color: "#1e293b", fontFamily: "inherit", whiteSpace: "pre-wrap" }}>
                  {unpaidSummaryText}
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(unpaidSummaryText).then(() => alert("복사되었습니다!"))}
                  style={{ padding: "6px 14px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  📋 복사
                </button>
              </div>
            )}

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["그룹", "전체 인원", "미납 인원", "총 지각비", "정산 완료", "미정산"].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: h === "그룹" ? "left" : "right", fontWeight: "600", color: "#475569", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupStats.map((g: any) => (
                    <tr key={g.group_name} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 12px", fontWeight: "600", color: "#1e293b" }}>{g.group_name}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "#475569" }}>{g.total_members}명</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <span style={{ color: g.unpaid_count > 0 ? "#dc2626" : "#16a34a", fontWeight: "700" }}>{g.unpaid_count}명</span>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "#dc2626", fontWeight: "600" }}>{g.total_late_fee.toLocaleString()}원</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "#16a34a", fontWeight: "600" }}>{g.total_settled.toLocaleString()}원</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: g.remaining > 0 ? "#ea580c" : "#16a34a", fontWeight: "700" }}>{g.remaining.toLocaleString()}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 검색 / 필터 / 엑셀 ── */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="이름 검색"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", minWidth: "140px", flex: "1" }}
          />
          <select
            value={filterGroup}
            onChange={(e) => { setFilterGroup(e.target.value); setFilterCell(""); }}
            style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", minWidth: "130px" }}
          >
            <option value="">전체 그룹</option>
            {groupOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select
            value={filterCell}
            onChange={(e) => setFilterCell(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", minWidth: "130px" }}
          >
            <option value="">전체 다락방</option>
            {cellOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {(searchName || filterGroup || filterCell) && (
            <button
              onClick={() => { setSearchName(""); setFilterGroup(""); setFilterCell(""); }}
              style={{ padding: "8px 12px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", cursor: "pointer", color: "#64748b" }}
            >
              초기화
            </button>
          )}
          <button
            onClick={() => setAddModalOpen(true)}
            style={{ padding: "8px 16px", background: "#059669", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
          >
            + 수동 추가
          </button>
          <button
            onClick={exportCsv}
            style={{ padding: "8px 16px", background: "#1d4ed8", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
          >
            📥 엑셀 다운로드
          </button>
        </div>

        {/* 필터 결과 카운트 */}
        {(searchName || filterGroup || filterCell) && (
          <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "10px" }}>
            검색 결과: <strong>{filteredList.length}</strong>명 / 전체 {list.length}명
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>데이터를 불러오는 중...</div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #e2e8f0" }}>
            {list.length === 0 ? "지각비가 발생한 회원이 없습니다." : "검색 결과가 없습니다."}
          </div>
        ) : (
          <S.TableContainer>
            <S.Table>
              <S.TableHeader>
                <S.TableRow>
                  <S.TableHead>이름</S.TableHead>
                  <S.TableHead>소속 (그룹 / 다락방)</S.TableHead>
                  <S.TableHead>지각비</S.TableHead>
                  <S.TableHead>정산된 지각비</S.TableHead>
                  <S.TableHead>잔여 지각비</S.TableHead>
                  <S.TableHead>상세</S.TableHead>
                </S.TableRow>
              </S.TableHeader>
              <tbody>
                {filteredList.map((item: any) => (
                  <S.TableRow key={item.user_id || item.manual_id}>
                    <S.TableData>
                      <span style={{ fontWeight: "600" }}>{item.name}</span>
                      {item.isManual && (
                        <span style={{ marginLeft: "6px", fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>수동</span>
                      )}
                    </S.TableData>
                    <S.TableData>{item.group_name || "-"} / {item.cell_name || "-"}</S.TableData>
                    <S.TableData>
                      <span style={{ color: "#dc2626", fontWeight: "bold" }}>{item.total_late_fee.toLocaleString()}원</span>
                    </S.TableData>
                    <S.TableData>
                      <span style={{ color: "#15803d", fontWeight: "600" }}>{(item.total_settled ?? 0).toLocaleString()}원</span>
                    </S.TableData>
                    <S.TableData>
                      <span style={{ color: (item.remaining ?? item.total_late_fee) > 0 ? "#dc2626" : "#16a34a", fontWeight: "bold" }}>
                        {(item.remaining ?? item.total_late_fee).toLocaleString()}원
                      </span>
                    </S.TableData>
                    <S.TableData>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (item.isManual) { setDetailManualId(item.manual_id); setDetailUserId(null); }
                            else { setDetailUserId(item.user_id); setDetailManualId(null); }
                          }}
                          style={{ padding: "6px 14px", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                        >
                          상세보기
                        </button>
                        {item.isManual && (
                          <button
                            type="button"
                            onClick={() => deleteManual(item.manual_id, item.name)}
                            style={{ padding: "6px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </S.TableData>
                  </S.TableRow>
                ))}
              </tbody>
            </S.Table>
          </S.TableContainer>
        )}
      </S.Container>

      {/* 상세 로그 모달 */}
      {(detailUserId || detailManualId) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => { setDetailUserId(null); setDetailManualId(null); }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "560px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
                {detailName} 지각비 {detailData?.isManual ? "내역" : "로그"}
              </h3>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={openSettleModal}
                  style={{
                    padding: "6px 12px",
                    background: "#059669",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  정산하기
                </button>
                <button
                  type="button"
                  onClick={() => { setDetailUserId(null); setDetailManualId(null); }}
                  style={{
                    padding: "6px 12px",
                    background: "#e2e8f0",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  닫기
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                로딩 중...
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div
                    style={{
                      padding: "12px",
                      background: "#eff6ff",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontWeight: "bold",
                      color: "#1e40af",
                    }}
                  >
                    <span>지각비 합계</span>
                    <span>{detailData?.totalLateFee?.toLocaleString() || 0}원</span>
                  </div>
                  {totalSettled > 0 && (
                    <div
                      style={{
                        padding: "12px",
                        background: "#ecfdf5",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontWeight: "bold",
                        color: "#047857",
                      }}
                    >
                      <span>정산된 지각비</span>
                      <span>-{totalSettled.toLocaleString()}원</span>
                    </div>
                  )}
                  <div
                    style={{
                      padding: "12px",
                      background: remaining > 0 ? "#fef2f2" : "#f0fdf4",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontWeight: "bold",
                      color: remaining > 0 ? "#dc2626" : "#16a34a",
                    }}
                  >
                    <span>남은 지각비</span>
                    <span>{remaining.toLocaleString()}원</span>
                  </div>
                </div>

                {(() => {
                  const logEntries: { type: "late_fee" | "settlement"; sortKey: string; data: any }[] = [];
                  (detailLogs || []).forEach((log: any) => {
                    logEntries.push({
                      type: "late_fee",
                      sortKey: dayjs(log.week_date).valueOf().toString().padStart(14) + "0",
                      data: log,
                    });
                  });
                  (detailSettlements || []).forEach((s: any) => {
                    logEntries.push({
                      type: "settlement",
                      sortKey: dayjs(s.settled_at).valueOf().toString().padStart(14) + "1",
                      data: s,
                    });
                  });
                  logEntries.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
                  if (logEntries.length === 0) {
                    return (
                      <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                        지각비·정산 내역이 없습니다.
                      </div>
                    );
                  }
                  return (
                    <>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "10px" }}>
                        내역 (지각비 · 정산 통합)
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {logEntries.map((entry, idx) =>
                        entry.type === "late_fee" ? (
                          <div
                            key={`log-${entry.data.id}`}
                            style={{
                              padding: "12px 16px",
                              background: "#f8fafc",
                              borderRadius: "8px",
                              borderLeft: "4px solid #dc2626",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: "12px",
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: "600", color: "#1e293b" }}>
                                {dayjs(entry.data.week_date).format("YYYY-MM-DD")}
                              </span>
                              <span style={{ marginLeft: "8px", color: "#64748b", fontSize: "12px" }}>지각비</span>
                              {entry.data.attended_at && (
                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                  출석 {dayjs(entry.data.attended_at).format("HH:mm:ss")}
                                  {entry.data.updated_by ? ` · ${entry.data.updated_by}` : ""}
                                </div>
                              )}
                              {entry.data.note && (
                                <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>{entry.data.note}</div>
                              )}
                            </div>
                            <span style={{ color: "#dc2626", fontWeight: "bold", whiteSpace: "nowrap" }}>
                              +{entry.data.late_fee?.toLocaleString()}원
                            </span>
                          </div>
                        ) : (
                          <div
                            key={`set-${entry.data.id}`}
                            style={{
                              padding: "12px 16px",
                              background: "#f0fdf4",
                              borderRadius: "8px",
                              borderLeft: "4px solid #22c55e",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: "12px",
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: "600", color: "#166534" }}>
                                {dayjs(entry.data.settled_at).format("YYYY-MM-DD HH:mm")}
                              </span>
                              <span style={{ marginLeft: "8px", color: "#64748b", fontSize: "12px" }}>정산</span>
                              {entry.data.settled_by && (
                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                  by {entry.data.settled_by}
                                </div>
                              )}
                              {entry.data.note && (
                                <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>{entry.data.note}</div>
                              )}
                            </div>
                            <span style={{ color: "#15803d", fontWeight: "bold", whiteSpace: "nowrap" }}>
                              -{Number(entry.data.amount).toLocaleString()}원
                            </span>
                          </div>
                        )
                      )}
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

      {/* 정산하기 모달 */}
      {settleModalOpen && (detailUserId || detailManualId) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
          onClick={() => !settleSubmitting && setSettleModalOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 16px 0" }}>
              지각비 정산 기록
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "4px" }}>
                  금액 (원)
                </label>
                <input
                  type="number"
                  min={0}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder={String(totalLateFee)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    width: "100%",
                  }}
                />
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  미입력 시 지각비 합계 {totalLateFee.toLocaleString()}원
                </span>
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "4px" }}>
                  비고 (선택)
                </label>
                <input
                  type="text"
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  placeholder="예: 현금 정산 완료"
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    width: "100%",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => !settleSubmitting && setSettleModalOpen(false)}
                  style={{
                    padding: "10px 20px",
                    background: "#e2e8f0",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={submitSettle}
                  disabled={settleSubmitting}
                  style={{
                    padding: "10px 20px",
                    background: settleSubmitting ? "#94a3b8" : "#059669",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: settleSubmitting ? "not-allowed" : "pointer",
                    fontWeight: "600",
                  }}
                >
                  {settleSubmitting ? "저장 중…" : "정산 기록"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수동 추가 모달 */}
      {addModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }}
          onClick={() => !addSubmitting && setAddModalOpen(false)}
        >
          <div
            style={{ background: "white", borderRadius: "12px", padding: "24px", maxWidth: "400px", width: "90%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 16px 0" }}>수동 지각비 추가</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "이름 *", value: addName, setter: setAddName, placeholder: "이름 입력" },
                { label: "금액 (원) *", value: addAmount, setter: setAddAmount, placeholder: "예: 2000", type: "number" },
                { label: "그룹", value: addGroup, setter: setAddGroup, placeholder: "예: 믿음그룹" },
                { label: "다락방", value: addCell, setter: setAddCell, placeholder: "예: 화평다락방" },
                { label: "비고", value: addNote, setter: setAddNote, placeholder: "메모 (선택)" },
              ].map(({ label, value, setter, placeholder, type }) => (
                <div key={label}>
                  <label style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "4px" }}>{label}</label>
                  <input
                    type={type || "text"}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
              <button onClick={() => setAddModalOpen(false)} style={{ padding: "8px 16px", background: "#f1f5f9", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>취소</button>
              <button
                onClick={submitAdd}
                disabled={addSubmitting}
                style={{ padding: "8px 16px", background: "#059669", color: "white", border: "none", borderRadius: "6px", cursor: addSubmitting ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600", opacity: addSubmitting ? 0.6 : 1 }}
              >
                {addSubmitting ? "추가 중..." : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
