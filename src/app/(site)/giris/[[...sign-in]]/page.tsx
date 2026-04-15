"use client";

import dynamic from "next/dynamic";

const ClerkSignIn = dynamic(() => import("@/components/auth/SignInContent"), {
  ssr: false,
  loading: () => (
    <div className="text-center py-20">
      <p className="font-serif text-warm-gray">Yükleniyor...</p>
    </div>
  ),
});

export default function GirisPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-20 flex justify-center">
      <ClerkSignIn />
    </div>
  );
}
