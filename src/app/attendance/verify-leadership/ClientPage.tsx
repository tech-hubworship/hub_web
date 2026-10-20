"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut, signIn } from "next-auth/react";
import PageLayout from "@src/components/common/PageLayout";

const REDIRECT_KEY = "login_redirect";
const SELF_PATH = "/attendance/verify-leadership";

type Phase = "checking" | "confirm" | "processing" | "done" | "already" | "error";

export default function VerifyLeadershipPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [phase, setPhase] = useState<Phase>("checking");
  const [message, setMessage] = useState("리더십 권한 확인 중...");

  // /update 등에서 계정 확인을 이미 거치고 돌아온 경우 재확인 생략
  const confirmed = searchParams?.get("confirmed") === "1";

  useEffect(() => {
    if (status === "loading") return;

    // 1. 비로그인 시 로그인 페이지로 (로그인 후 이 링크로 복귀)
    if (status === "unauthenticated") {
      const currentPath = window.location.pathname + window.location.search;
      try {
        localStorage.setItem(REDIRECT_KEY, SELF_PATH);
      } catch {}
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }

    // 2. 로그인 상태
    if (status === "authenticated") {
      if (confirmed) {
        // 계정 확인을 이미 거쳤으므로 바로 등록 시도
        upgrade();
      } else {
        // 먼저 "이 계정이 맞는지" 확인을 받는다
        setPhase("confirm");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, confirmed]);

  const upgrade = async () => {
    try {
      setPhase("processing");
      setMessage("리더십 권한을 설정하고 있습니다...");

      const res = await fetch("/api/user/upgrade-leadership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (data.alreadyRegistered) {
          setPhase("already");
          setMessage("이미 리더십으로 등록되어 있습니다.");
        } else {
          setPhase("done");
          setMessage("리더십 권한이 설정되었습니다.");
        }
        return;
      }

      // 소속(그룹/다락방) 정보가 없으면 먼저 입력받으러 보낸다
      if (data?.code === "NO_GROUP_CELL") {
        try {
          // 소속 입력 완료 후 이 링크로 복귀 (계정 확인은 통과한 상태로)
          localStorage.setItem(REDIRECT_KEY, `${SELF_PATH}?confirmed=1`);
        } catch {}
        router.replace("/update?force=1");
        return;
      }

      setPhase("error");
      setMessage(data?.error || "오류가 발생했습니다.");
    } catch (e) {
      setPhase("error");
      setMessage("서버 통신 중 오류가 발생했습니다.");
    }
  };

  const handleUseOtherAccount = async () => {
    // 현재 세션을 끊고 구글 계정 선택 화면을 강제로 띄운다
    try {
      localStorage.setItem(REDIRECT_KEY, SELF_PATH);
    } catch {}
    await signOut({ redirect: false });
    signIn("google", {
      prompt: "select_account",
      callbackUrl: `/login?redirect=${encodeURIComponent(SELF_PATH)}`,
    });
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "60vh",
    textAlign: "center",
    padding: "20px",
  };

  // 계정 확인 화면
  if (phase === "confirm") {
    return (
      <PageLayout>
        <div style={containerStyle}>
          <div style={{ fontSize: "40px", marginBottom: "20px" }}>👤</div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#374151", marginBottom: "10px" }}>
            이 계정으로 리더십을 등록할까요?
          </h2>
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "16px 20px",
              margin: "8px 0 24px",
              minWidth: "260px",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
              {session?.user?.name || "이름 없음"}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
              {session?.user?.email || "이메일 정보 없음"}
            </div>
          </div>
          <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "24px" }}>
            본인 계정이 맞는지 꼭 확인해주세요. 다른 계정이라면 아래에서 변경할 수 있어요.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "280px" }}>
            <button
              onClick={upgrade}
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                border: "none",
                background: "#2563eb",
                color: "white",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              네, 이 계정으로 진행할게요
            </button>
            <button
              onClick={handleUseOtherAccount}
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                background: "white",
                color: "#374151",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              아니요, 다른 계정으로 로그인할게요
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // 결과 화면 (처리 중 / 완료 / 이미 등록 / 오류)
  const emoji =
    phase === "done" ? "✅" : phase === "already" ? "ℹ️" : phase === "error" ? "⚠️" : "🔄";
  const title =
    phase === "done"
      ? "등록 완료"
      : phase === "already"
      ? "이미 리더십입니다"
      : phase === "error"
      ? "문제가 발생했어요"
      : "잠시만 기다려주세요";

  return (
    <PageLayout>
      <div style={containerStyle}>
        <div style={{ fontSize: "40px", marginBottom: "20px" }}>{emoji}</div>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#374151", marginBottom: "10px" }}>
          {title}
        </h2>
        <p style={{ color: "#6b7280", fontSize: "16px", marginBottom: "24px" }}>{message}</p>
        {(phase === "done" || phase === "already" || phase === "error") && (
          <button
            onClick={() => router.replace("/")}
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              border: "none",
              background: "#2563eb",
              color: "white",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            홈으로
          </button>
        )}
      </div>
    </PageLayout>
  );
}
