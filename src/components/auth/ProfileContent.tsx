"use client";

import { UserProfile } from "@clerk/nextjs";

export default function ProfileContent() {
  return (
    <UserProfile
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "shadow-none border-2 border-ink/10 rounded-none bg-cream",
        },
      }}
    />
  );
}
