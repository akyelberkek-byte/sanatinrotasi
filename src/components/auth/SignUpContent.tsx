"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpContent() {
  return (
    <SignUp
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
