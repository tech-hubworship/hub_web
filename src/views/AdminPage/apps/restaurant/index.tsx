import React from "react";
import dynamic from "next/dynamic";

const RestaurantAdminClientPage = dynamic(
  () => import("@src/app/admin/apps/restaurant/ClientPage"),
  { ssr: false }
);

export default function RestaurantAdminPage() {
  return <RestaurantAdminClientPage />;
}
