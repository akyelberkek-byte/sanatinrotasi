/**
 * Admin e-mail list. Only users whose primary email matches one of these
 * are allowed to delete comments and perform admin actions.
 */
export const ADMIN_EMAILS = [
  "akyelberke@gmail.com",
  // Ela'nın e-postası buraya eklenebilir
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());
}
