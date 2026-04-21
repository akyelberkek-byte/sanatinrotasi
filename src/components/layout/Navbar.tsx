"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  useAuth,
  UserButton,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";

const NAV_LINKS = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/yazilar", label: "Yazılar" },
  { href: "/roportajlar", label: "Röportajlar" },
  { href: "/rotalar", label: "Rotalar" },
  { href: "/etkinlikler", label: "Etkinlikler" },
  { href: "/hakkinda", label: "Hakkında" },
  { href: "/topluluk", label: "Topluluk" },
  { href: "/iletisim", label: "İletişim" },
];

/**
 * AuthButtons: Clerk hook'ları koşulsuz çağrılır (rules-of-hooks uyumu).
 * Clerk provider yoksa (env var eksik), isLoaded=false kalır ve UserButton
 * render edilmez — safe.
 */
function AuthButtons() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="w-8 h-8" aria-hidden="true" />;
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/profil"
          className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-soft-black hover:text-accent transition-colors link-underline"
        >
          Profilim
        </Link>
        <UserButton
          appearance={{
            elements: { avatarBox: "w-8 h-8" },
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <SignInButton mode="redirect">
        <button className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-soft-black hover:text-accent transition-colors cursor-pointer">
          Giriş
        </button>
      </SignInButton>
      <SignUpButton mode="redirect">
        <button className="font-sans text-[0.65rem] uppercase tracking-[0.2em] px-4 py-2 bg-ink text-cream hover:bg-accent transition-colors cursor-pointer">
          Kayıt Ol
        </button>
      </SignUpButton>
    </div>
  );
}

/**
 * Clerk keys yoksa AuthButtons yerine düz linkler göster.
 * Build zamanında env var'lara bakıp hangi komponenti render edeceğimize karar veririz.
 */
const hasClerkKeys = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);

function FallbackAuthButtons() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/giris"
        className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-soft-black hover:text-accent transition-colors"
      >
        Giriş
      </Link>
      <Link
        href="/kayit"
        className="font-sans text-[0.65rem] uppercase tracking-[0.2em] px-4 py-2 bg-ink text-cream hover:bg-accent transition-colors"
      >
        Kayıt Ol
      </Link>
    </div>
  );
}

interface NavbarProps {
  logoUrl?: string;
}

export default function Navbar({ logoUrl }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const logo = logoUrl || "/images/logo.png";

  return (
    <nav className="border-b-2 border-ink" aria-label="Ana menü">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src={logo}
            alt="Sanatın Rotası - Ana sayfa"
            width={90}
            height={90}
            sizes="45px"
            className="w-[45px] h-[45px] transition-transform group-hover:scale-105"
          />
          <div>
            <span className="font-display text-xl md:text-2xl font-bold tracking-tight text-ink leading-tight block">
              Sanatın{" "}
              <span className="italic text-accent block md:inline">Rotası</span>
            </span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-3 xl:gap-5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-sans text-[0.6rem] xl:text-[0.65rem] font-semibold uppercase tracking-[0.12em] xl:tracking-[0.15em] text-ink hover:text-accent transition-colors link-underline whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-1 xl:ml-3">
            {hasClerkKeys ? <AuthButtons /> : <FallbackAuthButtons />}
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden flex flex-col gap-1.5 p-2"
          aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          <span className={`w-6 h-0.5 bg-ink transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`w-6 h-0.5 bg-ink transition-all ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`w-6 h-0.5 bg-ink transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="lg:hidden border-t border-ink/10 bg-cream animate-fade-down" role="navigation" aria-label="Mobil menü">
          <div className="px-6 py-4 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-sans text-sm uppercase tracking-[0.15em] text-soft-black hover:text-accent transition-colors py-2 border-b border-ink/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              {hasClerkKeys ? <AuthButtons /> : <FallbackAuthButtons />}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
