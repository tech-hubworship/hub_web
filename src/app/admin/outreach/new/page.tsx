import { Metadata } from "next";
import SeasonFormClient from "./SeasonFormClient";

export const metadata: Metadata = { title: "아웃리치 시즌 등록" };

export default function NewSeasonPage() {
  return <SeasonFormClient />;
}
