"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyBriefingTemplateAction, deleteBriefingTemplateAction, renameBriefingTemplateAction, setDefaultBriefingTemplateAction } from "@/lib/actions/briefing-templates";
import type { AppliedResult } from "@/lib/deals/action-state";
import { POST_FORMATS, isPostFormat } from "@/lib/social/platforms";
import { formatDealDate } from "@/lib/deals/notices";
import { toast } from "@/lib/toast";
import { Dialog } from "@/components/dialog";
import { Badge, cardClass, inputClass, primaryButton, quietButton, secondaryButton } from "@/components/deals/ui";
import { useDealText } from "@/components/deals/use-deal-text";
import { useI18n } from "@/components/i18n-provider";
import { dealLocale } from "@/lib/deals/copy";

export type ManagedTemplate = {
  id: string;
  name: string;
  isDefault: boolean;
  lastUsedAt: string | null;
  formats: string[];
  market: string;
  usageType: "ORGANIC_ONLY" | "CROSS_POST" | "PAID_ADS";
};

export type ManagedRequest = { id: string; title: string; status: "DRAFT" | "OPEN" | "CLOSED"; hasBriefing: boolean };

// The brand's templates: which one new requests start from, rename, delete, and write one into several requests at once.
export function TemplateManager({ templates, requests }: { templates: ManagedTemplate[]; requests: ManagedRequest[] }) {
  const u = useDealText();
  if (templates.length === 0) return <p className="text-sm text-neutral-600 dark:text-neutral-400">{u("templates.empty")}</p>;
  return (
    <div className="flex flex-col gap-3">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} requests={requests} />
      ))}
    </div>
  );
}

function TemplateCard({ template, requests }: { template: ManagedTemplate; requests: ManagedRequest[] }) {
  const u = useDealText();
  const { locale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(template.name);
  const [applying, setApplying] = useState(false);

  const run = (task: () => Promise<{ success?: boolean; error?: string } | undefined>, done: string) =>
    startTransition(async () => {
      const result = await task().catch(() => undefined);
      if (!result?.success) {
        toast.error(result?.error ?? u("form.somethingWrong"));
        return;
      }
      toast.success(done);
      setRenaming(false);
      router.refresh();
    });

  const formats = template.formats.map((f) => (isPostFormat(f) ? POST_FORMATS[f].label : f)).join(", ");
  const summary = u("templates.summary", { formats, market: u(`briefing.market.${template.market as "DE"}`), usage: u(`briefing.usageType.${template.usageType}`) });

  return (
    <div className={`${cardClass} flex flex-col gap-3`}>
      <div className="flex flex-col items-start gap-2">
        {template.isDefault && <Badge strong>{u("templates.isDefault")}</Badge>}
        <div className="min-w-0 self-stretch">
          {renaming ? (
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => renameBriefingTemplateAction(template.id, name), u("templates.renamed"));
              }}
            >
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required autoFocus aria-label={u("briefing.template.name")} className={`${inputClass} !w-56`} />
              <button type="submit" disabled={pending} className={primaryButton}>
                {u("templates.rename")}
              </button>
              <button type="button" onClick={() => setRenaming(false)} className={quietButton}>
                {u("templates.close")}
              </button>
            </form>
          ) : (
            <h2 className="break-words font-medium">{template.name}</h2>
          )}
          <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">{summary}</p>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {template.lastUsedAt ? u("templates.lastUsed", { date: formatDealDate(new Date(template.lastUsedAt), dealLocale(locale)).split(",")[0] }) : u("templates.neverUsed")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" onClick={() => setApplying(true)} className={secondaryButton}>
          {u("templates.apply")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setDefaultBriefingTemplateAction(template.isDefault ? null : template.id), template.isDefault ? u("templates.defaultRemoved") : u("templates.defaultSet"))}
          className="text-sm underline disabled:opacity-50"
        >
          {template.isDefault ? u("templates.removeDefault") : u("templates.makeDefault")}
        </button>
        <button type="button" onClick={() => setRenaming(true)} className="text-sm underline">
          {u("templates.rename")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm(u("templates.deleteConfirm", { name: template.name }))) run(() => deleteBriefingTemplateAction(template.id), u("templates.deleted"));
          }}
          className="text-sm underline disabled:opacity-50"
        >
          {u("templates.delete")}
        </button>
      </div>

      <ApplyDialog open={applying} template={template} requests={requests} onClose={() => setApplying(false)} />
    </div>
  );
}

function ApplyDialog({ open, template, requests, onClose }: { open: boolean; template: ManagedTemplate; requests: ManagedRequest[]; onClose: () => void }) {
  const u = useDealText();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState<string[]>([]);
  const [results, setResults] = useState<AppliedResult[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const run = () =>
    startTransition(async () => {
      setProblem(null);
      const result = await applyBriefingTemplateAction(template.id, chosen).catch(() => undefined);
      if (result?.applied) {
        setResults(result.applied);
        router.refresh();
        return;
      }
      setProblem(result?.error ?? u("form.somethingWrong"));
    });

  const close = () => {
    setChosen([]);
    setResults(null);
    setProblem(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} title={u("templates.applyTitle", { name: template.name })}>
      {results ? (
        <div className="flex flex-col gap-3 text-sm">
          <ul className="flex flex-col gap-2">
            {results.map((r) => (
              <li key={r.requestId} className="flex flex-col gap-0.5">
                <span className="font-medium">
                  {r.ok ? "✓" : "✕"} {r.title}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400">{r.ok ? (r.changed ? u("templates.result.changed") : u("templates.result.unchanged")) : `${u("templates.result.failed")}: ${r.message ?? ""}`}</span>
                {r.ok && (r.staleOffers ?? 0) > 0 && (
                  <span>
                    {r.staleOffers === 1 ? u("briefing.stale.one") : u("briefing.stale.many", { count: r.staleOffers ?? 0 })}{" "}
                    <Link href={`/dashboard/startup/requests/${r.requestId}/briefing`} className="underline">
                      {u("templates.openBriefing")}
                    </Link>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <button type="button" onClick={close} className={`${secondaryButton} w-fit`}>
            {u("templates.close")}
          </button>
        </div>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{u("templates.applyHint")}</p>
          {requests.length === 0 ? (
            <p className="text-sm">{u("templates.noRequests")}</p>
          ) : (
            <>
              <div className="flex gap-4 text-sm">
                <button type="button" onClick={() => setChosen(requests.map((r) => r.id))} className="underline">
                  {u("templates.selectAll")}
                </button>
                <button type="button" onClick={() => setChosen([])} className="underline">
                  {u("templates.selectNone")}
                </button>
              </div>
              <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
                {requests.map((r) => (
                  <li key={r.id}>
                    <label className="flex items-start gap-2 rounded px-1 py-1.5 text-sm hover:bg-fog">
                      <input
                        type="checkbox"
                        checked={chosen.includes(r.id)}
                        onChange={(e) => setChosen((list) => (e.target.checked ? [...list, r.id] : list.filter((id) => id !== r.id)))}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block break-words">{r.title}</span>
                        <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                          {u(`templates.status.${r.status}`)}
                          {r.hasBriefing ? ` · ${u("templates.hasBriefing")}` : ""}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
          {problem && (
            <p className="text-sm font-medium" role="alert">
              {problem}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending || chosen.length === 0} className={primaryButton}>
              {pending ? u("form.working") : u("templates.applyRun")}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
