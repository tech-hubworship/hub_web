"use client";
import { useEffect } from "react";
import OutreachAdminClient from "./OutreachAdminClient";

export default function OutreachAdminPage() {
  useEffect(() => {
    document.title = "아웃리치 관리";
  }, []);
  return <OutreachAdminClient />;
}
