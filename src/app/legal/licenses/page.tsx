import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { canonical } from "@/lib/seo";
import { getLegal } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const { ui } = await getLegal();
  return { title: ui.licensesTitle, description: ui.licensesDescription, alternates: canonical("/legal/licenses") };
}

export default async function LicensesPage() {
  const legal = await getLegal();
  return (
    <div className="flex flex-col gap-8">
      <LegalDocument
        title={legal.ui.licensesTitle}
        updated={legal.updated}
        intro={legal.ui.licensesDescription}
        notice={legal.notice}
        lang={legal.htmlLang}
        sections={legal.licenses}
      />
      <p className="rounded bg-fog p-5 text-sm">
        <a href="/third-party-notices.txt" className="font-medium underline underline-offset-2">
          {legal.ui.licensesTextFile}
        </a>
        {" · "}
        <a href="/email/fonts/OFL.txt" className="font-medium underline underline-offset-2">
          {legal.ui.licensesOfl}
        </a>
      </p>
    </div>
  );
}
