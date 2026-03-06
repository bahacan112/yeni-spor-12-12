"use client";

import dynamic from "next/dynamic";

const NovuTestClient = dynamic(() => import("./novu-test-client"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20 text-slate-400">
      Yükleniyor...
    </div>
  ),
});

export default function NovuTestPage() {
  return <NovuTestClient />;
}
