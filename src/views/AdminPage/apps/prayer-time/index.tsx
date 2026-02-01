import dynamic from "next/dynamic";

const PrayerTimeAdminClientPage = dynamic(
  () => import("@src/app/admin/apps/prayer-time/ClientPage"),
  { ssr: false }
);

export default function PrayerTimeAdminPage() {
  return <PrayerTimeAdminClientPage />;
}
