export default function ImprintPage() {
  return (
    <main className="flex-1 px-6 py-16">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="font-display text-3xl font-normal">Imprint</h1>
          <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">
            This is a prototype — the fields below are placeholders and need real business
            details filled in before this ever goes live.
          </p>
        </div>

        <div className="flex flex-col gap-4 text-sm text-neutral-700 dark:text-neutral-300">
          <div>
            <h2 className="font-semibold text-neutral-900 mb-1 dark:text-neutral-100">Service provider</h2>
            <p>[Company name]</p>
            <p>[Street, ZIP City, Country]</p>
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 mb-1 dark:text-neutral-100">Represented by</h2>
            <p>[Managing director / authorized representative]</p>
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 mb-1 dark:text-neutral-100">Contact</h2>
            <p>Email: [contact@example.com]</p>
            <p>Phone: [+00 000 000000]</p>
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 mb-1 dark:text-neutral-100">Register entry</h2>
            <p>[Register court], [register number]</p>
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 mb-1 dark:text-neutral-100">VAT ID</h2>
            <p>[VAT identification number]</p>
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 mb-1 dark:text-neutral-100">Responsible for content</h2>
            <p>[Name, address — per applicable local media law]</p>
          </div>
        </div>
      </div>
    </main>
  );
}
