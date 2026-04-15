"use client";

import dynamic from "next/dynamic";

const ClerkProfile = dynamic(() => import("@/components/auth/ProfileContent"), {
  ssr: false,
  loading: () => (
    <div className="text-center py-20">
      <p className="font-serif text-warm-gray">Yukleniyor...</p>
    </div>
  ),
});

export default function ProfileClient() {
  return <ClerkProfile />;
}
