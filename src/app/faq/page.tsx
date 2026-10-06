import type { Metadata } from "next";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { formatCents } from "@/lib/format";
import { canSellProSubscription } from "@/lib/native-app-server";
import { getLocale } from "@/lib/i18n/server";
import { canonical } from "@/lib/seo";
import { UgcBreadcrumbs, UgcCtas, UgcFooter, UgcHeader, UgcWatermark } from "@/components/ugc/ugc-parts";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const german = (await getLocale()) === "de";
  return {
    title: "FAQ",
    description: german
      ? "Wie Matching, Zahlungen und Bewertungen bei comtor funktionieren."
      : "How matching, payments, and reviews work on comtor.",
    alternates: canonical("/faq"),
  };
}

// Stands in for the Pro upsell sentence in the payments answer, so the store
// apps (which can't sell Pro, see canSellProSubscription) can drop it.
const PRO_OFFER_MARKER = "{{pro-offer}}";
const PRO_OFFER_SENTENCE = ` Brands doing regular volume can subscribe to Pro for ${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month to drop that to ${PRO_PLATFORM_FEE_RATE * 100}%.`;
const PRO_OFFER_SENTENCE_DE = ` Marken, die regelmäßig Anfragen stellen, können Pro für ${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/Monat abonnieren und die Gebühr auf ${PRO_PLATFORM_FEE_RATE * 100} % senken.`;
const PRO_QUESTION = "What's the Pro plan?";
const PRO_QUESTION_DE = "Was ist der Pro-Tarif?";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "How does matching work?",
    answer:
      "Brands post a request with a niche, the languages it's made in, a minimum follower count, and a product category. Creators pick up to three niches and see requests in them under For you, as long as the request is in their content language and at least one of their platforms clears the follower threshold. Under All they see every request that fits their language and reach, whatever its niche. No manual approval: if it matches, it shows up in the feed.",
  },
  {
    question: "How do I reach out?",
    answer:
      'A creator clicks "I\'m interested" on a matching request. That opens a conversation both sides can use to message each other directly, in addition to seeing each other\'s contact email.',
  },
  {
    question: "How do payments work?",
    answer:
      `A brand pays a creator through the platform, not directly. The payment is held until the creator posts the content and submits the link. The brand then has ${RELEASE_REVIEW_DAYS} days to approve it, which releases it right away, or to report a problem. If the brand doesn't respond, it's released automatically. The platform keeps a ${PLATFORM_FEE_RATE * 100}% fee out of every payment by default.${PRO_OFFER_MARKER}`,
  },
  {
    question: PRO_QUESTION,
    answer:
      `An optional monthly subscription for brands (${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/month) that lowers the platform fee from ${PLATFORM_FEE_RATE * 100}% to ${PRO_PLATFORM_FEE_RATE * 100}% on every offer. It pays for itself once you're sending roughly ${formatCents(Math.round(PRO_SUBSCRIPTION_PRICE_CENTS / (PLATFORM_FEE_RATE - PRO_PLATFORM_FEE_RATE)))}/month or more in offers. Billed monthly through Stripe. Manage or cancel it from Settings.`,
  },
  {
    question: "What if the creator never posts?",
    answer:
      `A brand can cancel a payment and get a full refund any time before the creator submits their post. If a post is submitted but something's wrong (it's missing, taken down, or not what was agreed), the brand can report a problem within the ${RELEASE_REVIEW_DAYS} days. The payment then stays on hold while we look into it, and we either release it to the creator or refund the brand. Once released, a payment can't be reversed. Reviews from both sides help everyone judge who's reliable before paying.`,
  },
  {
    question: "Is this real money?",
    answer:
      "Yes. Collab payments and the Pro subscription both run through Stripe, and real money moves between real bank accounts.",
  },
  {
    question: "How are follower counts verified?",
    answer:
      "They're self-reported. Every platform a creator lists links directly to the real account, so anyone can check the actual count themselves before reaching out.",
  },
  {
    question: "Can I leave a review?",
    answer:
      "Yes, once a payment for a collab has been released, either side can leave a rating and a short comment. Reviews are visible on public profiles to help others decide who to work with.",
  },
  {
    question: "How do I get in touch?",
    answer: "Reach us using the details on our Imprint page.",
  },
];

