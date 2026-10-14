// The app's emails (src/lib/email-templates.ts), one group per email. Numbers come from src/lib/constants.ts and
// are filled in as {placeholders}: {pro} Pro fee %, {standard} standard fee %, {keep} what the creator keeps at the
// standard fee, {proKeep} the same with Pro, {fee} / {proFee} fee % in the marketing mail, {price} Pro price per
// month, {days} review days, {limit} founding places, {number} the account's founding number, {name} a person's
// first name, {reason} free text from an admin or from the consent record. Percent signs and currency symbols stay
// in the text, so each language sets its own spacing ("10%" or "10 %"). Anything a language leaves out is shown in
// English.
export const emails = {
  // The words around every email's content: paste-link box, opt-out link, footer, number format (a BCP 47 tag).
  chrome: {
    pasteLink: "Button not working? Paste this link into your browser:",
    stop: "Stop these emails",
    tagline: "Brands meet the right creators.",
    imprint: "Imprint",
    privacy: "Privacy",
    numberLocale: "en-US",
  },
  // The first email after sign-up, with the verification link in it.
  welcome: {
    subject: "Welcome to comtor – verify your email",
    preview: "Thanks for signing up. One tap and your email is verified.",
    heading: "Welcome to comtor.",
    bodyCreator: "Thanks for signing up. Verify your email, then swipe through brand deals with the budget right on the card.",
    bodyBrand: "Thanks for signing up. Verify your email, then post your first request. Creators come to you.",
    // Appended to the body for an account that got one of the founding places.
    foundingCreator:
      "You're founding creator no. {number}. Pro is free for you as long as your account exists. comtor keeps {pro}% of every payment instead of {standard}%, and you keep {keep}%.",
    foundingBrand:
      "You're founding brand no. {number}. Pro is free for you as long as your account exists. comtor keeps {pro}% of every payment instead of {standard}%.",
    action: "Verify email",
    note: "The link works for 24 hours. Didn't sign up for comtor? Then you can ignore this email.",
  },
  // Sent once to accounts that already existed when their side's founding places came. About their own plan: no advert.
  foundingNotice: {
    subject: "Pro is free for you, for good",
    previewCreator: "You are one of the first creators on comtor.",
    previewBrand: "You are one of the first brands on comtor.",
    heading: "You have Pro, for good.",
    bodyCreator:
      "You are one of the first {limit} creators on comtor (founding creator no. {number}). That's why Pro is free for you as long as your account exists. comtor keeps {pro}% instead of {standard}% of every payment, so you keep {keep}%. You don't need to do anything.",
    bodyBrand:
      "You are one of the first {limit} brands on comtor (founding brand no. {number}). That's why Pro is free for you as long as your account exists. comtor keeps {pro}% instead of {standard}% of every payment. You don't need to do anything.",
    // Appended when the account also pays for Pro itself, from before.
    subscription: "Your Pro subscription from before is still running and still billed. You can cancel it in Settings and keep Pro.",
    action: "See your plan",
    note: "You get this email because you have a comtor account. It is about your plan and is not an advert.",
  },
  // The marketing note for people who may never have opened comtor. The subject is whatever the admin typed.
  marketingWelcome: {
    // Why the recipient gets this mail (Art. 14 GDPR). The second form names how they agreed: {reason}.
    note: "You are getting this email because you agreed to hear from comtor. You can stop it at any time with the link below.",
    noteWithReason:
      "You are getting this email because you agreed to hear from comtor ({reason}). You can stop it at any time with the link below.",
    hint: "Have a look first. Signing up is on the page.",
    creator: {
      preview: "Earn money posting on social media.",
      heading: "Earn money posting on social media.",
      // With the recipient's first name in front.
      headingNamed: "{name}, earn money posting on social media.",
      body: "comtor is where brands post a paid deal and you swipe the ones you want. The budget is on the card. The brand pays before you post, and you keep {keep}%.",
      steps: {
        swipe: {
          title: "Swipe a deal.",
          text: "Right means you want it, left means you pass. The brand sees your profile and can message you.",
        },
        budget: {
          title: "The budget is on the card.",
          text: "No more DMs about your rate. Every request says what it pays, what to post, and whether the product comes with it.",
        },
        paid: {
          title: "Paid before you post.",
          text: "Accept the offer and the brand pays first. The money waits until your post is up.",
        },
        keep: {
          title: "You keep {keep}%.",
          text: "The brand has {days} days to approve your post. If they don't answer, the money goes to you anyway. With Pro (€{price} a month) you keep {proKeep}%.",
        },
      },
      // The live count of brands, shown under a big number: "1 brand already here", "24 brands already here".
      crowdOne: "brand already here",
      crowdMany: "brands already here",
      action: "See paid deals",
    },
    brand: {
      preview: "Grow your brand with content creators.",
      heading: "Grow your brand with content creators.",
      headingNamed: "{name}, grow your brand with content creators.",
      body: "comtor is where you post the product, the budget, and what to make. Creators who fit swipe right and come to you. You pay when you agree. The money waits until the post is live.",
      steps: {
        post: {
          title: "Post the product and the budget.",
          text: "Photos, the budget, the platform, and what to post. Creators get it as a card in their feed.",
        },
        come: {
          title: "Creators come to you.",
          text: "Creators in your niche swipe right. You see their reach and reviews and pick who fits.",
        },
        chat: {
          title: "Agree on it in the chat.",
          text: "Send an offer. When they accept, you pay, and the money is held until the post is live.",
        },
        paidOut: {
          title: "Then it's paid out.",
          text: "You check the live post first. No base fee: comtor keeps {fee}% of each payment, or {proFee}% with Pro (€{price} a month).",
        },
      },
      crowdOne: "creator already here",
      crowdMany: "creators already here",
      action: "Post your first deal",
    },
  },
  verification: {
    subject: "Verify your comtor email",
    preview: "Confirm it's your address. The link works for 24 hours.",
    heading: "Verify your email.",
    body: "Confirm that this address belongs to your comtor account.",
    action: "Verify email",
    note: "The link works for 24 hours. Didn't sign up for comtor? Then you can ignore this email.",
  },
  passwordReset: {
    subject: "Reset your comtor password",
    preview: "Choose a new password. The link works for 1 hour.",
    heading: "Reset your password.",
    body: "Someone asked to reset your comtor password. If that was you, choose a new one.",
    action: "Choose a new password",
    note: "The link works once, for 1 hour. A new password logs you out everywhere. Didn't ask for this? Then ignore this email and your password stays the same.",
  },
  // After every password change and reset. The button is for when it wasn't them.
  passwordChanged: {
    subject: "Your comtor password was changed",
    preview: "If that was you, you're all set.",
    heading: "Your password was changed.",
    body: "Your comtor password was just changed, and we logged out your other devices. If that was you, you're all set.",
    action: "Reset password",
    note: "Wasn't you? Reset your password right away. That logs out whoever changed it.",
  },
  // Sent when an admin suspends an account, with the reason and how to object (Digital Services Act, Art. 17).
  accountSuspended: {
    subject: "Your comtor account was suspended",
    preview: "Here is why, and how to object.",
    heading: "Your account was suspended.",
    body: "We suspended your comtor account. Reason: {reason} While it is suspended, you can't sign in. We close the open requests of a brand account.",
    action: "Object to this decision",
    // The subject line of the objection mail (plain text, the code encodes it for the mailto link).
    objectSubject: "Suspended account",
    note: "If you think this is a mistake, reply to this email or write to info@comtor.app. We will look at it again and answer you.",
  },
  // What /admin/email sends to check that mail gets out and looks right.
  test: {
    subject: "comtor test email",
    preview: "If you can read this, email from comtor works.",
    heading: "It works.",
    body: "This is a test email from the admin area. If it's in your inbox, sign-up, verification and password emails reach people too.",
    action: "Open comtor",
    note: "Sent by an admin from /admin/email. Nothing to do.",
  },
  // Product news. The link opens a page; the button on that page is the consent. Opening the mail is not a yes.
  marketingConsent: {
    subject: "Confirm news from comtor",
    preview: "One button, then we can send occasional news about comtor.",
    heading: "Confirm product news.",
    body: "You asked for occasional emails about comtor. Press the button on the next page to confirm. Until then, this address gets no product news.",
    action: "Review and confirm",
    note: "Didn't ask for this? Ignore the email. Nothing is turned on until you press the button.",
  },
  // The waitlist's double opt-in: nobody gets the launch email without clicking this first.
  waitlistConfirmation: {
    subject: "Confirm your spot on the comtor waitlist",
    preview: "One tap and you'll hear from us the day the apps are out.",
    heading: "Confirm your email.",
    body: "You asked to hear when the comtor apps are out on iOS and Android. Confirm that this address is yours and you're on the list.",
    action: "Confirm email",
    note: "We'll send you one email, the day the apps are out. Didn't sign up? Then ignore this email and you won't hear from us.",
  },
} as const;
