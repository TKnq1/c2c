import { UgcFooter, UgcHeader, UgcWatermark } from "@/components/ugc/ugc-parts";

// Imprint, privacy policy, terms and licences: the same shell as the other public subpages (header, huge faint
// mark, footer). The footer carries the links to all four, so none of them is a dead end. Logged-in users
// reach them from Settings and get the dashboard link in the header.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col">
      <UgcWatermark />
      <UgcHeader />
      <main className="relative z-10 flex-1 px-4 py-12 md:py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">{children}</div>
      </main>
      <UgcFooter />
    </div>
  );
}
