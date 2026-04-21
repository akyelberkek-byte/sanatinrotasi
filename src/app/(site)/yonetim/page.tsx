import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { client } from "@/sanity/client";
import { isAdminUser, ADMIN_EMAILS } from "@/lib/admin";
import { getAnalyticsStats } from "@/lib/analytics";
import { groq } from "next-sanity";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yönetim",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ADMIN_DASHBOARD_QUERY = groq`{
  "totalArticles": count(*[_type == "article"]),
  "totalEvents": count(*[_type == "event"]),
  "totalRoutes": count(*[_type == "route"]),
  "totalCategories": count(*[_type == "category"]),
  "totalComments": count(*[_type == "comment"]),
  "pendingComments": count(*[_type == "comment" && approved == false]),
  "latestComments": *[_type == "comment"] | order(createdAt desc) [0...5] {
    _id,
    authorName,
    body,
    approved,
    createdAt,
    "articleTitle": article->title,
    "articleSlug": article->slug.current
  },
  "latestArticles": *[_type == "article"] | order(_updatedAt desc) [0...5] {
    _id,
    title,
    slug,
    publishedAt,
    _updatedAt,
    "categoryTitle": category->title
  }
}`;

export default async function AdminDashboardPage() {
  const user = await currentUser().catch(() => null);

  // Giriş yapmamış → giriş sayfasına yönlendirmek yerine açıklayıcı mesaj
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-ink mb-4">
          Giriş Gerekli
        </h1>
        <p className="font-serif text-warm-gray mb-6">
          Yönetim paneline erişmek için giriş yapman gerekiyor.
        </p>
        <Link
          href="/giris?redirect_url=/yonetim"
          className="inline-block font-sans text-[0.7rem] uppercase tracking-[0.2em] px-5 py-3 bg-ink text-cream hover:bg-accent transition-colors"
        >
          Giriş Yap
        </Link>
      </div>
    );
  }

  // Admin değil → sessiz yönlendirme yerine hangi email ile girdiğini göster
  if (!isAdminUser(user)) {
    const primary = user.primaryEmailAddress?.emailAddress;
    const allEmails = (user.emailAddresses || [])
      .map((e) => e.emailAddress)
      .filter(Boolean);
    return (
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-20">
        <h1 className="font-display text-3xl font-bold text-ink mb-4">
          Yetkisiz
        </h1>
        <p className="font-serif text-warm-gray mb-4">
          Bu sayfa sadece admin kullanıcılar içindir. Yanlış hesapla giriş
          yaptıysan çıkış yapıp doğru hesapla tekrar giriş yap.
        </p>
        <div className="font-sans text-sm text-soft-black bg-paper/50 border border-ink/10 p-4 space-y-1">
          <p>
            <strong>Giriş yaptığın email:</strong> {primary || "—"}
          </p>
          {allEmails.length > 1 && (
            <p className="text-warm-gray">
              Diğer email(ler): {allEmails.filter((e) => e !== primary).join(", ")}
            </p>
          )}
          <p className="text-warm-gray mt-2">
            Beklenen admin email'leri: {ADMIN_EMAILS.join(" veya ")}
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <Link
            href="/"
            className="font-sans text-[0.7rem] uppercase tracking-[0.2em] px-5 py-2 border border-ink text-ink hover:bg-ink hover:text-cream transition-colors"
          >
            Ana Sayfa
          </Link>
          <Link
            href="/giris?redirect_url=/yonetim"
            className="font-sans text-[0.7rem] uppercase tracking-[0.2em] px-5 py-2 bg-ink text-cream hover:bg-accent transition-colors"
          >
            Başka Hesapla Giriş
          </Link>
        </div>
      </div>
    );
  }

  // 60s cache — admin paneli count/aggregation'ları Sanity quota'ya yüklenmesin
  const [data, analytics] = await Promise.all([
    client
      .fetch(ADMIN_DASHBOARD_QUERY, {}, { next: { revalidate: 60 } })
      .catch(() => null),
    getAnalyticsStats().catch(() => null),
  ]);

  const fmtNumber = (n: number) =>
    new Intl.NumberFormat("tr-TR").format(n || 0);

  const fmtDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10">
        <p className="font-sans text-[0.65rem] uppercase tracking-[0.25em] text-accent mb-2">
          Yönetim Paneli
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink">
          Hoş geldin, {user.firstName || "Admin"}
        </h1>
        <p className="font-serif text-soft-black/80 mt-3">
          Hızlı bakış. Tam düzenleme için Sanity Studio'ya git.
        </p>
        <div className="flex flex-wrap gap-3 mt-5">
          <a
            href="/studio"
            className="font-sans text-[0.65rem] uppercase tracking-[0.2em] px-4 py-2 bg-ink text-cream hover:bg-accent transition-colors"
          >
            Sanity Studio
          </a>
          <Link
            href="/"
            className="font-sans text-[0.65rem] uppercase tracking-[0.2em] px-4 py-2 border border-ink text-ink hover:bg-ink hover:text-cream transition-colors"
          >
            Siteye Dön
          </Link>
        </div>
      </header>

      {/* Ziyaretçi Analitiği */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-bold text-ink mb-4 pb-2 border-b-2 border-ink">
          Ziyaretçi Analitiği
        </h2>
        {analytics ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Stat label="Bugün" value={analytics.today} highlight={analytics.today > 0} />
              <Stat label="Dün" value={analytics.yesterday} />
              <Stat label="Son 7 Gün" value={analytics.last7Days} />
              <Stat label="Son 30 Gün" value={analytics.last30Days} />
              <Stat label="Bu Ay" value={analytics.thisMonth} />
              <Stat label="Toplam" value={analytics.total} />
            </div>

            {/* Mini 30 günlük bar grafik */}
            {analytics.daily.length > 0 && (() => {
              const max = Math.max(1, ...analytics.daily.map((d) => d.count));
              return (
                <div className="mt-6 p-4 border border-ink/10 bg-paper/30">
                  <div className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-warm-gray mb-3">
                    Son 30 gün (günlük görüntüleme)
                  </div>
                  <div className="flex items-end gap-[2px] h-24">
                    {analytics.daily.map((d) => {
                      const h = (d.count / max) * 100;
                      return (
                        <div
                          key={d.date}
                          className="flex-1 bg-accent/70 hover:bg-accent transition-colors min-h-[1px]"
                          style={{ height: `${Math.max(1, h)}%` }}
                          title={`${d.date}: ${fmtNumber(d.count)} görüntüleme`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between font-sans text-[0.55rem] text-warm-gray mt-2">
                    <span>{analytics.daily[0]?.date}</span>
                    <span>{analytics.daily[analytics.daily.length - 1]?.date}</span>
                  </div>
                </div>
              );
            })()}

            <p className="font-sans text-[0.6rem] text-warm-gray mt-3">
              Bot'lar ve /yonetim, /studio, /giris, /kayit sayfaları sayılmaz. Detaylı analitik için{" "}
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener" className="text-accent underline">
                Vercel Analytics
              </a>'e bak.
            </p>
          </>
        ) : (
          <div className="p-6 border-2 border-accent/30 bg-accent/5">
            <p className="font-serif text-soft-black mb-3">
              Ziyaretçi sayaçları aktif değil. Upstash Redis env var'larını eklemen gerekiyor:
            </p>
            <ol className="font-sans text-sm text-soft-black space-y-1 list-decimal list-inside">
              <li>
                <a href="https://console.upstash.com" target="_blank" rel="noopener" className="text-accent underline">
                  console.upstash.com
                </a>'a git → ücretsiz Redis database oluştur
              </li>
              <li>REST URL ve REST Token'ı kopyala</li>
              <li>
                Vercel → Project → Settings → Environment Variables'e ekle:
                <code className="block mt-1 px-2 py-1 bg-ink/5 font-mono text-xs">
                  UPSTASH_REDIS_REST_URL=https://...<br />
                  UPSTASH_REDIS_REST_TOKEN=...
                </code>
              </li>
              <li>Deploy → ziyaretçi sayacı otomatik çalışır</li>
            </ol>
          </div>
        )}
      </section>

      {!data ? (
        <p className="font-serif text-warm-gray italic">
          Veriler yüklenemedi. Sanity bağlantısını kontrol et.
        </p>
      ) : (
        <>
          {/* Stat cards */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <Stat label="Yazılar" value={data.totalArticles} />
            <Stat label="Etkinlikler" value={data.totalEvents} />
            <Stat label="Rotalar" value={data.totalRoutes} />
            <Stat label="Kategoriler" value={data.totalCategories} />
            <Stat label="Toplam Yorum" value={data.totalComments} />
            <Stat
              label="Onay Bekleyen"
              value={data.pendingComments}
              highlight={data.pendingComments > 0}
            />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Son Yorumlar */}
            <section>
              <h2 className="font-display text-xl font-bold text-ink mb-4 pb-2 border-b-2 border-ink">
                Son Yorumlar
              </h2>
              {data.latestComments?.length ? (
                <ul className="space-y-4">
                  {data.latestComments.map((c: any) => (
                    <li key={c._id} className="border-b border-ink/10 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-accent">
                          {c.authorName}
                        </div>
                        {!c.approved && (
                          <span className="font-sans text-[0.55rem] uppercase tracking-[0.15em] px-2 py-0.5 bg-accent/10 text-accent">
                            Onay Bekliyor
                          </span>
                        )}
                      </div>
                      <p className="font-serif text-sm text-soft-black mt-1 line-clamp-3">
                        {c.body}
                      </p>
                      {c.articleTitle && c.articleSlug && (
                        <Link
                          href={`/yazilar/${encodeURIComponent(c.articleSlug)}`}
                          className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-warm-gray hover:text-accent mt-1 block"
                        >
                          {c.articleTitle}
                        </Link>
                      )}
                      <div className="font-sans text-[0.55rem] text-warm-gray mt-1">
                        {fmtDate(c.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-serif text-sm text-warm-gray italic">
                  Henüz yorum yok.
                </p>
              )}
            </section>

            {/* Son Güncellenen Yazılar */}
            <section>
              <h2 className="font-display text-xl font-bold text-ink mb-4 pb-2 border-b-2 border-ink">
                Son Güncellenen Yazılar
              </h2>
              {data.latestArticles?.length ? (
                <ul className="space-y-3">
                  {data.latestArticles.map((a: any) => (
                    <li key={a._id} className="border-b border-ink/10 pb-3">
                      <Link
                        href={`/yazilar/${encodeURIComponent(a.slug?.current || "")}`}
                        className="font-display text-base font-bold text-ink hover:text-accent transition-colors block"
                      >
                        {a.title}
                      </Link>
                      <div className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-warm-gray mt-1">
                        {a.categoryTitle}
                        {a._updatedAt && ` · ${fmtDate(a._updatedAt)}`}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-serif text-sm text-warm-gray italic">
                  Henüz yazı yok.
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border-2 ${highlight ? "border-accent" : "border-ink"} p-4`}
    >
      <div className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-warm-gray mb-1">
        {label}
      </div>
      <div
        className={`font-display text-3xl font-bold ${highlight ? "text-accent" : "text-ink"}`}
      >
        {new Intl.NumberFormat("tr-TR").format(value ?? 0)}
      </div>
    </div>
  );
}
