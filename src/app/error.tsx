"use client";

import React from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
        gap: 12,
      }}
    >
      <h1>500</h1>
      <p>서버 오류가 발생했습니다.</p>
      <button
        onClick={reset}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid rgba(0,0,0,0.2)",
          cursor: "pointer",
        }}
      >
        다시 시도
      </button>
    </div>
  );
}

