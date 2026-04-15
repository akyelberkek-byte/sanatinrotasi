"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInContent() {
  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "shadow-none border-2 border-ink/10 rounded-none bg-cream",
          headerTitle: "font-display text-2xl text-ink",
          headerSubtitle: "font-serif text-soft-black/70",
          formButtonPrimary:
            "bg-ink hover:bg-accent border-0 rounded-none uppercase tracking-widest text-xs",
          footerActionLink: "text-accent hover:text-accent-dark",
        },
      }}
    />
  );
}
