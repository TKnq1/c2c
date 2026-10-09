"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiCheck, FiChevronRight } from "react-icons/fi";
import { createRequestAction, updateRequestAction } from "@/lib/actions/requests";
import { NICHES, PLATFORMS, PRODUCT_CATEGORIES, LANGUAGES } from "@/lib/constants";
import { formatBudget, formatPostBy } from "@/lib/format";
import { Dialog } from "@/components/dialog";
import { Switch } from "@/components/switch";
import { PlatformIcon } from "@/components/platform-icons";
import { RequestPhotosInput, type PhotoItem } from "@/components/request-photos-input";
import { RequestCardFace, postByDate, type CardRequest } from "@/components/request-card-face";
import { useI18n } from "@/components/i18n-provider";
import { categoryLabel, contentLanguageLabel, nicheLabel, presetLabel } from "@/lib/i18n/labels";
import { localizeError } from "@/lib/i18n/labels";

// One-tap starting points for "Content", per platform — the field stays
// free text for anything else.
const CONTENT_PRESETS: Record<string, string[]> = {
  Instagram: ["1 Reel", "1 Reel + 2 Stories", "1 Post", "3 Stories"],
  TikTok: ["1 Video", "2 Videos"],
  YouTube: ["1 Short", "1 Video", "1 Integration"],
  Twitch: ["1 Stream mention", "1 Sponsored stream"],
  X: ["1 Post", "1 Thread"],
};
const FOLLOWER_PRESETS = [0, 1_000, 5_000, 10_000, 50_000, 100_000];

// Vercel caps a request body at 4.5 MB; leave room for the other fields.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type RequestFormInitial = {
  title: string;
  description: string;
  niche: string;
  languages: string[];
  productCategory: string;
  minFollowers: number;
  photos: PhotoItem[];
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  platform: string | null;
  deliverables: string | null;
  postBy: string | null;
  productIncluded: boolean;
};

type Props = {
  requestId?: string;
  // Who the live preview shows as the brand.
  brand: { companyName: string; avatarUrl: string | null; rating: { average: number; count: number } };
  initial?: RequestFormInitial;
  // Posting needs a confirmed email address; the form says so before it's tried.
  emailVerified: boolean;
  // Only on Edit. A draft can be saved as it is or posted; a request that is already posted just saves.
  status?: "OPEN" | "CLOSED" | "DRAFT";
};

type Sheet = "description" | "platform" | "content" | "budget" | "postBy" | "category" | "niche" | "followers" | "languages";

const euros = (cents: number | null) => (cents === null ? "" : String(cents % 100 ? (cents / 100).toFixed(2) : cents / 100));
const cents = (value: string) => {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
};

