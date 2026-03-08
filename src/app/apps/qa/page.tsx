"use client";

import dynamic from "next/dynamic";

const QAClientPage = dynamic(() => import("./ClientPage"), { ssr: false });

export default function QAPage() {
  return <QAClientPage />;
}
