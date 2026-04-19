/**
 * Admin e-mail list. Only users whose email matches one of these
 * are allowed to delete comments and perform admin actions.
 */
export const ADMIN_EMAILS = [
  "akyelberke@gmail.com",
  "ssanatinrotasii@gmail.com", // Ela
];

const ADMIN_SET = new Set(ADMIN_EMAILS.map((e) => e.toLowerCase()));

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_SET.has(email.toLowerCase());
}

/**
 * Clerk user objesindeki TÜM email'leri kontrol eder.
 * primaryEmailAddress veya emailAddresses[0] zaman zaman farklı olabiliyor
 * (Google + Apple gibi 2 oauth hesabı olan kullanıcılarda).
 */
export function isAdminUser(user: {
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: Array<{ emailAddress?: string | null }>;
} | null): boolean {
  if (!user) return false;
  const primary = user.primaryEmailAddress?.emailAddress;
  if (isAdminEmail(primary)) return true;
  for (const e of user.emailAddresses || []) {
    if (isAdminEmail(e?.emailAddress)) return true;
  }
  return false;
}
