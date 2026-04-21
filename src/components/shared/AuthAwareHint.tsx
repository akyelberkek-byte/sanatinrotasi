"use client";

import { useAuth } from "@clerk/nextjs";

/**
 * Server tarafı `currentUser()` null döndürdüğünde (session cookie yok)
 * ama Clerk client `useAuth()` "signed-in" diyorsa → cookie/domain uyumsuzluğu
 * var demektir. Kullanıcıya net bir talimat ver.
 *
 * Development Clerk key'i ile production domain'i (sanatinrotasi.com) kullanıldığında
 * en sık görülen semptom bu.
 */
export default function AuthAwareHint() {
  let isSignedIn: boolean | undefined = undefined;
  let isLoaded = false;
  try {
    const auth = useAuth();
    isSignedIn = auth.isSignedIn;
    isLoaded = auth.isLoaded;
  } catch {
    // Clerk provider yoksa sessizce geç
    return null;
  }

  if (!isLoaded) return null;
  if (!isSignedIn) return null;

  // Client "signed-in" diyor ama server bunu parent'a signed-out olarak geçti
  // (AuthAwareHint yalnızca parent signed-out render'ladığında ekrana giriyor).
  return (
    <div className="mt-4 p-3 border border-accent/30 bg-accent/5 text-left">
      <p className="font-sans text-[0.7rem] uppercase tracking-[0.15em] text-accent mb-1">
        Oturum uyuşmazlığı tespit edildi
      </p>
      <p className="font-serif text-sm text-soft-black leading-snug">
        Tarayıcında giriş yapılı görünüyor ama sunucu oturumunu göremedi.
        Çözüm: <strong>sayfayı yenile</strong> (Ctrl/Cmd+Shift+R). Yine olmazsa
        çıkış yapıp yeniden gir. Bu durum genelde eski oturum cookie&apos;sinden
        veya farklı bir cihazda giriş yapılmasından kaynaklanır.
      </p>
    </div>
  );
}
