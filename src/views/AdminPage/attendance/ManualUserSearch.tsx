"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

interface ManualUserSearchProps {
  value: string;
  displayName: string;
  onSelect: (userId: string, name: string) => void;
}

export default function ManualUserSearch({ value, displayName, onSelect }: ManualUserSearchProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users-search", search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "15" });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("조회 실패");
      return res.json();
    },
    enabled: open,
  });

  const users = (usersData?.data || usersData?.users || []) as Array<{
    user_id: string;
    name?: string;
    email?: string;
    community?: string | null;
    group_name?: string | null;
    cell_name?: string | null;
  }>;

  const handleSelect = useCallback(
    (u: { user_id: string; name?: string }) => {
      onSelect(u.user_id, u.name || "");
      setOpen(false);
      setSearch("");
    },
    [onSelect]
  );

  return (
    <div style={{ position: "relative", minWidth: "200px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label style={{ fontSize: "12px", color: "#64748b" }}>회원 검색</label>
        <input
          type="text"
          placeholder={displayName || "이름 또는 이메일로 검색"}
          value={open ? search : displayName || ""}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "14px", minWidth: "200px" }}
        />
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            maxHeight: "320px",
            overflowY: "auto",
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 50,
          }}
        >
          {isLoading ? (
            <div style={{ padding: "16px", color: "#94a3b8" }}>검색 중...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: "16px", color: "#94a3b8" }}>검색 결과 없음</div>
          ) : (
            users.map((u) => (
              <button
                key={u.user_id}
                type="button"
                onClick={() => handleSelect(u)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 14px",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px 12px" }}>
                  <span style={{ fontWeight: "600" }}>{u.name || "-"}</span>
                  {u.email && <span style={{ color: "#94a3b8", fontSize: "12px" }}>{u.email}</span>}
                </div>
                {(u.community || u.group_name || u.cell_name) && (
                  <div style={{ marginTop: "4px", fontSize: "12px", color: "#64748b" }}>
                    {[u.community, u.group_name, u.cell_name].filter(Boolean).join(" · ")}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
