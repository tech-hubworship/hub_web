import React, { Suspense } from "react";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import ClientPage from "./ClientPage";
import {
  VIDEO_EVENT,
  getVideoEventPath,
  ALLOWED_EVENT_SLUGS,
} from "@src/lib/video-event/constants";

export const metadata: Metadata = {
  title: VIDEO_EVENT.DISPLAY_NAME,
  description: `${VIDEO_EVENT.DISPLAY_NAME} 말씀과 나눔`,
};

type Props = { params: Promise<{ eventSlug: string }> };

export default async function Page({ params }: Props) {
  const { eventSlug } = await params;

  const allowed = ALLOWED_EVENT_SLUGS as readonly string[];
  if (!allowed.includes(eventSlug)) {
    notFound();
  }
  if (eventSlug !== VIDEO_EVENT.EVENT_SLUG) {
    redirect(getVideoEventPath());
  }

  return React.createElement(
    Suspense,
    { fallback: React.createElement("div", null, "로딩 중...") },
    React.createElement(ClientPage)
  );
}
