import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { client } from "@/sanity/client";
import { ARTICLES_BY_IDS_QUERY } from "@/sanity/queries";
import ArticleCard from "@/components/shared/ArticleCard";

export const metadata: Metadata = {
  title: "Kaydettiklerim",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function KaydettiklerimPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/giris?redirect_url=/kaydettiklerim");
  }

  let favorites: string[] = [];
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const raw = user.publicMetadata?.favorites;
    if (Array.isArray(raw)) {
      favorites = raw.filter((v): v is string => typeof v === "string");
    }
  } catch {
    favorites = [];
  }

  const articles = favorites.length
    ? await client
        .fetch(ARTICLES_BY_IDS_QUERY, { ids: favorites })
        .catch(() => [])
    : [];

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-10 animate-fade-up">
        <p className="font-sans text-[0.65rem] uppercase tracking-[0.25em] text-accent mb-2">
          Hesabım
        </p>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-ink leading-tight">
          Kaydettiklerim
        </h1>
        <p className="font-serif text-base md:text-lg text-soft-black/80 mt-4 max-w-2xl">
          Sonra okumak için kaydettiğin yazılar.
        </p>
      </header>

      {articles.length === 0 ? (
        <div className="py-10">
          <p className="font-serif text-base text-warm-gray italic">
            Henüz kaydedilmiş yazı yok. Bir yazının üstündeki{" "}
            <span className="text-accent">★</span> simgesine dokunarak kaydedebilirsin.
          </p>
          <Link
            href="/yazilar"
            className="inline-block mt-5 px-5 py-2 border border-ink text-ink font-sans text-xs uppercase tracking-[0.2em] hover:bg-ink hover:text-cream transition-colors"
          >
            Yazılara Git
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((a: any) => (
            <ArticleCard key={a._id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
