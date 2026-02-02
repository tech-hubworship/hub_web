"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageLayout from "@src/components/common/PageLayout";

export default function VerifyLeadershipPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("리더십 권한 확인 중...");

  useEffect(() => {
    if (status === "loading") return;

    // 1. 비로그인 시 로그인 페이지로
    if (status === "unauthenticated") {
      alert("로그인이 필요합니다.");
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }

    // 2. 로그인 상태면 바로 권한 부여 시도
    if (status === "authenticated") {
      autoUpgrade();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const autoUpgrade = async () => {
    try {
      setMessage("리더십 권한을 설정하고 있습니다...");
      
      // API 호출 (문구 없이 바로 요청)
      const res = await fetch("/api/user/upgrade-leadership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), 
      });

      if (res.ok) {
        alert("리더십 권한이 설정되었습니다.");
        router.replace("/"); // 메인으로 이동
      } else {
        const data = await res.json();
        alert(data.error || "오류가 발생했습니다.");
        router.replace("/");
      }
    } catch (e) {
      alert("서버 통신 중 오류가 발생했습니다.");
      router.replace("/");
    }
  };

  return (
    <PageLayout>
      <div style={{ 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "60vh",
        textAlign: "center",
        padding: "20px"
      }}>
        <div style={{ fontSize: "40px", marginBottom: "20px" }}>🔄</div>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#374151", marginBottom: "10px" }}>
          잠시만 기다려주세요
        </h2>
        <p style={{ color: "#6b7280", fontSize: "16px" }}>
          {message}
        </p>
      </div>
    </PageLayout>
  );
}