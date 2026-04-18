import { createClient } from "next-sanity";

/**
 * Server-side Sanity client with a write token.
 * Used for creating/deleting documents from API routes (comments, etc.).
 * NEVER expose this client to the browser.
 */
export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "5tddprs8",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});
