"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styled from "@emotion/styled";

interface Country {
  id: number;
  name_ko: string;
  name_en: string;
  iso_code: string;
  is_active: boolean;
  created_at: string;
}

export default function OutreachAdminClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = (session?.user as any)?.isAdmin;

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) { router.replace("/"); return; }
    fetch("/api/admin/outreach/countries")
      .then((r) => r.json())
      .then((d) => setCountries(d.countries ?? []))
      .finally(() => setLoading(false));
  }, [status, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "loading" || loading) return <Wrap><p>불러오는 중...</p></Wrap>;

  return (
    <Wrap>
      <TopRow>
        <h1>아웃리치 관리</h1>
        <NewBtn onClick={() => router.push("/admin/outreach/new")}>+ 시즌 등록</NewBtn>
      </TopRow>

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>국가</Th>
              <Th>ISO</Th>
              <Th>활성</Th>
              <Th>등록일</Th>
              <Th>공개 페이지</Th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c) => (
              <tr key={c.id}>
                <Td>
                  <b>{c.name_ko}</b>
                  <small style={{ marginLeft: 6, color: "#888" }}>{c.name_en}</small>
                </Td>
                <Td>{c.iso_code}</Td>
                <Td>{c.is_active ? "✓" : "—"}</Td>
                <Td>{c.created_at.slice(0, 10)}</Td>
                <Td>
                  <LinkBtn
                    onClick={() => window.open(`/outreach/${c.id}`, "_blank")}
                  >
                    보기
                  </LinkBtn>
                </Td>
              </tr>
            ))}
            {countries.length === 0 && (
              <tr>
                <Td colSpan={5} style={{ textAlign: "center", color: "#aaa" }}>
                  등록된 국가가 없습니다.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableWrap>
    </Wrap>
  );
}

const Wrap = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 20px;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  h1 { font-size: 20px; margin: 0; }
`;

const NewBtn = styled.button`
  padding: 10px 20px;
  background: #1e293b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const Th = styled.th`
  text-align: left;
  padding: 10px 12px;
  background: #f1f5f9;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
`;

const LinkBtn = styled.button`
  padding: 4px 10px;
  background: none;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  color: #475569;
`;
