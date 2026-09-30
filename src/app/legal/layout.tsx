import { LegalHeader, LegalOtherDocs } from "@/components/legal-header";

// Shared by the three legal pages. Logged-in users reach them from
// Settings (the old site-wide footer is gone), so they look like any other
// screen of the app — a back button and a centered title — and each one
// links to the other two at the bottom.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <LegalHeader />
      <main className="flex-1 px-6 pt-6 pb-16">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          {children}
          <LegalOtherDocs />
        </div>
      </main>
    </div>
  );
}
