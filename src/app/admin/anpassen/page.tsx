import { FiCheck, FiMinus } from "react-icons/fi";
import { requireAdminSession } from "@/lib/admin-session";
import { getAdminPrefs } from "@/lib/admin-prefs-server";
import { SettingsForm } from "@/components/admin/settings-form";
import { adminConnections } from "@/lib/admin-connections";

export const metadata = { title: "Anpassen" };

export default async function AdminSettingsPage() {
  const session = await requireAdminSession();
  const prefs = await getAdminPrefs(session.user.id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="font-display text-title-1 font-black">Anpassen</h1>
        <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">Dein Dashboard, so wie du es willst.</p>
      </div>

      <SettingsForm initial={prefs} />

      <section id="verbindungen" className="adm-card scroll-mt-6 p-[var(--pad,1.25rem)]">
        <h2 className="mb-1 text-footnote font-bold text-neutral-600 dark:text-neutral-400">Verbindungen</h2>
        <p className="mb-3 text-xs text-neutral-600 dark:text-neutral-400">
          Keys trägst du selbst in Vercel unter Settings → Environment Variables ein, nie im Chat und nie hier. Gezeigt wird nur, ob sie da sind.
        </p>
        <ul>
          {adminConnections().map((c) => (
            <li key={c.name} className="flex items-start gap-3 border-t border-ink/10 py-3 first:border-t-0 first:pt-0">
              <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${c.ok ? "bg-accent text-on-accent" : "border border-ink/20 text-graphite"}`}>
                {c.ok ? <FiCheck className="h-3 w-3" strokeWidth={3} aria-hidden /> : <FiMinus className="h-3 w-3" aria-hidden />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {c.label} <span className="font-normal text-neutral-500">· {c.ok ? "verbunden" : "fehlt"}</span>
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  <code className="rounded bg-fog px-1">{c.name}</code> · {c.hint}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