// The New/Edit request form, laid out like a settings screen: the title
// typed in place, everything else a row showing its value that opens a
// sheet to change it — and a live preview of the card creators will swipe.
// Every value lives in state and goes up as a hidden input, since a
// sheet's contents only exist while it's open.
export function RequestForm({ requestId, brand, initial, emailVerified, status }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const action = requestId ? updateRequestAction.bind(null, requestId) : createRequestAction;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [clientError, setClientError] = useState<string | null>(null);
  // A new request and a draft end in "Post request" (and, beside it, "Save draft"); one that is
  // already posted only saves.
  const isDraftForm = !requestId || status === "DRAFT";
  const [mode, setMode] = useState<"post" | "draft">("post");
  const needsVerification = isDraftForm && !emailVerified;

  // The link in the mail is usually opened in another tab or app: coming back re-reads whether the
  // address is confirmed by now, keeping everything typed into the form.
  useEffect(() => {
    if (!needsVerification) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [needsVerification, router]);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const close = () => setSheet(null);

  const [photos, setPhotos] = useState<PhotoItem[]>(initial?.photos ?? []);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [platform, setPlatform] = useState(initial?.platform ?? PLATFORMS[0]);
  const [deliverables, setDeliverables] = useState(initial?.deliverables ?? "");
  const [budgetMin, setBudgetMin] = useState(euros(initial?.budgetMinCents ?? null));
  const [budgetMax, setBudgetMax] = useState(
    initial && initial.budgetMaxCents !== initial.budgetMinCents ? euros(initial.budgetMaxCents) : "",
  );
  const [postBy, setPostBy] = useState(initial?.postBy ?? "");
  const [productIncluded, setProductIncluded] = useState(initial?.productIncluded ?? false);
  const [productCategory, setProductCategory] = useState(initial?.productCategory ?? PRODUCT_CATEGORIES[0]);
  const [niche, setNiche] = useState(initial?.niche ?? NICHES[0]);
  const [languages, setLanguages] = useState<string[]>(initial?.languages ?? ["English"]);
  const [minFollowers, setMinFollowers] = useState(String(initial?.minFollowers ?? 0));

  const minCents = cents(budgetMin);
  const maxCents = minCents === null ? null : (cents(budgetMax) ?? minCents);
  const budget = formatBudget(minCents, maxCents);

  // What creators will see, live, as the form fills in.
  const preview: CardRequest = {
    title: title.trim() || t("screens.requests.previewTitle"),
    description,
    niche,
    languages,
    minFollowers: Number(minFollowers) || 0,
    productCategory,
    companyName: brand.companyName,
    companyAvatarUrl: brand.avatarUrl,
    rating: brand.rating,
    photos: photos.map((p) => p.url),
    budgetMinCents: minCents,
    budgetMaxCents: maxCents,
    platform,
    deliverables: deliverables.trim() || null,
    postBy: postBy || null,
    productIncluded,
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Enter in the title field submits with the form's first button, which is "Post request".
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const asDraft = isDraftForm && submitter?.value === "draft";
    setMode(asDraft ? "draft" : "post");
    // The rows aren't native inputs, so check what they'd otherwise have
    // enforced with `required` — the server re-checks everything anyway.
    // A draft can be saved however little is filled in.
    const missing = asDraft
      ? null
      : !title.trim()
        ? t("screens.requests.missingTitle")
        : !description.trim()
          ? t("screens.requests.missingDescription")
          : !deliverables.trim()
            ? t("screens.requests.missingContent")
            : minCents === null
              ? t("screens.requests.missingBudget")
              : null;
    const newPhotos = photos.filter((p) => p.kind === "new");
    const tooLarge = newPhotos.reduce((sum, p) => sum + p.file.size, 0) > MAX_UPLOAD_BYTES;
    setClientError(missing ?? (tooLarge ? t("screens.requests.photosTooLarge") : null));
    if (missing || tooLarge) return;

    const formData = new FormData(e.currentTarget);
    formData.set("intent", asDraft ? "draft" : "post");
    for (const p of newPhotos) formData.append("photos", p.file);
    formData.set(
      "photoOrder",
      JSON.stringify(photos.map((p) => (p.kind === "new" ? `new:${newPhotos.indexOf(p)}` : p.kind === "existing" ? `existing:${p.id}` : "legacy"))),
    );
    startTransition(() => formAction(formData));
  }

  // The notice below already says it when the address isn't confirmed.
  const error = clientError ?? (state?.code === "VERIFY_EMAIL" && needsVerification ? null : state?.error);

  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-[minmax(0,1fr)_300px] md:items-start">
        <div className="flex flex-col gap-8 md:col-start-1">
          <Section title={t("screens.requests.photos")} hint={t("screens.requests.photosHint")}>
            <RequestPhotosInput photos={photos} onChange={setPhotos} />
          </Section>

          <Section title={t("screens.requests.theDeal")}>
            <div className="rounded bg-fog px-4 pt-4 pb-1">
              <div className="flex flex-col gap-1.5 pb-3">
                <label htmlFor="title" className="text-sm font-semibold">
                  {t("screens.requests.title")}
                </label>
                <input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder={t("screens.requests.titlePlaceholder")}
                  className={input}
                />
              </div>
              <Row label={t("screens.requests.description")} value={description.trim() || null} onClick={() => setSheet("description")} placeholder={t("screens.requests.addDetails")} />
              <Row
                label={t("screens.requests.platform")}
                value={platform}
                icon={<PlatformIcon platform={platform} className="h-3.5 w-3.5 shrink-0" />}
                onClick={() => setSheet("platform")}
              />
              <Row label={t("screens.requests.content")} value={deliverables.trim() ? presetLabel(t, deliverables.trim()) : null} onClick={() => setSheet("content")} placeholder={t("screens.requests.contentPlaceholder")} />
              <Row label={t("screens.requests.budget")} value={budget} onClick={() => setSheet("budget")} placeholder={t("screens.requests.setRange")} strong />
              <Row label={t("screens.requests.postBy")} value={postBy ? formatPostBy(postByDate(postBy), locale) : null} onClick={() => setSheet("postBy")} placeholder={t("screens.requests.pickDate")} />
              <Row label={t("screens.requests.productCategory")} value={categoryLabel(t, productCategory)} onClick={() => setSheet("category")} />
              <div className="flex h-[46px] items-center justify-between gap-4 border-t border-ink/10">
                <span className="text-sm font-semibold">{t("screens.requests.productIncluded")}</span>
                <Switch checked={productIncluded} onChange={setProductIncluded} label={t("screens.requests.productIncluded")} />
              </div>
            </div>
          </Section>

          <Section title={t("screens.requests.whoFor")}>
            <div className="rounded bg-fog px-4 py-1">
              <Row label={t("screens.requests.niche")} value={nicheLabel(t, niche)} onClick={() => setSheet("niche")} first />
              <Row label={t("screens.requests.minFollowers")} value={(Number(minFollowers) || 0).toLocaleString(locale)} onClick={() => setSheet("followers")} />
              <Row label={t("screens.requests.language")} value={languages.map((language) => contentLanguageLabel(t, language)).join(", ")} onClick={() => setSheet("languages")} />
            </div>
          </Section>

          <input type="hidden" name="description" value={description} />
          <input type="hidden" name="platform" value={platform} />
          <input type="hidden" name="deliverables" value={deliverables} />
          <input type="hidden" name="budgetMin" value={budgetMin} />
          <input type="hidden" name="budgetMax" value={budgetMax} />
          <input type="hidden" name="postBy" value={postBy} />
          <input type="hidden" name="productCategory" value={productCategory} />
          <input type="hidden" name="productIncluded" value={String(productIncluded)} />
          <input type="hidden" name="niche" value={niche} />
          <input type="hidden" name="minFollowers" value={minFollowers} />
          <input type="hidden" name="languages" value={languages.join(",")} />
        </div>

        <aside className="flex flex-col gap-3 md:sticky md:top-4 md:col-start-2 md:row-span-2 md:row-start-1">
          <div>
            <h2 className="font-semibold">{t("screens.requests.preview")}</h2>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{t("screens.requests.previewHint")}</p>
          </div>
          {/* Laid out at the Feed card's real size and scaled down, so the
              preview wraps and crops exactly the way a creator's card will. */}
          <div className="relative mx-auto h-[376px] w-[300px] shrink-0">
            <div className="absolute top-0 left-0 flex h-[470px] w-[375px] origin-top-left scale-[0.8] flex-col overflow-hidden rounded-[32px] border border-ink/10 bg-paper shadow-xl">
              <RequestCardFace request={preview} />
            </div>
          </div>
        </aside>

        <div className="flex flex-col gap-3 md:col-start-1">
          {needsVerification && (
            <p className="rounded bg-fog px-4 py-3 text-sm text-ink">
              {t("screens.requests.verifyFirst")}{" "}
              <Link href="/dashboard/verify-email" className="font-medium underline">
                {t("screens.requests.verifyLink")}
              </Link>
            </p>
          )}
          {error && <p className="text-sm text-ink">{localizeError(error, t)}</p>}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <button
              type="submit"
              value="post"
              disabled={pending}
              className="w-full rounded-full bg-ink px-4 py-3 font-medium text-paper transition hover:bg-graphite disabled:opacity-50 md:w-auto md:px-8"
            >
              {pending && mode === "post" ? t("common.saving") : isDraftForm ? t("screens.requests.post") : t("screens.requests.saveChanges")}
            </button>
            {isDraftForm && (
              <button
                type="submit"
                value="draft"
                disabled={pending}
                className="w-full rounded-full border border-neutral-300 px-4 py-3 font-medium transition hover:border-ink disabled:opacity-50 md:w-auto md:px-8 dark:border-neutral-700"
              >
                {pending && mode === "draft" ? t("common.saving") : t("screens.requests.saveDraft")}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* The sheets sit outside the form, so Enter in one of their fields
          can't submit it. */}
      <Dialog open={sheet === "description"} onClose={close} title={t("screens.requests.description")}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          maxLength={2000}
          autoFocus
          placeholder={t("screens.requests.descriptionPlaceholder")}
          className={input}
        />
        <Done onClick={close} />
      </Dialog>

      <Dialog open={sheet === "platform"} onClose={close} title={t("screens.requests.platform")}>
        <Options>
          {PLATFORMS.map((p) => (
            <Option key={p} selected={p === platform} onClick={() => (setPlatform(p), close())}>
              <span className="flex items-center gap-2.5">
                <PlatformIcon platform={p} />
                {p}
              </span>
            </Option>
          ))}
        </Options>
      </Dialog>

      <Dialog open={sheet === "content"} onClose={close} title={t("screens.requests.content")}>
        <input
          value={deliverables}
          onChange={(e) => setDeliverables(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && close()}
          maxLength={80}
          autoFocus
          placeholder={t("screens.requests.contentAsk")}
          className={input}
        />
        <div className="flex flex-wrap gap-2">
          {(CONTENT_PRESETS[platform] ?? []).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setDeliverables(preset)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${deliverables === preset ? "border-ink bg-ink text-paper" : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700"}`}
            >
              {presetLabel(t, preset)}
            </button>
          ))}
        </div>
        <Done onClick={close} />
      </Dialog>

      <Dialog open={sheet === "budget"} onClose={close} title={t("screens.requests.budget")}>
        <div className="grid grid-cols-2 gap-3">
          <Euro label={t("screens.requests.from")} value={budgetMin} onChange={setBudgetMin} onEnter={close} autoFocus placeholder="200" aria={t("screens.requests.budgetFrom")} />
          <Euro label={t("screens.requests.to")} value={budgetMax} onChange={setBudgetMax} onEnter={close} placeholder="400" aria={t("screens.requests.budgetTo")} />
        </div>
        <p className="-mt-2 text-sm text-neutral-500 dark:text-neutral-400">{t("screens.requests.budgetHint")}</p>
        <Done onClick={close} />
      </Dialog>

      <Dialog open={sheet === "postBy"} onClose={close} title={t("screens.requests.postBy")}>
        <input
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          value={postBy}
          onChange={(e) => setPostBy(e.target.value)}
          className={input}
        />
        <p className="-mt-2 text-sm text-neutral-500 dark:text-neutral-400">{t("screens.requests.postByHint")}</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => (setPostBy(""), close())}
            className="rounded-full border border-neutral-300 px-4 py-3 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
          >
            {t("screens.requests.noFixedDate")}
          </button>
          <Done onClick={close} />
        </div>
      </Dialog>

      <Dialog open={sheet === "category"} onClose={close} title={t("screens.requests.productCategory")}>
        <Options>
          {PRODUCT_CATEGORIES.map((c) => (
            <Option key={c} selected={c === productCategory} onClick={() => (setProductCategory(c), close())}>
              {categoryLabel(t, c)}
            </Option>
          ))}
        </Options>
      </Dialog>

      <Dialog open={sheet === "niche"} onClose={close} title={t("screens.requests.niche")}>
        <Options>
          {NICHES.map((n) => (
            <Option key={n} selected={n === niche} onClick={() => (setNiche(n), close())}>
              {nicheLabel(t, n)}
            </Option>
          ))}
        </Options>
      </Dialog>

      <Dialog open={sheet === "followers"} onClose={close} title={t("screens.requests.minFollowers")}>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={minFollowers}
          onChange={(e) => setMinFollowers(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && close()}
          autoFocus
          className={input}
        />
        <div className="flex flex-wrap gap-2">
          {FOLLOWER_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMinFollowers(String(n))}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${Number(minFollowers) === n ? "border-ink bg-ink text-paper" : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700"}`}
            >
              {n === 0 ? t("screens.requests.any") : n.toLocaleString(locale)}
            </button>
          ))}
        </div>
        <p className="-mt-2 text-sm text-neutral-500 dark:text-neutral-400">{t("screens.requests.followersHint")}</p>
        <Done onClick={close} />
      </Dialog>

      <Dialog open={sheet === "languages"} onClose={close} title={t("screens.requests.language")}>
        <Options>
          {LANGUAGES.map((l) => (
            <Option
              key={l}
              selected={languages.includes(l)}
              // At least one always stays picked.
              onClick={() =>
                setLanguages((prev) => (prev.includes(l) ? (prev.length > 1 ? prev.filter((x) => x !== l) : prev) : [...prev, l]))
              }
            >
              {contentLanguageLabel(t, l)}
            </Option>
          ))}
        </Options>
        <Done onClick={close} />
      </Dialog>
    </>
  );
}

