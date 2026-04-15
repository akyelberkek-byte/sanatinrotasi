import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Sanatın Rotası'na üye olun.",
};

export default function KayitPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-20 flex justify-center">
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
    </div>
  );
}
