"use client";

import dynamic from "next/dynamic";

const ClerkSignIn = dynamic(() => import("@/components/auth/SignInContent"), {
  ssr: false,
  loading: () => (
    <div className="text-center py-20">
      <p className="font-serif text-warm-gray">Yukleniyor...</p>
    </div>
  ),
});

export default function GirisClient() {
  return <ClerkSignIn />;
}
