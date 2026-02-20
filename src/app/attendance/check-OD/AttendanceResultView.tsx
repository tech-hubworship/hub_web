"use client";

export type ResultStep = "loading" | "success" | "error";

export interface AttendanceResultViewProps {
  step: ResultStep;
  message: string;
  result: Record<string, unknown> | null;
  onGoHome: () => void;
}

export function AttendanceResultView({ step, message, result, onGoHome }: AttendanceResultViewProps) {
  if (step === "loading") {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
        <div style={{ fontSize: "18px", fontWeight: "bold" }}>확인 중입니다...</div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚫</div>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#dc2626", marginBottom: "12px" }}>
          {message}
        </h2>
        <button
          onClick={onGoHome}
          style={{
            padding: "12px 24px",
            background: "#4b5563",
            color: "white",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          메인으로 가기
        </button>
      </div>
    );
  }

  const isUnexcusedAbsence = result?.status === "unexcused_absence";
  const isLate = result?.status === "late";
  const isExcused = !!(
    result?.is_excused ||
    result?.late_fee_excused ||
    result?.report_excused
  );
  const lateFeeExcused = !!result?.late_fee_excused;
  const reportExcused = !!result?.report_excused;
  const showReportGuidance = !!(result?.is_report_required && !reportExcused);

  let bgColor = "#f0fdf4";
  let textColor = "#16a34a";
  let statusText = "정상 출석";
  let icon = "✅";

  if (isUnexcusedAbsence) {
    bgColor = "#fef2f2";
    textColor = "#dc2626";
    statusText = "무단 결석";
    icon = "🚨";
  } else if (isLate) {
    bgColor = "#fff7ed";
    textColor = "#ea580c";
    statusText = "지각";
    icon = "⚠️";
  }

  const displayLateFee = isExcused ? 0 : (Number(result?.late_fee) ?? 0);

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <div style={{ fontSize: "64px", marginBottom: "16px" }}>{icon}</div>
      <h2 style={{ fontSize: "22px", fontWeight: "bold", color: "#111827", marginBottom: "8px", wordBreak: "keep-all" }}>
        출석 완료
      </h2>
      {message === "이미 출석이 완료되었습니다." ? (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            background: "#eff6ff",
            border: "1px solid #3b82f6",
            borderRadius: "10px",
            fontSize: "15px",
            fontWeight: "600",
            color: "#1d4ed8",
          }}
        >
          이미 출석이 완료되었습니다.
        </div>
      ) : message && message !== "출석 완료" ? (
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>{message}</p>
      ) : null}

      <div
        style={{
          margin: "24px 0",
          padding: "24px",
          backgroundColor: bgColor,
          borderRadius: "12px",
          border: `2px solid ${textColor}`,
        }}
      >
        <p style={{ fontSize: "16px", color: "#4b5563", marginBottom: "8px" }}>
          출석 시간:{" "}
          <strong>
            {result?.attended_at
              ? new Date(result.attended_at as string).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </strong>
        </p>
        <p style={{ fontSize: "18px", fontWeight: "bold", color: "#374151", marginBottom: "8px" }}>
          상태: <span style={{ color: textColor, fontSize: "20px" }}>{statusText}</span>
        </p>

        {isExcused && (
          <div
            style={{
              marginTop: "16px",
              borderTop: "1px solid #e5e7eb",
              paddingTop: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px", justifyContent: "center" }}>
              {lateFeeExcused && (
                <span
                  style={{
                    padding: "6px 12px",
                    background: "#059669",
                    color: "white",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  지각비 예외처리
                </span>
              )}
              {reportExcused && (
                <span
                  style={{
                    padding: "6px 12px",
                    background: "#059669",
                    color: "white",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  OD 보고서 예외처리
                </span>
              )}
            </div>
            <p style={{ fontSize: "16px", color: "#374151", marginBottom: "4px" }}>
              지각비 <strong style={{ fontSize: "20px", color: "#111827" }}>0원</strong>
            </p>
            {result?.note != null && result.note !== "" ? (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  background: "rgba(255,255,255,0.6)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#4b5563",
                  textAlign: "left",
                }}
              >
                <span style={{ fontWeight: "600", color: "#374151" }}>예외처리 사유:</span>
                <p style={{ margin: "6px 0 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {String(result.note)}
                </p>
              </div>
            ) : null}
          </div>
        )}

        {!isExcused && (isLate || isUnexcusedAbsence) && (
          <>
            <div style={{ marginTop: "16px", borderTop: "1px solid #fee2e2", paddingTop: "16px" }}>
              <p style={{ fontSize: "16px", color: "#4b5563" }}>지각비</p>
              <p style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>
                {displayLateFee.toLocaleString()}원
              </p>
            </div>
            {showReportGuidance && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #fecaca",
                }}
              >
                <p style={{ color: "#dc2626", fontSize: "15px", fontWeight: "bold", marginBottom: "4px" }}>
                  OD 보고서 대상입니다.
                </p>
                {isUnexcusedAbsence && (
                  <p style={{ color: "#ef4444", fontSize: "13px" }}>
                    * 사유가 있다면 리더십에게 문의해주세요.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {!isExcused && !isLate && !isUnexcusedAbsence && showReportGuidance ? (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #bbf7d0",
            }}
          >
            <p style={{ color: "#16a34a", fontSize: "15px", fontWeight: "bold" }}>
              OD 보고서 대상입니다.
            </p>
          </div>
        ) : null}
      </div>

      <button
        onClick={onGoHome}
        style={{
          width: "100%",
          padding: "16px",
          backgroundColor: "#2563eb",
          color: "white",
          borderRadius: "12px",
          border: "none",
          fontWeight: "bold",
          fontSize: "16px",
          cursor: "pointer",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        확인 (메인으로)
      </button>
    </div>
  );
}
