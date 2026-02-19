"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as S from "../users/style";
import ManualUserSearch from "./ManualUserSearch";

export default function OdRosterManage() {
  const [category] = useState("OD");
  const [addUserId, setAddUserId] = useState("");
  const [addUserName, setAddUserName] = useState("");
  const [adding, setAdding] = useState(false);
  const [filterGroup, setFilterGroup] = useState("");
  const [filterCell, setFilterCell] = useState("");
  const [filterName, setFilterName] = useState("");
  const queryClient = useQueryClient();

  const { data: rosterData, isLoading } = useQuery({
    queryKey: ["od-roster", category],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/attendance/od-targets?category=${category}`
      );
      if (!res.ok) throw new Error("조회 실패");
      return res.json();
    },
  });

  const list = (rosterData?.data || []) as Array<{
    id: number;
    user_id: string;
    name: string | null;
    email?: string | null;
    category: string;
    group_name?: string;
    cell_name?: string;
    is_group_leader?: boolean;
    is_cell_leader?: boolean;
  }>;

  const updateLeader = async (id: number, field: "is_group_leader" | "is_cell_leader", value: boolean) => {
    try {
      const res = await fetch(`/api/admin/attendance/od-targets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["od-roster"] });
      } else {
        const data = await res.json();
        alert(data.error || "저장 실패");
      }
    } catch {
      alert("오류가 발생했습니다.");
    }
  };

  const groupOptions = Array.from(new Set(list.map((r) => r.group_name).filter((g): g is string => !!g && g !== "-"))).sort();
  const cellOptions = Array.from(new Set(list.map((r) => r.cell_name).filter((c): c is string => !!c && c !== "-"))).sort();

  const filteredList = list.filter((row) => {
    if (filterGroup && (row.group_name ?? "-") !== filterGroup) return false;
    if (filterCell && (row.cell_name ?? "-") !== filterCell) return false;
    if (filterName && !(row.name || "").toLowerCase().includes(filterName.trim().toLowerCase())) return false;
    return true;
  });

  const handleAdd = async () => {
    if (!addUserId) {
      alert("회원을 선택해주세요.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/attendance/od-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: addUserId,
          category,
          name: addUserName || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddUserId("");
        setAddUserName("");
        queryClient.invalidateQueries({ queryKey: ["od-roster"] });
      } else {
        alert(data.error || "추가 실패");
      }
    } catch {
      alert("오류가 발생했습니다.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 명단에서 제거하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/attendance/od-targets/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["od-roster"] });
      } else {
        const data = await res.json();
        alert(data.error || "삭제 실패");
      }
    } catch {
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <>
      <S.Header>
        <S.HeaderLeft>
          <S.Title>📋 OD 명단 관리</S.Title>
        </S.HeaderLeft>
      </S.Header>

      <S.Container>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-end",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <ManualUserSearch
            value={addUserId}
            displayName={addUserName}
            onSelect={(id, name) => {
              setAddUserId(id);
              setAddUserName(name);
            }}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !addUserId}
            style={{
              padding: "10px 20px",
              background: "#0284c7",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: adding || !addUserId ? "not-allowed" : "pointer",
            }}
          >
            {adding ? "추가 중…" : "명단에 추가"}
          </button>
        </div>

        {/* 그룹 / 다락방 필터 */}
        {(groupOptions.length > 0 || cellOptions.length > 0) && (
          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: "16px",
              padding: "12px 16px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>필터</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "13px", color: "#64748b" }}>이름</label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="이름 검색"
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minWidth: "120px",
                  background: "white",
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "13px", color: "#64748b" }}>그룹</label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minWidth: "140px",
                  background: "white",
                }}
              >
                <option value="">전체</option>
                {groupOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "13px", color: "#64748b" }}>다락방</label>
              <select
                value={filterCell}
                onChange={(e) => setFilterCell(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minWidth: "140px",
                  background: "white",
                }}
              >
                <option value="">전체</option>
                {cellOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {(filterGroup || filterCell || filterName) && (
              <button
                type="button"
                onClick={() => {
                  setFilterGroup("");
                  setFilterCell("");
                  setFilterName("");
                }}
                style={{
                  padding: "6px 12px",
                  fontSize: "13px",
                  color: "#64748b",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                필터 초기화
              </button>
            )}
          </div>
        )}

        {/* 명단 테이블 */}
        <div
          style={{
            marginBottom: "8px",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          OD 명단 · 총 {list.length}명 (그룹 → 다락방 → 이름 순)
          {(filterGroup || filterCell || filterName) && (
            <span style={{ marginLeft: "8px", color: "#0284c7" }}>
              (필터: {filteredList.length}명)
            </span>
          )}
        </div>

        {isLoading ? (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            불러오는 중…
          </div>
        ) : (
          <S.TableContainer>
            <S.Table>
              <S.TableHeader>
                <S.TableRow>
                  <S.TableHead>이름</S.TableHead>
                  <S.TableHead>그룹</S.TableHead>
                  <S.TableHead>다락방</S.TableHead>
                  <S.TableHead>그룹장</S.TableHead>
                  <S.TableHead>다락방장</S.TableHead>
                  <S.TableHead>이메일</S.TableHead>
                  <S.TableHead style={{ width: "100px" }}>삭제</S.TableHead>
                </S.TableRow>
              </S.TableHeader>
              <tbody>
                {filteredList.length === 0 ? (
                  <S.TableRow>
                    <S.TableData
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: "48px",
                        color: "#94a3b8",
                      }}
                    >
                      {list.length === 0
                        ? "OD 명단이 비어 있습니다. 회원을 추가해주세요."
                        : "해당 조건에 맞는 명단이 없습니다."}
                    </S.TableData>
                  </S.TableRow>
                ) : (
                  filteredList.map((row) => (
                    <S.TableRow key={row.id}>
                      <S.TableData>
                        <span style={{ fontWeight: "600" }}>
                          {row.name || "-"}
                        </span>
                      </S.TableData>
                      <S.TableData>{row.group_name ?? "-"}</S.TableData>
                      <S.TableData>{row.cell_name ?? "-"}</S.TableData>
                      <S.TableData>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                          <input
                            type="checkbox"
                            checked={!!row.is_group_leader}
                            onChange={(e) => updateLeader(row.id, "is_group_leader", e.target.checked)}
                          />
                          <span>그룹장</span>
                        </label>
                      </S.TableData>
                      <S.TableData>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                          <input
                            type="checkbox"
                            checked={!!row.is_cell_leader}
                            onChange={(e) => updateLeader(row.id, "is_cell_leader", e.target.checked)}
                          />
                          <span>다락방장</span>
                        </label>
                      </S.TableData>
                      <S.TableData>
                        <span style={{ fontSize: "13px", color: "#475569" }}>
                          {row.email ?? "-"}
                        </span>
                      </S.TableData>
                      <S.TableData>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          style={{
                            padding: "6px 12px",
                            background: "transparent",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          제거
                        </button>
                      </S.TableData>
                    </S.TableRow>
                  ))
                )}
              </tbody>
            </S.Table>
          </S.TableContainer>
        )}
      </S.Container>
    </>
  );
}