const input = "w-full rounded border border-neutral-300 bg-transparent px-3 py-2.5 dark:border-neutral-700";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

// A setting-style row: label left, the current value (or a grey
// placeholder) right, and a chevron — tapping opens that value's sheet.
function Row({
  label,
  value,
  icon,
  onClick,
  placeholder,
  strong,
  first,
}: {
  label: string;
  value: string | null;
  icon?: React.ReactNode;
  onClick: () => void;
  placeholder?: string;
  strong?: boolean;
  first?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[46px] w-full items-center gap-4 text-left text-sm ${first ? "" : "border-t border-ink/10"}`}
    >
      <span className="shrink-0 font-semibold">{label}</span>
      <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
        {value ? (
          <>
            {icon}
            <span className={`truncate ${strong ? "text-base font-black" : ""}`}>{value}</span>
          </>
        ) : (
          <span className="truncate text-neutral-400 dark:text-neutral-500">{placeholder}</span>
        )}
        <FiChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
      </span>
    </button>
  );
}

function Options({ children }: { children: React.ReactNode }) {
  return <div className="-mt-1 flex flex-col">{children}</div>;
}

function Option({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-between gap-3 border-t border-ink/10 text-left first:border-t-0"
    >
      {children}
      {selected && <FiCheck className="h-4 w-4 shrink-0" />}
    </button>
  );
}

function Done({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button type="button" onClick={onClick} className="w-full rounded-full bg-ink px-4 py-3 text-sm font-medium text-paper transition hover:bg-graphite">
      {t("common.done")}
    </button>
  );
}

function Euro({
  label,
  value,
  onChange,
  onEnter,
  autoFocus,
  placeholder,
  aria,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  autoFocus?: boolean;
  placeholder: string;
  aria: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        autoFocus={autoFocus}
        inputMode="decimal"
        placeholder={placeholder}
        aria-label={aria}
        className={`${input} pr-8 pl-12 text-right`}
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-neutral-500 dark:text-neutral-400">€</span>
    </div>
  );
}
