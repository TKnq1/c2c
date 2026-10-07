// What the dashboard can reach, for the settings page and the setup assistant. Each is set in Vercel, never in the app:
// only whether it is there is shown, never the value.
export type AdminConnection = { label: string; ok: boolean; name: string; hint: string };

export function adminConnections(): AdminConnection[] {
  const set = (name: string) => Boolean(process.env[name]?.trim());
  return [
    { label: "Stripe", ok: set("STRIPE_SECRET_KEY"), name: "STRIPE_SECRET_KEY", hint: "Zahlungen, Provision, Cashflow und fehlgeschlagene Webhooks" },
    { label: "Mails (Resend)", ok: set("RESEND_API_KEY"), name: "RESEND_API_KEY", hint: "Mails verschicken, im Mail-Überblick gezählt" },
    { label: "Fehler senden (Sentry)", ok: set("NEXT_PUBLIC_SENTRY_DSN"), name: "NEXT_PUBLIC_SENTRY_DSN", hint: "Die App meldet Fehler an Sentry. Optional." },
    {
      label: "Fehler lesen (Sentry)",
      ok: set("SENTRY_AUTH_TOKEN") && set("SENTRY_ORG") && set("SENTRY_PROJECT"),
      name: "SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT",
      hint: "Damit zeigt die Technik-Seite die Fehler der letzten 24 Stunden. Token mit reinem Lesezugriff genügt.",
    },
  ];
}
