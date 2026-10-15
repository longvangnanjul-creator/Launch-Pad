// Admin access control — only these emails can access the admin dashboard.
const ADMIN_EMAILS = ['longvangnanjul@gmail.com'];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
