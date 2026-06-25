"use client";
import { use } from "react";
import CountryDetailClient from "./CountryDetailClient";

export default function CountryDetailPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = use(params);
  return <CountryDetailClient countryId={countryId} />;
}
