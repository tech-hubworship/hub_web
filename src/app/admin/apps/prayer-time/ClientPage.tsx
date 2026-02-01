"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styled from "@emotion/styled";

const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin: 0;
`;

export default function PrayerTimeAdminClientPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && !session?.user?.isAdmin) {
      router.replace("/");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <Container>
        <p>로딩 중...</p>
      </Container>
    );
  }

  return (
    <Container>
      <Title>기도 시간 관리</Title>
      <Subtitle>통계·설정 등 관리 기능은 준비 중입니다.</Subtitle>
    </Container>
  );
}
