// In production React strips the message off anything a server action
// throws and sends only a digest; the browser rebuilds it as "Minified React
// error #441; visit https://react.dev/errors/441 …" (resolveErrorProd in
// react-server-dom-turbopack — the server-side bundles use the "An error
// occurred…" wording instead), so "This offer isn't awaiting your
// response." never reaches anyone. Actions that return { error } keep
// their message.
const REDACTED = /^(Minified React error #441\b|An error occurred in the Server Components render)/;

// What to show for a failed server action. A dropped connection surfaces as
// fetch's own TypeError ("Failed to fetch") — not something to show anyone
// as-is; anything thrown on purpose server-side reads fine in development,
// but only as the generic line below in production. Most of those are the
// page being out of date (the other side already answered the offer, the
// payment was already refunded), which a refresh fixes.
export function errorMessage(err: unknown): string {
  if (err instanceof TypeError) return "Couldn't reach the server — check your connection and try again.";
  if (err instanceof Error && !REDACTED.test(err.message)) return err.message;
  return "Something went wrong — refresh the page and try again.";
}
