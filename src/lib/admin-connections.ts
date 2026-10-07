// What the dashboard can reach, for the settings page and the setup assistant. Each is set in Vercel, never in the app:
// only whether it is there is shown, never the value.
export type AdminConnection = { label: string; ok: boolean; name: string; hint: string };

export function adminConnections(): AdminConnection[] {
  const set = (name: string) => Boolean(process.env[name]?.trim());
  return [
    { label: "Stripe", ok: set("STRIPE_SECRET_KEY"), name: "STRIPE_SECRET_KEY", hint: "Zahlungen, Provision und später der Cashflow" },
    { label: "Mails (Resend)", ok: set("RESEND_API_KEY"), name: "RESEND_API_KEY", hint: "Mails und später der Mail-Überblick" },
    {
      label: "Claude",
      ok: set("ANTHROPIC_API_KEY"),
      name: "ANTHROPIC_API_KEY",
      hint: "Briefing, Chat und Content-Studio. Key in console.anthropic.com erstellen, Guthaben aufladen und ein Monatslimit setzen.",
    },
    { label: "Fehler (Sentry)", ok: set("NEXT_PUBLIC_SENTRY_DSN"), name: "NEXT_PUBLIC_SENTRY_DSN", hint: "Fehlermeldungen, optional" },
  ];
}
