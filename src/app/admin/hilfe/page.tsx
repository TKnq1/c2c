import Link from "next/link";
import { FiCheckCircle, FiCircle } from "react-icons/fi";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { adminConnections } from "@/lib/admin-connections";
import { DashCard, PageHeader } from "@/components/admin/dashboard-parts";

export const metadata = { title: "Hilfe" };

const GLOSSARY: { term: string; text: string }[] = [
  { term: "Aktiv", text: "Ein Nutzer, der in dem Zeitraum etwas getan hat: angemeldet, eine Anfrage gestellt, Interesse gezeigt oder eine Nachricht geschickt." },
  { term: "Aktivierung", text: "Anteil der Neuen, die in ihrer ersten Woche etwas getan haben. Bei Marken eine erste Anfrage, bei Creatorn ein erstes Interesse." },
  { term: "Wiederkehr", text: "Anteil derer, die vor 7 bis 37 Tagen dazukamen und in der letzten Woche wieder aktiv waren." },
  { term: "Reichweite des Geldes", text: "Wie viele Monate der Kontostand bei dem Verbrauch der letzten 30 Tage reicht. Verbrauch ist Kosten minus Einnahmen." },
  { term: "Provision", text: "Der Anteil, den comtor an freigegebenen Zahlungen behält. Zahlungen im Zustand „gehalten“ zählen erst nach der Freigabe." },
  { term: "Kosten je Anmeldung (CPA)", text: "Ausgaben einer Kampagne geteilt durch die Anmeldungen, die über denselben Kampagnennamen kamen." },
  { term: "Klickrate (CTR)", text: "Klicks geteilt durch Impressionen." },
  { term: "Kosten je Klick (CPC)", text: "Ausgaben geteilt durch Klicks." },
  { term: "Klick zur Anmeldung", text: "Anmeldungen geteilt durch Klicks. Das ist die Conversion-Rate der Anzeige." },
  { term: "Kampagnenname", text: "Der Name im Link (utm_campaign) und im Werbe-Manager. Das Dashboard bereinigt ihn auf Kleinbuchstaben, Ziffern und . _ - +, Leerzeichen werden zu Bindestrichen. So finden Ausgaben und Anmeldungen zusammen." },
  { term: "Streitfall", text: "Eine Marke meldet ein Problem mit einem eingereichten Beitrag. Das Geld bleibt eingefroren, bis du es freigibst oder zurückerstattest." },
];

function Row({ ok, title, hint, href }: { ok: boolean; title: string; hint: string; href?: string }) {
  const Icon = ok ? FiCheckCircle : FiCircle;
  return (
    <li className="flex items-start gap-3 border-t border-ink/10 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${ok ? "text-[#0ca30c]" : "text-graphite"}`} aria-hidden />
      <div className="min-w-0 text-sm">
        <p className="font-bold">
          {href && !ok ? (
            <Link href={href} className="underline underline-offset-2">
              {title}
            </Link>
          ) : (
            title
          )}
          <span className="sr-only">{ok ? " (erledigt)" : " (offen)"}</span>
        </p>
        <p className="text-neutral-600 dark:text-neutral-400">{hint}</p>
      </div>
    </li>
  );
}

export default async function AdminHelpPage() {
  await requireAdminSession();
  const [settings, fixedCosts, adSpend] = await Promise.all([
    prisma.adminSettings.findUnique({ where: { id: 1 }, select: { cashBalanceCents: true } }),
    prisma.fixedCost.count({ where: { active: true } }),
    prisma.adSpend.count(),
  ]);
  const connections = adminConnections();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Hilfe" sub="Was noch eingerichtet werden kann, damit alle Seiten Zahlen zeigen, und was die Begriffe bedeuten." />

      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DashCard title="Verbindungen" right="in Vercel gesetzt">
          <ul>
            {connections.map((c) => (
              <Row key={c.label} ok={c.ok} title={c.label} hint={c.ok ? c.hint : `${c.hint} Setze ${c.name}.`} />
            ))}
          </ul>
        </DashCard>

        <DashCard title="Daten, die du selbst einträgst">
          <ul>
            <Row ok={settings?.cashBalanceCents != null} title="Kontostand" hint="Ohne ihn kann die Reichweite des Geldes nicht berechnet werden." href="/admin/geld" />
            <Row ok={fixedCosts > 0} title="Fixkosten" hint="Hosting, Domain, Tools. Sie gehen in den monatlichen Verbrauch ein." href="/admin/geld" />
            <Row ok={adSpend > 0} title="Werbeausgaben" hint="Per CSV-Import oder von Hand. Ohne sie gibt es keine Kosten je Anmeldung." href="/admin/ads" />
          </ul>
          <p className="mt-4 text-xs text-neutral-500">
            Dein Name, die Akzentfarbe, die Ziele und der Morgen-Start stehen unter{" "}
            <Link href="/admin/anpassen" className="font-bold underline underline-offset-2">
              Anpassen
            </Link>
            .
          </p>
        </DashCard>
      </div>

      <DashCard title="Noch nicht gebaut">
        <p className="text-sm">
          Alles, was die Claude-API braucht, fehlt bewusst: Content-Studio, tägliches Briefing, Chat, von Claude angelegte Aufgaben, der Wochenrückblick und die Verbrauchsanzeige. Die API wird getrennt vom Pro-Abo abgerechnet und braucht einen eigenen Schlüssel mit Guthaben. Die Punkte stehen unter{" "}
          <Link href="/admin/offen" className="font-bold underline underline-offset-2">
            Offen
          </Link>
          .
        </p>
      </DashCard>

      <DashCard title="Begriffe">
        <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div key={g.term}>
              <dt className="text-sm font-bold">{g.term}</dt>
              <dd className="text-sm text-neutral-600 dark:text-neutral-400">{g.text}</dd>
            </div>
          ))}
        </dl>
      </DashCard>
    </div>
  );
}
