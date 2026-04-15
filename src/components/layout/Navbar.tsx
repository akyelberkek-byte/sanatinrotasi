"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";

const NAV_LINKS = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/yazilar", label: "Yazılar" },
  { href: "/rotalar", label: "Rotalar" },
  { href: "/etkinlikler", label: "Etkinlikler" },
  { href: "/hakkinda", label: "Hakkında" },
  { href: "/topluluk", label: "Topluluk" },
  { href: "/iletisim", label: "İletişim" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <nav className="border-b-2 border-ink">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/images/logo.png"
            alt="Sanatın Rotası"
            width={45}
            height={45}
            className="transition-transform group-hover:scale-105"
          />
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight text-ink leading-tight">
              Sanatın{" "}
              <span className="italic text-accent block md:inline">Rotası</span>
            </h1>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-soft-black hover:text-accent transition-colors link-underline"
            >
              {link.label}
            </Link>
          ))}

          {/* Auth */}
          {isLoaded && (
            <div className="ml-4 flex items-center gap-3">
              {isSignedIn ? (
                <>
                  <Link
                    href="/profil"
                    className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-soft-black hover:text-accent transition-colors link-underline"
                  >
                    Profilim
                  </Link>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8",
                      },
                    }}
                  />
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden flex flex-col gap-1.5 p-2"
          aria-label="Menü"
        >
          <span
            className={`w-6 h-0.5 bg-ink transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`w-6 h-0.5 bg-ink transition-all ${mobileOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`w-6 h-0.5 bg-ink transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-ink/10 bg-cream animate-fade-down">
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
            {isLoaded && (
              <div className="pt-2 flex gap-4">
                {isSignedIn ? (
                  <Link
                    href="/profil"
                    onClick={() => setMobileOpen(false)}
                    className="font-sans text-sm uppercase tracking-[0.15em] text-soft-black hover:text-accent"
                  >
                    Profilim
                  </Link>
                ) : (
                  <>
                    <SignInButton mode="redirect">
                      <button
                        onClick={() => setMobileOpen(false)}
                        className="font-sans text-sm uppercase tracking-[0.15em] text-soft-black hover:text-accent cursor-pointer"
                      >
                        Giriş Yap
                      </button>
                    </SignInButton>
                    <SignUpButton mode="redirect">
                      <button
                        onClick={() => setMobileOpen(false)}
                        className="font-sans text-sm uppercase tracking-[0.15em] text-accent cursor-pointer"
                      >
                        Kayıt Ol
                      </button>
                    </SignUpButton>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
