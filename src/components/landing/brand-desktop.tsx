"use client";

import Image from "next/image";
import { FiChevronRight } from "react-icons/fi";
import { useI18n } from "@/components/i18n-provider";
import { PHOTOS, type PhotoKey } from "@/components/landing/landing-data";
import { PageTitle } from "@/components/page-title";
import { PlatformIcon } from "@/components/platform-icons";
import { RequestCardFace, type CardRequest } from "@/components/request-card-face";
import { Switch } from "@/components/switch";
import { formatBudget } from "@/lib/format";
import { categoryLabel, contentLanguageLabel, nicheLabel, presetLabel } from "@/lib/i18n/labels";

type Props = {
  title: string;
  onTitle: (value: string) => void;
  photo: PhotoKey;
  photoChoices: PhotoKey[];
  onPhoto: (photo: PhotoKey) => void;
  budget: number;
  onBudget: (value: number) => void;
  platform: string;
  platforms: readonly string[];
  onPlatform: (value: string) => void;
  content: string;
  contentPresets: string[];
  onContent: (value: string) => void;
  productIncluded: boolean;
  onProductIncluded: (value: boolean) => void;
  request: CardRequest;
};

const INPUT = "w-full rounded border border-neutral-300 bg-transparent px-3 py-2.5 dark:border-neutral-700";
const CHIP = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition";

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

// The same rows the app's request form draws (request-form.tsx): label on the left, the value on the right.
function Row({ label, first = false, children }: { label: string; first?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex h-[46px] items-center gap-4 text-sm ${first ? "" : "border-t border-ink/10"}`}>
      <span className="shrink-0 font-semibold">{label}</span>
      <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">{children}</span>
    </div>
  );
}

function Chevron() {
  return <FiChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />;
}

// A brand's New request page on a computer, as the app draws it: photos, the deal, who it's for, and the
// preview of the card on the right. The title, the photo, the platform, the content, the budget and Product
// included work, and change the card in the phone beside the window; the rest is as the app shows it.
export function BrandDesktop(props: Props) {
  const { locale, t } = useI18n();
  const { request, platform, content, budget } = props;

  return (
    <div className="min-w-0 flex-1 px-7 pt-7 pr-[100px]">
      <PageTitle>{t("nav.newRequest")}</PageTitle>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_300px] items-start gap-8">
        <div className="flex flex-col gap-8">
          <Section title={t("screens.requests.photos")} hint={t("screens.requests.photosHint")}>
            <div className="flex gap-3">
              {props.photoChoices.map((key, i) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => props.onPhoto(key)}
                  aria-label={t("landing.builder.usePhoto", { n: i + 1 })}
                  aria-pressed={props.photo === key}
                  className={`relative h-[100px] w-[100px] overflow-hidden rounded transition ${
                    props.photo === key ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={PHOTOS[key]} alt="" fill sizes="100px" className="object-cover" />
                </button>
              ))}
            </div>
          </Section>

          <Section title={t("screens.requests.theDeal")}>
            <div className="rounded bg-fog px-4 pt-4 pb-1">
              <div className="flex flex-col gap-1.5 pb-3">
                <label htmlFor="lp-title-d" className="text-sm font-semibold">
                  {t("screens.requests.title")}
                </label>
                <input
                  id="lp-title-d"
                  value={props.title}
                  onChange={(e) => props.onTitle(e.target.value)}
                  maxLength={60}
                  className={INPUT}
                />
              </div>
              <Row label={t("screens.requests.description")}>
                <span className="truncate text-neutral-400 dark:text-neutral-500">{t("screens.requests.addDetails")}</span>
                <Chevron />
              </Row>
              <Row label={t("screens.requests.platform")}>
                {props.platforms.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => props.onPlatform(p)}
                    aria-pressed={platform === p}
                    className={`${CHIP} ${platform === p ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink"}`}
                  >
                    <PlatformIcon platform={p} mono className="h-3.5 w-3.5" />
                    {p}
                  </button>
                ))}
              </Row>
              <Row label={t("screens.requests.content")}>
                {props.contentPresets.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => props.onContent(c)}
                    aria-pressed={content === c}
                    className={`${CHIP} ${content === c ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink"}`}
                  >
                    {presetLabel(t, c)}
                  </button>
                ))}
              </Row>
              <Row label={t("screens.requests.budget")}>
                <input
                  type="range"
                  min={50}
                  max={1500}
                  step={10}
                  value={budget}
                  onChange={(e) => props.onBudget(Number(e.target.value))}
                  aria-label={t("landing.builder.budget")}
                  className="w-[180px] accent-ink"
                />
                <span className="w-[72px] text-right text-base font-black tabular-nums">{formatBudget(budget * 100, budget * 100)}</span>
              </Row>
              <Row label={t("screens.requests.postBy")}>
                <span className="truncate text-neutral-400 dark:text-neutral-500">{t("screens.requests.pickDate")}</span>
                <Chevron />
              </Row>
              <Row label={t("screens.requests.productCategory")}>
                <span className="truncate">{categoryLabel(t, request.productCategory)}</span>
                <Chevron />
              </Row>
              <div className="flex h-[46px] items-center justify-between gap-4 border-t border-ink/10">
                <span className="text-sm font-semibold">{t("screens.requests.productIncluded")}</span>
                <Switch
                  checked={props.productIncluded}
                  onChange={props.onProductIncluded}
                  label={t("screens.requests.productIncluded")}
                />
              </div>
            </div>
          </Section>

          <Section title={t("screens.requests.whoFor")}>
            <div className="rounded bg-fog px-4 py-1">
              <Row label={t("screens.requests.niche")} first>
                <span className="truncate">{nicheLabel(t, request.niche)}</span>
                <Chevron />
              </Row>
              <Row label={t("screens.requests.minFollowers")}>
                <span className="truncate">{request.minFollowers.toLocaleString(locale === "de" ? "de-DE" : "en-US")}</span>
                <Chevron />
              </Row>
              <Row label={t("screens.requests.language")}>
                <span className="truncate">{request.languages.map((l) => contentLanguageLabel(t, l)).join(", ")}</span>
                <Chevron />
              </Row>
            </div>
          </Section>
        </div>

        <aside className="flex flex-col gap-3">
          <div>
            <h2 className="font-semibold">{t("screens.requests.preview")}</h2>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{t("screens.requests.previewHint")}</p>
          </div>
          {/* Laid out at the Feed card's real size and scaled down, as in the app's own form. */}
          <div className="relative mx-auto h-[376px] w-[300px] shrink-0">
            <div className="absolute top-0 left-0 flex h-[470px] w-[375px] origin-top-left scale-[0.8] flex-col overflow-hidden rounded-[32px] border border-ink/10 bg-paper shadow-xl">
              <RequestCardFace request={request} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
