"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IoChevronDown } from "react-icons/io5";
import { saveBriefingTemplateAction, setDefaultBriefingTemplateAction } from "@/lib/actions/briefing-templates";
import type { FormValues } from "@/lib/compliance/briefing-form";
import { toast } from "@/lib/toast";
import { Dialog } from "@/components/dialog";
import { Field, IssueList, cardClass, inputClass, primaryButton, secondaryButton } from "@/components/deals/ui";
import { useDealText } from "@/components/deals/use-deal-text";
import type { FieldIssue } from "@/lib/deals/action-state";

export type TemplateOption = { id: string; name: string; isDefault: boolean; values: FormValues };
export type CopyOption = { requestId: string; title: string; values: FormValues };

export const TEMPLATES_HREF = "/dashboard/startup/templates";

// Above the builder: fill the form from one of the brand's templates or from an earlier request, or keep what is in the form as
// a new template. Filling only changes the form; nothing is saved until the briefing is.
export function BriefingTemplatePanel({
  values,
  templates,
  copyable,
  startOpen,
  onFill,
}: {
  values: FormValues;
  templates: TemplateOption[];
  copyable: CopyOption[];
  startOpen: boolean;
  onFill: (next: FormValues, message: string) => void;
}) {
  const u = useDealText();
  const [saving, setSaving] = useState(false);

  return (
    <details className={`${cardClass} group`} open={startOpen}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {u("briefing.template.title")}
        <IoChevronDown className="h-4 w-4 shrink-0 text-neutral-500 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-2 flex flex-col gap-4">
        {templates.length === 0 && copyable.length === 0 && <p className="text-sm text-neutral-600 dark:text-neutral-400">{u("briefing.template.none")}</p>}

        {templates.length > 0 && (
          <Field label={u("briefing.template.use")}>
            <select
              value=""
              onChange={(e) => {
                const picked = templates.find((t) => t.id === e.target.value);
                if (picked) onFill(picked.values, u("briefing.template.filled", { name: picked.name }));
              }}
              className={inputClass}
            >
              <option value="">{u("briefing.template.choose")}</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.isDefault ? ` · ${u("briefing.template.default")}` : ""}
                </option>
              ))}
            </select>
          </Field>
        )}

        {copyable.length > 0 && (
          <Field label={u("briefing.template.fromRequest")}>
            <select
              value=""
              onChange={(e) => {
                const picked = copyable.find((c) => c.requestId === e.target.value);
                if (picked) onFill(picked.values, u("briefing.template.copied", { name: picked.title }));
              }}
              className={inputClass}
            >
              <option value="">{u("briefing.template.chooseRequest")}</option>
              {copyable.map((c) => (
                <option key={c.requestId} value={c.requestId}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setSaving(true)} className={secondaryButton}>
            {u("briefing.template.save")}
          </button>
          <Link href={TEMPLATES_HREF} className="text-sm underline">
            {u("briefing.template.manage")}
          </Link>
        </div>
      </div>
      <SaveTemplateDialog open={saving} values={values} onClose={() => setSaving(false)} />
    </details>
  );
}

function SaveTemplateDialog({ open, values, onClose }: { open: boolean; values: FormValues; onClose: () => void }) {
  const u = useDealText();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [issues, setIssues] = useState<FieldIssue[]>([]);

  const save = () =>
    startTransition(async () => {
      setProblem(null);
      setIssues([]);
      const fd = new FormData();
      for (const [key, value] of Object.entries(values)) fd.set(key, value ?? "");
      fd.set("name", name);
      const result = await saveBriefingTemplateAction(undefined, fd).catch(() => undefined);
      if (!result?.success || !result.templateId) {
        setProblem(result?.error ?? u("form.somethingWrong"));
        setIssues(result?.issues ?? []);
        return;
      }
      if (makeDefault) await setDefaultBriefingTemplateAction(result.templateId).catch(() => undefined);
      toast.success(u("briefing.template.saved", { name: name.trim() }));
      setName("");
      setMakeDefault(false);
      onClose();
      router.refresh();
    });

  return (
    <Dialog open={open} onClose={onClose} title={u("briefing.template.save")}>
      {/* Not a <form>: this dialog sits inside the briefing form, and a nested form would submit that one too. */}
      <div className="flex flex-col gap-3">
        <Field label={u("briefing.template.name")} hint={u("briefing.template.nameHint")}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              save();
            }}
            maxLength={60}
            autoFocus
            className={inputClass}
          />
        </Field>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="mt-0.5" />
          {u("briefing.template.makeDefault")}
        </label>
        {problem && issues.length === 0 && (
          <p className="text-sm font-medium" role="alert">
            {problem}
          </p>
        )}
        <IssueList issues={issues} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={save} disabled={pending} className={primaryButton}>
            {pending ? u("form.working") : u("briefing.template.save")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
