"use client";

// /test: 메인 페이지와 동일하게 동작하되, 말씀카드는 테스트 일정으로 미리 열린다.
// MC·목회자·마스터(admin_roles)만 접근 가능.

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import styled from "@emotion/styled";
import MainPage from "@src/views/MainPage";
import { isBibleCardTester } from "@src/lib/bibleCardConfig";

export default function ClientPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = `/login?redirect=${encodeURIComponent("/test")}`;
    }
  }, [status]);

  if (status !== "authenticated") {
    return <Message>로딩 중...</Message>;
  }

  if (!isBibleCardTester(session?.user?.roles)) {
    return (
      <Message>
        <strong>🔒 접근 권한이 없습니다</strong>
        MC, 목회자, 마스터 권한이 있는 계정만 이용할 수 있습니다.
        <a href="/">메인으로 →</a>
      </Message>
    );
  }

  return (
    <>
      <TestRibbon>테스트 페이지 · 실제 데이터로 저장됩니다</TestRibbon>
      <MainPage testMode />
    </>
  );
}

const Message = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #475569;
  font-size: 15px;
  text-align: center;
  padding: 0 20px;

  strong {
    font-size: 20px;
    color: #1e293b;
  }

  a {
    margin-top: 8px;
    color: #171e39;
    font-weight: 700;
  }
`;

const TestRibbon = styled.div`
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: #ff1515;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
`;
