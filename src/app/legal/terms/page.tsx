import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { canonical } from "@/lib/seo";
import { getLegal } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const { ui } = await getLegal();
  return { title: ui.termsTitle, description: ui.termsDescription, alternates: canonical("/legal/terms") };
}

export default async function TermsPage() {
  const legal = await getLegal();
  return (
    <LegalDocument
      title={legal.ui.termsTitle}
      updated={legal.updated}
      intro={legal.ui.termsDescription}
      notice={legal.notice}
      lang={legal.htmlLang}
      sections={legal.terms()}
    />
  );
}
