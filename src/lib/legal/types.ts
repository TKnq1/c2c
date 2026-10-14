export type LegalSection = { title: string; body: string[] };

export type LegalImprint = {
  lead: string;
  rows: { label: string; lines: string[] }[];
  disputeTitle: string;
  dispute: string;
};

// One language's legal pages (imprint, terms, privacy policy, licences). German is the binding version: every
// other language carries a `notice` that says so, shown above the text.
export type LegalContent = {
  htmlLang: string;
  // "This is a translation. The German version is binding." null in German itself.
  notice: string | null;
  // When the texts last changed, written out in this language (see LEGAL_UPDATED in version.ts).
  updated: string;
  ui: {
    termsTitle: string;
    termsDescription: string;
    privacyTitle: string;
    privacyDescription: string;
    imprintTitle: string;
    imprintDescription: string;
    vatLabel: string;
    licensesTitle: string;
    licensesDescription: string;
    licensesTextFile: string;
    licensesOfl: string;
  };
  terms: () => LegalSection[];
  privacy: (options: { sentry: boolean }) => LegalSection[];
  imprint: LegalImprint;
  licenses: LegalSection[];
};
