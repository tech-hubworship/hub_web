"use client";
import { use } from "react";
import CountryDetailClient from "../CountryDetailClient";

export default function SeasonDetailPage({
  params,
}: {
  params: Promise<{ countryId: string; seasonId: string }>;
}) {
  const { countryId, seasonId } = use(params);
  return <CountryDetailClient countryId={countryId} seasonId={seasonId} />;
}
