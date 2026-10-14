import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { canonical } from "@/lib/seo";
import { getLegal } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const { ui } = await getLegal();
  return { title: ui.privacyTitle, description: ui.privacyDescription, alternates: canonical("/legal/privacy") };
}

export default async function PrivacyPage() {
  const legal = await getLegal();
  // Sentry is named only where it is switched on, so the text matches what runs.
  const sentry = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
  return (
    <LegalDocument
      title={legal.ui.privacyTitle}
      updated={legal.updated}
      intro={legal.ui.privacyDescription}
      notice={legal.notice}
      lang={legal.htmlLang}
      sections={legal.privacy({ sentry })}
    />
  );
}
