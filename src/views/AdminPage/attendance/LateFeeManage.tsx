"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import * as S from "../users/style";

export default function LateFeeManage() {
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNote, setSettleNote] = useState("");
  const [settleSubmitting, setSettleSubmitting] = useState(false);

  // ── 필터 상태 ──
  const [searchName, setSearchName] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterCell, setFilterCell] = useState("");

  const { data: listData, isLoading } = useQuery({
    queryKey: ["admin-late-fees"],
    queryFn: async () => {
      const res = await fetch("/api/admin/attendance/late-fees");
      if (!res.ok) throw new Error("조회 실패");
      return res.json();
    },
  });

  const queryClient = useQueryClient();
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-late-fees-detail", detailUserId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/attendance/late-fees?userId=${detailUserId}`);
      if (!res.ok) throw new Error("조회 실패");
      return res.json();
    },
    enabled: !!detailUserId,
  });

  useEffect(() => {
    if (detailUserId && detailData?.totalLateFee != null && settleModalOpen) {
      setSettleAmount(String(detailData.totalLateFee));
    }
  }, [detailUserId, detailData?.totalLateFee, settleModalOpen]);

  const openSettleModal = () => {
    setSettleAmount(String(totalLateFee));
    setSettleNote("");
    setSettleModalOpen(true);
  };

  const submitSettle = async () => {
    if (!detailUserId) return;
    const amountNum = parseInt(settleAmount, 10);
    if (Number.isNaN(amountNum) || amountNum < 0) {
      alert("0 이상의 금액을 입력해주세요.");
      return;
    }
    setSettleSubmitting(true);
    try {
      const res = await fetch("/api/admin/attendance/late-fees/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: detailUserId,
          amount: amountNum,
          note: settleNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSettleModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ["admin-late-fees-detail", detailUserId] });
        queryClient.invalidateQueries({ queryKey: ["admin-late-fees"] });
        alert(data.message || "정산 기록되었습니다.");
      } else {
        alert(data.error || "저장 실패");
      }
    } catch {
      alert("오류가 발생했습니다.");
    } finally {
      setSettleSubmitting(false);
    }
  };

  const list: any[] = listData?.data || [];
  const stats = listData?.stats || {};
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
            onClick={exportCsv}
            style={{ padding: "8px 16px", background: "#1d4ed8", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginLeft: "auto" }}
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
                  <S.TableRow key={item.user_id}>
                    <S.TableData><span style={{ fontWeight: "600" }}>{item.name}</span></S.TableData>
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
                      <button
                        type="button"
                        onClick={() => setDetailUserId(item.user_id)}
                        style={{ padding: "6px 14px", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                      >
                        상세보기
                      </button>
                    </S.TableData>
                  </S.TableRow>
                ))}
              </tbody>
            </S.Table>
          </S.TableContainer>
        )}
      </S.Container>

      {/* 상세 로그 모달 */}
      {detailUserId && (
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
          onClick={() => setDetailUserId(null)}
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
                {detailName} 지각비 로그
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
                  onClick={() => setDetailUserId(null)}
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
      {settleModalOpen && detailUserId && (
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
    </>
  );
}
