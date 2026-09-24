"use client";

import { useActionState, useState } from "react";
import { createRequestAction, updateRequestAction } from "@/lib/actions/requests";
import { NICHES, PRODUCT_CATEGORIES, LANGUAGES } from "@/lib/constants";
import { Select } from "@/components/select";
import { MultiSelect } from "@/components/multi-select";
import { RequestImageUpload } from "@/components/request-image-upload";

type Props = {
  requestId?: string;
  initial?: {
    title: string;
    description: string;
    niche: string;
    languages: string[];
    productCategory: string;
    minFollowers: number;
    imageUrl?: string | null;
  };
};

export function RequestForm({ requestId, initial }: Props) {
  const action = requestId ? updateRequestAction.bind(null, requestId) : createRequestAction;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [languages, setLanguages] = useState<string[]>(initial?.languages ?? ["English"]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Reference image (optional)</label>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
          Shown at the top of the card in a creator&apos;s feed — a product photo or mood image helps them
          understand what you want at a glance.
        </p>
        <RequestImageUpload initial={initial?.imageUrl} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={initial?.title}
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={initial?.description}
          required
          rows={5}
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="niche" className="text-sm font-medium">
            Niche
          </label>
          <Select id="niche" name="niche" defaultValue={initial?.niche} required>
            {NICHES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="productCategory" className="text-sm font-medium">
            Product category
          </label>
          <Select id="productCategory" name="productCategory" defaultValue={initial?.productCategory} required>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Content language</label>
          <input type="hidden" name="languages" value={languages.join(",")} />
          <MultiSelect label="Select languages" options={LANGUAGES} selected={languages} onChange={setLanguages} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="minFollowers" className="text-sm font-medium">
          Minimum follower count
        </label>
        <input
          id="minFollowers"
          name="minFollowers"
          type="number"
          min={0}
          defaultValue={initial?.minFollowers ?? 0}
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
        />
      </div>
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50 self-start"
      >
        {pending ? "Saving…" : requestId ? "Save changes" : "Publish request"}
      </button>
    </form>
  );
}
