"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageLayout from "@src/components/common/PageLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@src/components/ui/card";

export default function VerifyLeadershipPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [isAlreadyLeadership, setIsAlreadyLeadership] = useState(false);
  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      alert("로그인이 필요합니다.");
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }

    checkUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const checkUserRole = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();

      if (res.ok) {
        const leadershipRoles = ["리더십", "MC", "목회자", "그룹장", "다락방장"];
        const hasRole = data.roles?.some((role: string) => leadershipRoles.includes(role));
        if (hasRole) setIsAlreadyLeadership(true);
      }
    } catch (error) {
      console.error("프로필 확인 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!phrase) return;

    if (phrase !== "허브 리더십입니다.") {
      alert("인증 문구가 올바르지 않습니다.");
      return;
    }

    try {
      const res = await fetch("/api/user/upgrade-leadership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase }),
      });

      if (res.ok) {
        alert("리더십으로 권한이 설정되었습니다.");
        router.push("/");
      } else {
        const data = await res.json();
        alert(data.error || "오류가 발생했습니다.");
      }
    } catch (e) {
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  };

  if (loading || status === "loading") {
    return (
      <PageLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <p>권한 확인 중...</p>
        </div>
      </PageLayout>
    );
  }

  if (isAlreadyLeadership) {
    return (
      <PageLayout>
        <div style={{ padding: "24px", display: "flex", justifyContent: "center" }}>
          <Card style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>
            <CardHeader>
              <CardTitle>✅ 인증 완료</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ marginBottom: "24px", color: "#4b5563" }}>
                {session?.user?.name}님은 이미 <strong>리더십 권한</strong>을 가지고 계십니다.
              </p>
              <button
                onClick={() => router.push("/")}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                메인으로 이동
              </button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div style={{ padding: "24px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Card style={{ width: "100%", maxWidth: "400px" }}>
          <CardHeader>
            <CardTitle style={{ textAlign: "center" }}>리더십 인증</CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ marginBottom: "20px", color: "#6b7280", fontSize: "14px", textAlign: "center" }}>
              리더십 권한을 획득하려면
              <br />
              아래 인증 문구를 입력해주세요.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder="허브 리더십입니다."
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "16px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
            >
              확인
            </button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

