import { cache } from "react";
import { client } from "@/sanity/client";
import { SITE_SETTINGS_QUERY } from "@/sanity/queries";

/**
 * Tek bir request içinde birden fazla sayfa/komponent SITE_SETTINGS_QUERY
 * çağırırsa React cache() bunları deduplicate eder → Sanity'ye tek istek.
 *
 * Next.js fetch cache (revalidate: 60) zaten var; bu React cache() ile
 * aynı render ağacındaki tüm tüketicileri de kapsar.
 */
export const getSiteSettings = cache(async () => {
  try {
    return await client.fetch(
      SITE_SETTINGS_QUERY,
      {},
      { next: { revalidate: 60 } },
    );
  } catch {
    return null;
  }
});
