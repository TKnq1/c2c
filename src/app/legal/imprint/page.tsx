import type { Metadata } from "next";

export const metadata: Metadata = { title: "Imprint" };

export default function ImprintPage() {
  return (
    <main className="flex-1 px-6 py-16">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="font-display text-3xl font-normal">Imprint</h1>
          <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
            Filled in as a private individual operating this platform — no registered business
            (Gewerbe) was confirmed, so register entry and VAT ID are left out below as not
            applicable. Not a substitute for real legal review.
          </p>
        </div>

        <div className="flex flex-col gap-4 text-sm text-neutral-700 dark:text-neutral-300">
          <div>
            <h2 className="font-semibold text-neutral-900 mb-1 dark:text-neutral-100">Service provider</h2>
            <p>Teethawat Kanpai</p>
            <p>Sonnenscheinpfad 64, 12277 Berlin, Germany</p>
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 mb-1 dark:text-neutral-100">Contact</h2>
            <p>Email: teethawatkanpai@gmail.com</p>
            <p>Phone: +49 172 4134526</p>
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 mb-1 dark:text-neutral-100">Responsible for content</h2>
            <p>Teethawat Kanpai (address as above), per §18 Abs. 2 MStV.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
