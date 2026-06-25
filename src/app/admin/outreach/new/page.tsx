"use client";
import { useEffect } from "react";
import SeasonFormClient from "./SeasonFormClient";

export default function NewSeasonPage() {
  useEffect(() => {
    document.title = "아웃리치 시즌 등록";
  }, []);
  return <SeasonFormClient />;
}
