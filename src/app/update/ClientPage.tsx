"use client";

import React, { Suspense } from "react";
import UpdatePage from "@src/views/UpdatePage";

// UpdatePage 가 useSearchParams() 를 사용하므로 Suspense 경계로 감싼다 (Next.js 15 prerender 요구사항)
export default function ClientPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>불러오는 중...</div>}>
      <UpdatePage />
    </Suspense>
  );
}
