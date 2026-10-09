// The founding places: the first brands and the first creators get Pro for as long as their account exists
// (src/lib/founding.ts).
// All 8 languages are written out (founding-{locale}.ts).
export const founding = {
  // Before sign-up, under the password field.
  teaser: "The first {total} brands get Pro for free, for as long as their account exists. {left} places left.",
  teaserLast: "The first {total} brands get Pro for free, for as long as their account exists. Only 1 place left.",
  // The wizard screen right after the account is created.
  ofTotal: "of {total} founding brands",
  title: "Pro is free for you, for good.",
  body: "For as long as your account exists. comtor keeps {pro}% instead of {standard}% of every payment.",
  perkFee: "{pro}% instead of {standard}% fee on every payment",
  perkPrice: "No monthly price, no subscription, nothing to cancel",
  // The last wizard screen.
  doneLine: "Founding brand no. {n}: Pro is free for you for as long as your account exists.",
  // Settings and Payments.
  planTitle: "Pro · Founding brand no. {n}",
  planBody:
    "Pro is free for you for as long as your account exists: {pro}% instead of {standard}% on every payment. There's nothing to pay and nothing to cancel.",
  feeLine: "Founding brand no. {n}: {pro}% fee per payment instead of {standard}%.",
  // The same for the first creators (FOUNDING_CREATOR_LIMIT), numbered on their own.
  creator: {
    teaser: "The first {total} creators get Pro for free, for as long as their account exists. {left} places left.",
    teaserLast: "The first {total} creators get Pro for free, for as long as their account exists. Only 1 place left.",
    ofTotal: "of {total} founding creators",
    body: "For as long as your account exists. comtor keeps {pro}% instead of {standard}% of every payment, so you keep {keep}%.",
    doneLine: "Founding creator no. {n}: Pro is free for you for as long as your account exists.",
    planTitle: "Pro · Founding creator no. {n}",
    feeLine: "Founding creator no. {n}: {pro}% fee per payment instead of {standard}%.",
  },
} as const;
