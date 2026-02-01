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
    category: string;
  }>;

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

        {/* 명단 테이블 */}
        <div
          style={{
            marginBottom: "8px",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          OD 명단 · 총 {list.length}명
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
                  <S.TableHead>사용자 ID</S.TableHead>
                  <S.TableHead style={{ width: "100px" }}>삭제</S.TableHead>
                </S.TableRow>
              </S.TableHeader>
              <tbody>
                {list.length === 0 ? (
                  <S.TableRow>
                    <S.TableData
                      colSpan={3}
                      style={{
                        textAlign: "center",
                        padding: "48px",
                        color: "#94a3b8",
                      }}
                    >
                      OD 명단이 비어 있습니다. 회원을 추가해주세요.
                    </S.TableData>
                  </S.TableRow>
                ) : (
                  list.map((row) => (
                    <S.TableRow key={row.id}>
                      <S.TableData>
                        <span style={{ fontWeight: "600" }}>
                          {row.name || "-"}
                        </span>
                      </S.TableData>
                      <S.TableData>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#94a3b8",
                            fontFamily: "monospace",
                          }}
                        >
                          {row.user_id.slice(0, 8)}…
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
