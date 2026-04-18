import TopBar from "@/components/layout/TopBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { client } from "@/sanity/client";
import { SITE_SETTINGS_QUERY } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";

export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await client.fetch(SITE_SETTINGS_QUERY).catch(() => null);

  const logoUrl = settings?.logo?.asset
    ? urlFor(settings.logo).width(180).height(180).url()
    : undefined;

  return (
    <div className="flex flex-col min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-ink focus:text-cream focus:font-sans focus:text-sm"
      >
        Ana içeriği atla
      </a>
      <TopBar left={settings?.topBarLeft} right={settings?.topBarRight} />
      <Navbar logoUrl={logoUrl} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer
        footerText={settings?.footerText}
        instagramUrl={settings?.socialLinks?.instagram}
        youtubeUrl={settings?.socialLinks?.youtube}
      />
    </div>
  );
}
