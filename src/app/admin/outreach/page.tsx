import { Metadata } from "next";
import OutreachAdminClient from "./OutreachAdminClient";

export const metadata: Metadata = { title: "아웃리치 관리" };

export default function OutreachAdminPage() {
  return <OutreachAdminClient />;
}
