"use client";

import dynamic from "next/dynamic";

const ClerkSignUp = dynamic(() => import("@/components/auth/SignUpContent"), {
  ssr: false,
  loading: () => (
    <div className="text-center py-20">
      <p className="font-serif text-warm-gray">Yukleniyor...</p>
    </div>
  ),
});

export default function KayitClient() {
  return <ClerkSignUp />;
}
