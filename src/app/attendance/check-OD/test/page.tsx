"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@src/components/common/PageLayout";
import { Card, CardContent } from "@src/components/ui/card";
import { AttendanceResultView, type ResultStep } from "../AttendanceResultView";

const NOW = new Date().toISOString();

const MOCK_SCENARIOS: { id: string; label: string; step: ResultStep; message: string; result: Record<string, unknown> | null }[] = [
  { id: "loading", label: "로딩", step: "loading", message: "출석 확인 중...", result: null },
  { id: "error", label: "에러 (유효하지 않은 QR)", step: "error", message: "유효하지 않은 QR 코드입니다.", result: null },
  { id: "error-not-od", label: "에러 (명단 없음)", step: "error", message: "명단에 없습니다.", result: null },
  {
    id: "success-normal",
    label: "출석 완료 – 정상 출석",
    step: "success",
    message: "출석이 완료되었습니다.",
    result: { status: "present", attended_at: NOW, late_fee: 0, is_report_required: false },
  },
  {
    id: "success-late",
    label: "출석 완료 – 지각",
    step: "success",
    message: "출석이 완료되었습니다.",
    result: { status: "late", attended_at: NOW, late_fee: 2000, is_report_required: false },
  },
  {
    id: "success-late-report",
    label: "출석 완료 – 지각 + OD 보고서 대상",
    step: "success",
    message: "출석이 완료되었습니다.",
    result: { status: "late", attended_at: NOW, late_fee: 4000, is_report_required: true },
  },
  {
    id: "success-absence",
    label: "출석 완료 – 무단 결석",
    step: "success",
    message: "이미 출석이 완료되었습니다.",
    result: { status: "unexcused_absence", attended_at: null, late_fee: 5000, is_report_required: true },
  },
  {
    id: "success-excused-both",
    label: "출석 완료 – 예외처리 (지각비 + OD 보고서)",
    step: "success",
    message: "출석이 완료되었습니다.",
    result: {
      status: "present",
      attended_at: NOW,
      late_fee: 0,
      is_report_required: false,
      is_excused: true,
      late_fee_excused: true,
      report_excused: true,
      note: "병결로 인해 지각비 및 OD 보고서 예외 처리했습니다.",
    },
  },
  {
    id: "success-excused-late-fee",
    label: "출석 완료 – 예외처리 (지각비만)",
    step: "success",
    message: "이미 출석이 완료되었습니다.",
    result: {
      status: "late",
      attended_at: NOW,
      late_fee: 0,
      is_report_required: true,
      is_excused: true,
      late_fee_excused: true,
      report_excused: false,
      note: "대중교통 지연으로 지각비만 예외 처리.",
    },
  },
  {
    id: "success-excused-report",
    label: "출석 완료 – 예외처리 (OD 보고서만)",
    step: "success",
    message: "이미 출석이 완료되었습니다.",
    result: {
      status: "late",
      attended_at: NOW,
      late_fee: 2000,
      is_report_required: false,
      is_excused: true,
      late_fee_excused: false,
      report_excused: true,
      note: "OD 보고서만 예외 처리했습니다.",
    },
  },
];

export default function AttendanceCheckODTestPage() {
  const router = useRouter();
  const initial = MOCK_SCENARIOS[3];
  const [step, setStep] = useState<ResultStep>(initial.step);
  const [message, setMessage] = useState(initial.message);
  const [result, setResult] = useState<Record<string, unknown> | null>(initial.result);

  const applyScenario = (s: (typeof MOCK_SCENARIOS)[number]) => {
    setStep(s.step);
    setMessage(s.message);
    setResult(s.result);
  };

  return (
    <PageLayout>
      <div style={{ minHeight: "80vh", padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>QR 출석 결과 화면 테스트</h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
            로컬에서 로그인/QR 없이 모든 결과 화면을 확인할 수 있습니다. 아래 시나리오를 클릭하세요.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {MOCK_SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => applyScenario(s)}
                style={{
                  padding: "10px 14px",
                  fontSize: "13px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <Card style={{ width: "100%", maxWidth: "400px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
            <CardContent style={{ padding: "32px 24px" }}>
              <AttendanceResultView
                step={step}
                message={message}
                result={result}
                onGoHome={() => router.replace("/")}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
