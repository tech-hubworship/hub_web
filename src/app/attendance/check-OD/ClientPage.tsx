"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import PageLayout from "@src/components/common/PageLayout";
import { Card, CardContent } from "@src/components/ui/card";
import { AttendanceResultView } from "./AttendanceResultView";

export default function AttendanceCheckODPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const category = searchParams?.get("category");
  const { data: session, status } = useSession();

  const [step, setStep] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("출석 확인 중...");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }

    if (status === "authenticated" && token && category && step === "loading") {
      checkIn();
    } else if (status === "authenticated" && (!token || !category)) {
      setStep("error");
      setMessage("유효하지 않은 QR 코드입니다.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token, category, step]);

  const checkIn = async () => {
    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, category }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data.result || {});
        setStep("success");
        setMessage(data.message || "완료되었습니다.");
      } else {
        if (data.code === "REQUIRE_LEADERSHIP") {
          if (confirm("리더십 권한이 필요합니다. 인증 페이지로 이동하시겠습니까?")) {
            router.push("/attendance/verify-leadership");
            return;
          }
          setStep("error");
          setMessage("리더십 권한이 없습니다.");
        } else if (data.code === "NOT_OD_TARGET") {
          setStep("error");
          setMessage("명단에 없습니다.");
        } else {
          setStep("error");
          setMessage(data.error || "출석 처리에 실패했습니다.");
        }
      }
    } catch (e) {
      setStep("error");
      setMessage("네트워크 오류가 발생했습니다.");
    }
  };

  return (
    <PageLayout>
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
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
    </PageLayout>
  );
}