import { hasAdminAccess } from "@/lib/admin-access";

// Where someone who is already signed in goes when they open a page meant for people who are not (the landing page, the
// login form, the sign-up link). The installed app starts at /login, so this is what decides where the app opens.

// A cookie that only admins get: which area they were in last, so the installed dashboard opens where they left off.
export const HOME_COOKIE = "comtor-home";
export type HomeArea = "admin" | "app";

// A return address that may be carried through a sign-in: a path inside the admin area or the app, nothing else, so a
// link cannot send someone anywhere outside this site.
export function safeReturnPath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 200) return null;
  if (!/^\/(admin|dashboard)(\/[A-Za-z0-9\-._~%/]*)?(\?[A-Za-z0-9\-._~%=&/]*)?$/.test(raw)) return null;
  if (raw.includes("//") || raw.includes("..")) return null;
  return raw;
}

// The login page an unsigned visitor of an admin page is sent to: it remembers the page they wanted, so after signing in
// they arrive there and not in the app.
export function loginUrlFor(pathname: string, search: string): string {
  const back = pathname.startsWith("/admin") ? safeReturnPath(pathname + search) : null;
  return back ? `/login?next=${encodeURIComponent(back)}` : "/login";
}

export function signedInStartTarget(args: {
  pathname: string;
  user: { role: "ADMIN" | "STARTUP" | "CREATOR"; isAdmin?: boolean | null };
  homeCookie: string | undefined;
  next: string | null;
}): string {
  const { pathname, user, homeCookie, next } = args;
  // The page they were heading for before the sign-in.
  if (pathname === "/login" && next) return next;
  // An admin who also has a brand or creator account: the installed app opens in the area they used last.
  if (pathname === "/login" && hasAdminAccess(user) && homeCookie === "admin") return "/admin";
  return "/dashboard";
}
