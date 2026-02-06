import dynamic from "next/dynamic";

const LostFoundAdminClientPage = dynamic(
  () => import("@src/app/admin/apps/lost-found/ClientPage"),
  { ssr: false }
);

export default function LostFoundAdminPage() {
  return <LostFoundAdminClientPage />;
}
