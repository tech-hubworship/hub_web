"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import * as S from "../users/style";

export default function LateFeeManage() {
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const { data: listData, isLoading } = useQuery({
    queryKey: ["admin-late-fees"],
    queryFn: async () => {
      const res = await fetch("/api/admin/attendance/late-fees");
      if (!res.ok) throw new Error("조회 실패");
      return res.json();
    },
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-late-fees-detail", detailUserId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/attendance/late-fees?userId=${detailUserId}`);
      if (!res.ok) throw new Error("조회 실패");
      return res.json();
    },
    enabled: !!detailUserId,
  });

  const list = listData?.data || [];
  const stats = listData?.stats || {};
  const detailLogs = detailData?.logs || [];
  const detailName = detailData?.name || "-";

  return (
    <>
      <S.Header>
        <S.HeaderLeft>
          <S.Title>💰 지각비 관리</S.Title>
          <S.Subtitle>OD 명단 회원별 지각비 현황 및 상세 로그</S.Subtitle>
        </S.HeaderLeft>
      </S.Header>

      <S.Container>
        {stats.totalMembers !== undefined && (
          <div
            style={{
              marginBottom: "20px",
              padding: "20px",
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: 0 }}>
              📊 지각비 요약
            </h3>
            <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "#64748b" }}>지각비 발생 인원</div>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#2563eb" }}>
                  {stats.membersWithLateFee || 0}명
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "#64748b" }}>총 지각비</div>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#dc2626" }}>
                  {(stats.totalLateFee || 0).toLocaleString()}원
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            데이터를 불러오는 중...
          </div>
        ) : list.length === 0 ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#94a3b8",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1px dashed #e2e8f0",
            }}
          >
            지각비가 발생한 회원이 없습니다.
          </div>
        ) : (
          <S.TableContainer>
            <S.Table>
              <S.TableHeader>
                <S.TableRow>
                  <S.TableHead>이름</S.TableHead>
                  <S.TableHead>소속 (그룹 / 다락방)</S.TableHead>
                  <S.TableHead>총 지각비</S.TableHead>
                  <S.TableHead>상세</S.TableHead>
                </S.TableRow>
              </S.TableHeader>
              <tbody>
                {list.map((item: any) => (
                  <S.TableRow key={item.user_id}>
                    <S.TableData>
                      <span style={{ fontWeight: "600" }}>{item.name}</span>
                    </S.TableData>
                    <S.TableData>
                      {item.group_name || "-"} / {item.cell_name || "-"}
                    </S.TableData>
                    <S.TableData>
                      <span style={{ color: "#dc2626", fontWeight: "bold" }}>
                        {item.total_late_fee.toLocaleString()}원
                      </span>
                    </S.TableData>
                    <S.TableData>
                      <button
                        type="button"
                        onClick={() => setDetailUserId(item.user_id)}
                        style={{
                          padding: "6px 14px",
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
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

            {detailLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                로딩 중...
              </div>
            ) : detailLogs.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                지각비 로그가 없습니다.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {detailLogs.map((log: any) => (
                  <div
                    key={log.id}
                    style={{
                      padding: "14px 16px",
                      background: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "6px",
                      }}
                    >
                      <span style={{ fontWeight: "600", color: "#1e293b" }}>
                        {dayjs(log.week_date).format("YYYY-MM-DD")}
                      </span>
                      <span style={{ color: "#dc2626", fontWeight: "bold" }}>
                        +{log.late_fee?.toLocaleString()}원
                      </span>
                    </div>
                    {log.attended_at && (
                      <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>
                        출석 시간: {dayjs(log.attended_at).format("HH:mm:ss")}
                      </div>
                    )}
                    {log.note && (
                      <div style={{ fontSize: "13px", color: "#475569" }}>비고: {log.note}</div>
                    )}
                    {log.updated_by && (
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                        by {log.updated_by}
                      </div>
                    )}
                  </div>
                ))}
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    background: "#eff6ff",
                    borderRadius: "8px",
                    textAlign: "right",
                    fontWeight: "bold",
                    color: "#1e40af",
                  }}
                >
                  합계: {detailData?.totalLateFee?.toLocaleString() || 0}원
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
