import type { NextConfig } from "next";

// Content-Security-Policy — kötü niyetli kod enjeksiyonuna karşı whitelist tabanlı kilit.
// NOT: Clerk + Sanity + YouTube + Vercel Analytics + Resend gibi bağımlı servisler
// whitelist'e alındı. 'unsafe-inline' ve 'unsafe-eval' Next.js + Clerk için şart
// (Google Fonts ve Clerk script'leri inline style/eval kullanıyor).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.sanatinrotasi.com https://challenges.cloudflare.com https://va.vercel-scripts.com https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://cdn.sanity.io https://img.clerk.com https://images.clerk.dev https://*.clerk.com https://*.vercel-insights.com",
  "media-src 'self' https://cdn.sanity.io",
  "connect-src 'self' https://cdn.sanity.io https://*.api.sanity.io https://*.apicdn.sanity.io https://*.clerk.accounts.dev https://*.clerk.com https://clerk.sanatinrotasi.com https://api.resend.com https://vitals.vercel-insights.com https://*.vercel-insights.com https://vercel.live wss://*.pusher.com",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com https://vercel.live",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // HTTPS zorla (HSTS)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Clickjacking önleme
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  // MIME sniffing önleme
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Referrer bilgisi
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Permissions Policy
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  },
  // XSS filter (eski tarayıcılar için)
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: csp,
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
    ],
  },
  async headers() {
    // Studio hariç tüm path'lere full security headers (CSP dahil).
    // Studio'ya CSP uygulanmaz — Sanity Studio kendi embedded script'lerini kullanıyor.
    const nonCspHeaders = securityHeaders.filter(
      (h) => h.key !== "Content-Security-Policy",
    );
    return [
      {
        source: "/((?!studio).*)",
        headers: securityHeaders,
      },
      {
        source: "/studio/:path*",
        headers: nonCspHeaders,
      },
    ];
  },
};

export default nextConfig;
