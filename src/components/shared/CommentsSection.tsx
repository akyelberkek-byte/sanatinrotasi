"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AuthAwareHint from "./AuthAwareHint";

type Comment = {
  _id: string;
  authorName: string;
  authorImage?: string;
  body: string;
  createdAt: string;
  likeCount?: number;
  likedBy?: string[];
};

interface CommentsSectionProps {
  articleId: string;
  articleSlug: string;
  initialComments: Comment[];
  currentUser: {
    id: string;
    name: string;
    image?: string;
  } | null;
  isAdmin: boolean;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function CommentsSection({
  articleId,
  articleSlug,
  initialComments,
  currentUser,
  isAdmin,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "pending">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    const trimmed = text.trim();
    if (trimmed.length < 1) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, articleSlug, body: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Yorum gönderilemedi");
        return;
      }

      // Onay gerekiyorsa yorum listesine eklenmez; kullanıcıya pending bildirilir.
      if (data.pending) {
        setText("");
        setStatus("pending");
      } else {
        setComments((prev) => [...prev, data.comment]);
        setText("");
        setStatus("idle");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Bir hata oluştu, tekrar deneyin.");
    }
  }

  async function handleLike(id: string) {
    if (!currentUser) return;
    // Optimistic UI update — API geldiğinde geri düzeltilir
    setComments((prev) =>
      prev.map((c) => {
        if (c._id !== id) return c;
        const has = c.likedBy?.includes(currentUser.id);
        const nextLikedBy = has
          ? (c.likedBy || []).filter((u) => u !== currentUser.id)
          : [...(c.likedBy || []), currentUser.id];
        return { ...c, likedBy: nextLikedBy, likeCount: nextLikedBy.length };
      })
    );

    try {
      const res = await fetch(`/api/comments/${id}/like`, { method: "POST" });
      if (!res.ok) {
        // Başarısız → geri al
        setComments((prev) =>
          prev.map((c) => {
            if (c._id !== id) return c;
            const has = c.likedBy?.includes(currentUser.id);
            const revertedLikedBy = has
              ? (c.likedBy || []).filter((u) => u !== currentUser.id)
              : [...(c.likedBy || []), currentUser.id];
            return {
              ...c,
              likedBy: revertedLikedBy,
              likeCount: revertedLikedBy.length,
            };
          })
        );
      } else {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c._id === id
              ? {
                  ...c,
                  likeCount: data.count,
                  likedBy: data.liked
                    ? [...(c.likedBy || []).filter((u) => u !== currentUser.id), currentUser.id]
                    : (c.likedBy || []).filter((u) => u !== currentUser.id),
                }
              : c
          )
        );
      }
    } catch {
      // Network hatası — sessizce ignore, UI zaten optimistic
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu yorumu silmek istediğine emin misin?")) return;

    try {
      const res = await fetch(
        `/api/comments/${id}?articleSlug=${encodeURIComponent(articleSlug)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        alert("Yorum silinemedi");
        return;
      }
      setComments((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert("Yorum silinemedi");
    }
  }

  return (
    <section className="mt-16 pt-10 border-t-2 border-ink">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-ink mb-8">
        Yorumlar
        {comments.length > 0 && (
          <span className="font-sans text-sm font-normal text-warm-gray ml-3">
            ({comments.length})
          </span>
        )}
      </h2>

      {/* Comment Form */}
      {currentUser ? (
        <form
          onSubmit={handleSubmit}
          className="mb-10 p-6 border-2 border-ink/10 bg-paper/30"
        >
          <div className="flex items-center gap-3 mb-4">
            {currentUser.image && (
              <Image
                src={currentUser.image}
                alt={currentUser.name}
                width={36}
                height={36}
                className="rounded-full"
                unoptimized
              />
            )}
            <div>
              <span className="font-sans text-sm font-medium text-ink">
                {currentUser.name}
              </span>
              <p className="font-sans text-[0.65rem] uppercase tracking-[0.15em] text-warm-gray">
                Yorum yapıyorsun
              </p>
            </div>
          </div>
          <label htmlFor="comment-input" className="sr-only">
            Yorumunuz
          </label>
          <textarea
            id="comment-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Yorumunuzu yazın..."
            rows={4}
            maxLength={2000}
            disabled={status === "loading"}
            className="w-full px-4 py-3 border border-ink/20 bg-white font-serif text-base text-ink focus:outline-none focus:border-accent resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="font-sans text-[0.65rem] text-warm-gray">
              {text.length}/2000
            </span>
            <button
              type="submit"
              disabled={status === "loading" || text.trim().length === 0}
              className="px-6 py-2 bg-ink text-cream font-sans text-xs uppercase tracking-[0.2em] border border-ink hover:bg-accent hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Gönderiliyor..." : "Yorum Yap"}
            </button>
          </div>
          {status === "error" && (
            <p className="font-sans text-xs text-accent mt-2" role="alert">
              {errorMsg}
            </p>
          )}
          {status === "pending" && (
            <p className="font-sans text-xs text-accent mt-2" role="status">
              Yorumun alındı, onaylandığında burada görünecek.
            </p>
          )}
        </form>
      ) : (
        <div className="mb-10 p-6 border-2 border-ink/10 bg-paper/30 text-center">
          <p className="font-serif text-base text-soft-black mb-3">
            Yorum yapabilmek için giriş yapmalısın.
          </p>
          <AuthAwareHint />
          <div className="flex gap-3 justify-center mt-4">
            <Link
              href="/giris"
              className="px-5 py-2 border border-ink text-ink font-sans text-xs uppercase tracking-[0.2em] hover:bg-ink hover:text-cream transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              href="/kayit"
              className="px-5 py-2 bg-ink text-cream font-sans text-xs uppercase tracking-[0.2em] hover:bg-accent hover:border-accent border border-ink transition-colors"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="font-serif text-base text-warm-gray italic text-center py-8">
          Henüz yorum yok. İlk yorumu sen yap.
        </p>
      ) : (
        <ul className="space-y-6">
          {comments.map((c) => (
            <li
              key={c._id}
              className="flex gap-4 pb-6 border-b border-ink/10 last:border-0"
            >
              {c.authorImage ? (
                <Image
                  src={c.authorImage}
                  alt={c.authorName}
                  width={40}
                  height={40}
                  className="rounded-full flex-shrink-0"
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-warm-gray/30 flex items-center justify-center font-sans text-sm text-ink flex-shrink-0">
                  {c.authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-sans text-sm font-medium text-ink">
                    {c.authorName}
                  </span>
                  <span className="font-sans text-[0.65rem] text-warm-gray">
                    {formatDate(c.createdAt)}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="ml-auto font-sans text-[0.65rem] uppercase tracking-[0.15em] text-accent hover:text-accent-dark transition-colors"
                      aria-label="Yorumu sil"
                    >
                      Sil
                    </button>
                  )}
                </div>
                <p className="font-serif text-base text-soft-black mt-2 whitespace-pre-line break-words">
                  {c.body}
                </p>
                <div className="mt-2">
                  {currentUser ? (
                    <button
                      onClick={() => handleLike(c._id)}
                      className="font-sans text-[0.65rem] uppercase tracking-[0.15em] text-warm-gray hover:text-accent transition-colors inline-flex items-center gap-1.5"
                      aria-label={
                        c.likedBy?.includes(currentUser.id)
                          ? "Beğeniyi kaldır"
                          : "Beğen"
                      }
                    >
                      <span className={c.likedBy?.includes(currentUser.id) ? "text-accent" : ""}>
                        {c.likedBy?.includes(currentUser.id) ? "♥" : "♡"}
                      </span>
                      <span>{c.likeCount && c.likeCount > 0 ? c.likeCount : "Beğen"}</span>
                    </button>
                  ) : (
                    (c.likeCount ?? 0) > 0 && (
                      <span className="font-sans text-[0.65rem] uppercase tracking-[0.15em] text-warm-gray inline-flex items-center gap-1.5">
                        <span>♥</span>
                        <span>{c.likeCount}</span>
                      </span>
                    )
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
