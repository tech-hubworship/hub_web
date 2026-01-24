// 파일 경로: src/views/AdminPage/apps/glossary/index.tsx
// 용어사전 관리 페이지

import dynamic from 'next/dynamic';

// App Router의 ClientPage를 동적으로 import
const GlossaryAdminClientPage = dynamic(
  () => import('@src/app/admin/apps/glossary/ClientPage'),
  { ssr: false }
);

export default function GlossaryAdminPage() {
  return <GlossaryAdminClientPage />;
}
