"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

// 소속(그룹/다락방)이 비어있는 허브 활성 사용자에게
// 전역으로 "소속 입력 안내 모달"을 띄우는 가드.
//  - [입력하러 가기] → /update
//  - [타공동체로]   → community='타공동체' 저장 후 종료
//
// 아래 경로에서는 모달을 띄우지 않는다(입력 플로우/인증/관리자 작업 중).
const EXCLUDED_PREFIXES = ["/update", "/login", "/signup", "/attendance", "/admin"];

export default function ProfileGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const checkedRef = useRef(false);

  const isExcluded = EXCLUDED_PREFIXES.some(
    (p) => pathname === p || pathname?.startsWith(p + "/")
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    if (isExcluded) {
      setShow(false);
      return;
    }
    // 경로가 바뀌어 제외구간을 벗어나면 다시 검사할 수 있도록 ref 초기화
    if (checkedRef.current) return;
    checkedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) return;
        const profile = await res.json();

        const isHubActive =
          profile.community === "허브" && profile.status === "활성";
        const isAdmin =
          (profile.roles?.length ?? 0) > 0 || profile.status === "관리자";
        const hasEmptyGroupCell = !profile.group_id || !profile.cell_id;

        // 허브 활성 사용자 또는 관리자(허브 소속)이면서 소속이 비어있으면 모달 노출
        if ((isHubActive || isAdmin) && hasEmptyGroupCell) {
          setShow(true);
        }
      } catch {
        /* 네트워크 오류 시 조용히 무시 */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, pathname, isExcluded]);

  // 제외 경로로 이동하면 다음 진입 때 재검사되도록 리셋
  useEffect(() => {
    if (isExcluded) checkedRef.current = false;
  }, [isExcluded]);

  const handleGoUpdate = () => {
    setShow(false);
    checkedRef.current = false;
    router.push("/update?force=1");
  };

  const handleOtherCommunity = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ community: "타공동체" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.message || "처리 중 오류가 발생했습니다.");
        return;
      }
      setShow(false);
    } catch {
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "28px 24px",
          maxWidth: "360px",
          width: "100%",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>🏡</div>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 800,
            color: "#111827",
            marginBottom: "10px",
          }}
        >
          소속 정보가 비어있어요
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          그룹/다락방 정보를 입력하러 가시겠어요?
          <br />
          입력하지 않으시면 <b>타공동체</b>로 처리됩니다.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={handleGoUpdate}
            disabled={saving}
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
            입력하러 가기
          </button>
          <button
            onClick={handleOtherCommunity}
            disabled={saving}
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              background: "white",
              color: "#374151",
              fontSize: "15px",
              fontWeight: 600,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "처리 중..." : "타공동체로 할게요"}
          </button>
        </div>
      </div>
    </div>
  );
}