const FAQS_DE: { question: string; answer: string }[] = [
  {
    question: "Wie funktioniert das Matching?",
    answer:
      "Marken stellen eine Anfrage mit Nische, den Sprachen des Inhalts, einer Mindestzahl an Followern und einer Produktkategorie ein. Creator wählen bis zu drei Nischen und sehen Anfragen daraus unter „Für dich“, sofern die Anfrage in ihrer Inhaltssprache verfasst ist und mindestens eine ihrer Plattformen die Mindestzahl an Followern erreicht. Unter „Alle“ sehen sie jede Anfrage, die zu Sprache und Reichweite passt, egal in welcher Nische. comtor prüft Anfragen nicht manuell: Passt eine Anfrage, erscheint sie im Feed.",
  },
  {
    question: "Wie nehme ich Kontakt auf?",
    answer:
      "Ein Creator tippt bei einer passenden Anfrage auf „Interessiert“. Das öffnet einen Chat, in dem sich beide Seiten direkt schreiben können. Zusätzlich sehen beide Seiten die Kontakt-E-Mail-Adresse der jeweils anderen.",
  },
  {
    question: "Wie laufen Zahlungen?",
    answer: `Eine Marke bezahlt einen Creator über die Plattform, nicht direkt. Die Zahlung wird zurückgehalten, bis der Creator den Inhalt gepostet und den Link eingereicht hat. Danach hat die Marke ${RELEASE_REVIEW_DAYS} Tage Zeit, den Post freizugeben (die Zahlung geht dann sofort an den Creator) oder ein Problem zu melden. Antwortet die Marke nicht, wird die Zahlung automatisch freigegeben. Die Plattform behält standardmäßig ${PLATFORM_FEE_RATE * 100}\u00a0% jeder Zahlung ein.${PRO_OFFER_MARKER}`,
  },
  {
    question: PRO_QUESTION_DE,
    answer: `Ein optionales Monatsabo für Marken (${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/Monat), das die Plattformgebühr bei jedem Angebot von ${PLATFORM_FEE_RATE * 100}\u00a0% auf ${PRO_PLATFORM_FEE_RATE * 100}\u00a0% senkt. Es rechnet sich, sobald du etwa ${formatCents(Math.round(PRO_SUBSCRIPTION_PRICE_CENTS / (PLATFORM_FEE_RATE - PRO_PLATFORM_FEE_RATE)))} im Monat oder mehr an Angeboten verschickst. Abgerechnet wird monatlich über Stripe. Verwalten oder kündigen kannst du es in den Einstellungen.`,
  },
  {
    question: "Was, wenn der Creator nie postet?",
    answer: `Eine Marke kann eine Zahlung jederzeit stornieren, solange der Creator seinen Post noch nicht eingereicht hat, und bekommt den vollen Betrag zurück. Wurde ein Post eingereicht, stimmt aber etwas nicht (er fehlt, wurde gelöscht oder entspricht nicht der Absprache), kann die Marke innerhalb von ${RELEASE_REVIEW_DAYS} Tagen ein Problem melden. Die Zahlung bleibt dann zurückgehalten, während wir den Fall prüfen, und wir geben sie entweder an den Creator frei oder erstatten sie der Marke. Eine freigegebene Zahlung lässt sich nicht rückgängig machen. Bewertungen beider Seiten helfen allen einzuschätzen, wer verlässlich ist, bevor sie zahlen.`,
  },
  {
    question: "Ist das echtes Geld?",
    answer:
      "Ja. Zahlungen für Kooperationen und das Pro-Abo laufen über Stripe, und echtes Geld fließt zwischen echten Bankkonten.",
  },
  {
    question: "Wie werden Followerzahlen geprüft?",
    answer:
      "Die Zahlen geben die Creator selbst an. Jede Plattform, die ein Creator einträgt, verlinkt direkt auf den echten Account, sodass jeder die tatsächliche Zahl selbst prüfen kann, bevor er Kontakt aufnimmt.",
  },
  {
    question: "Kann ich eine Bewertung abgeben?",
    answer:
      "Ja, sobald eine Zahlung für eine Kooperation freigegeben wurde, kann jede Seite eine Bewertung und einen kurzen Kommentar abgeben. Bewertungen sind auf öffentlichen Profilen sichtbar und helfen anderen bei der Entscheidung, mit wem sie arbeiten.",
  },
  {
    question: "Wie erreiche ich euch?",
    answer: "Unsere Kontaktdaten findest du im Impressum.",
  },
];

// Lets Google render these as an expandable rich result directly in search,
// rather than just a plain blue link — the exact question/answer pairs
// below, structured as https://schema.org/FAQPage expects.
function faqsFor(inStoreApp: boolean, german: boolean) {
  return (german ? FAQS_DE : FAQS)
    .filter((f) => !inStoreApp || (f.question !== PRO_QUESTION && f.question !== PRO_QUESTION_DE))
    .map((f) => ({
      ...f,
      answer: f.answer.replace(PRO_OFFER_MARKER, inStoreApp ? "" : german ? PRO_OFFER_SENTENCE_DE : PRO_OFFER_SENTENCE),
    }));
}

function FaqJsonLd({ faqs }: { faqs: typeof FAQS }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

// The same shell as the other public subpages (header, huge faint mark, grey boxes, footer), in the reader's
// language.
export default async function FaqPage() {
  const german = (await getLocale()) === "de";
  const t = await getT();
  const faqs = faqsFor(!(await canSellProSubscription()), german);

  return (
    <div lang={german ? "de" : "en"} className="relative flex flex-1 flex-col">
      <UgcBreadcrumbs trail={[{ name: "FAQ", path: "/faq" }]} />
      <UgcWatermark />
      <UgcHeader />
      <main className="relative z-10 flex-1 px-4 py-12 md:py-16">
        <FaqJsonLd faqs={faqs} />
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-[40px] leading-[1.02] font-black tracking-[-0.03em] text-balance md:text-[56px]">
              {t("landing.faq.title")}
            </h1>
            <p className="max-w-[60ch] text-lg text-neutral-700 dark:text-neutral-300">{t("landing.faq.lead")}</p>
          </div>

          <div className="flex flex-col gap-3">
            {faqs.map((f) => (
              <section key={f.question} className="rounded bg-fog p-5">
                <h2 className="font-semibold">{f.question}</h2>
                <p className="mt-1.5 text-sm text-neutral-700 dark:text-neutral-300">{f.answer}</p>
              </section>
            ))}
          </div>

          <div className="flex flex-col gap-4 rounded bg-fog p-6">
            <h2 className="font-display text-title-2 font-bold text-balance">{t("landing.faq.ctaTitle")}</h2>
            <UgcCtas />
          </div>
        </div>
      </main>
      <UgcFooter />
    </div>
  );
}
