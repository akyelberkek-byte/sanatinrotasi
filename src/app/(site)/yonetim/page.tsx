import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { client } from "@/sanity/client";
import { isAdminEmail } from "@/lib/admin";
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
  const email = user?.emailAddresses?.[0]?.emailAddress;

  if (!user) {
    redirect("/giris?redirect_url=/yonetim");
  }
  if (!isAdminEmail(email)) {
    redirect("/");
  }

  const data = await client
    .fetch(ADMIN_DASHBOARD_QUERY, {}, { next: { revalidate: 0 } })
    .catch(() => null);

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
                          href={`/yazilar/${c.articleSlug}`}
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
                        href={`/yazilar/${a.slug?.current}`}
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
        {value ?? 0}
      </div>
    </div>
  );
}
