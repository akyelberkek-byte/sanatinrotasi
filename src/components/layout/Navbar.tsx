"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

let useAuth: any;
let UserButton: any;
let SignInButton: any;
let SignUpButton: any;

try {
  const clerk = require("@clerk/nextjs");
  useAuth = clerk.useAuth;
  UserButton = clerk.UserButton;
  SignInButton = clerk.SignInButton;
  SignUpButton = clerk.SignUpButton;
} catch {
  // Clerk not available
}

const NAV_LINKS = [
  { href: "/yazilar", label: "Yazılar" },
  { href: "/roportajlar", label: "Röportajlar" },
  { href: "/rotalar", label: "Rotalar" },
  { href: "/etkinlikler", label: "Etkinlikler" },
  { href: "/hakkinda", label: "Hakkında" },
  { href: "/topluluk", label: "Topluluk" },
  { href: "/iletisim", label: "İletişim" },
];

function AuthButtons() {
  try {
    if (!useAuth) return null;
    const { isSignedIn, isLoaded } = useAuth();
    if (!isLoaded) return null;

    if (isSignedIn) {
      return (
        <div className="flex items-center gap-3">
          <Link
            href="/profil"
            className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-soft-black hover:text-accent transition-colors link-underline"
          >
            Profilim
          </Link>
          {UserButton && (
            <UserButton
              appearance={{
                elements: { avatarBox: "w-8 h-8" },
              }}
            />
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        {SignInButton ? (
          <SignInButton mode="redirect">
            <button className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-soft-black hover:text-accent transition-colors cursor-pointer">
              Giriş
            </button>
          </SignInButton>
        ) : (
          <Link
            href="/giris"
            className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-soft-black hover:text-accent transition-colors"
          >
            Giriş
          </Link>
        )}
        {SignUpButton ? (
          <SignUpButton mode="redirect">
            <button className="font-sans text-[0.65rem] uppercase tracking-[0.2em] px-4 py-2 bg-ink text-cream hover:bg-accent transition-colors cursor-pointer">
              Kayıt Ol
            </button>
          </SignUpButton>
        ) : (
          <Link
            href="/kayit"
            className="font-sans text-[0.65rem] uppercase tracking-[0.2em] px-4 py-2 bg-ink text-cream hover:bg-accent transition-colors"
          >
            Kayıt Ol
          </Link>
        )}
      </div>
    );
  } catch {
    // Fallback when Clerk is not configured
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
            width={45}
            height={45}
            unoptimized={logoUrl ? true : false}
            className="transition-transform group-hover:scale-105"
          />
          <div>
            <span className="font-display text-xl md:text-2xl font-bold tracking-tight text-ink leading-tight block">
              Sanatın{" "}
              <span className="italic text-accent block md:inline">Rotası</span>
            </span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-4 xl:gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-sans text-[0.65rem] xl:text-[0.7rem] uppercase tracking-[0.15em] xl:tracking-[0.2em] text-soft-black hover:text-accent transition-colors link-underline whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-2 xl:ml-4">
            <AuthButtons />
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
              <AuthButtons />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
