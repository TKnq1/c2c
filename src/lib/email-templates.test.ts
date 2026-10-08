import { describe, expect, it } from "vitest";
import {
  passwordChangedEmail,
  passwordResetEmail,
  testEmail,
  verificationEmail,
  waitlistConfirmationEmail,
  marketingConsentEmail,
  marketingEntryUrl,
  marketingWelcomeEmail,
  welcomeEmail,
  foundingNoticeEmail,
  accountSuspendedEmail,
  dealNoticeEmail,
} from "@/lib/email-templates";

describe("verificationEmail", () => {
  const url = "https://www.comtor.app/verify-email/abc123";
  const email = verificationEmail(url, "en");

  it("links the button and the fallback link to the token URL", () => {
    expect(email.html.split(`href="${url}"`)).toHaveLength(3);
    expect(email.text).toContain(url);
  });

  it("says how long the link works, in both parts", () => {
    expect(email.html).toContain("24 hours");
    expect(email.text).toContain("24 hours");
  });
});

describe("passwordResetEmail", () => {
  it("keeps the subject the inbox shows", () => {
    expect(passwordResetEmail("https://www.comtor.app/reset-password/x", "en").subject).toBe("Reset your comtor password");
  });

  it("escapes what goes into the HTML", () => {
    const email = passwordResetEmail('https://x.test/?a=1&b="><script>');
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain('href="https://x.test/?a=1&amp;b=&quot;&gt;&lt;script&gt;"');
    // The plain-text part is never parsed as markup.
    expect(email.text).toContain('https://x.test/?a=1&b="><script>');
  });
});

describe("passwordChangedEmail", () => {
  it("offers a reset for when it wasn't them", () => {
    const email = passwordChangedEmail("https://www.comtor.app/forgot-password", "en");
    expect(email.subject).toBe("Your comtor password was changed");
    expect(email.html).toContain('href="https://www.comtor.app/forgot-password"');
    expect(email.text).toContain("Wasn't you?");
  });
});

describe("waitlistConfirmationEmail", () => {
  it("links to the confirmation page and promises one email only", () => {
    const url = "https://www.comtor.app/waitlist/confirm/abc";
    const email = waitlistConfirmationEmail(url, "en");
    expect(email.html).toContain(`href="${url}"`);
    expect(email.text).toContain("one email");
  });
});

describe("welcomeEmail", () => {
  const url = "https://www.comtor.app/verify-email/abc123";

  it("carries the verification link", () => {
    const email = welcomeEmail(url, "CREATOR", "en");
    expect(email.html.split(`href="${url}"`)).toHaveLength(3);
    expect(email.text).toContain(url);
  });

  it("tells creators and brands what comes next", () => {
    expect(welcomeEmail(url, "CREATOR", "en").text).toContain("brand deals");
    expect(welcomeEmail(url, "STARTUP", "en").text).toContain("first request");
  });

  it("tells a founding brand about its place, in the language of the account", () => {
    expect(welcomeEmail(url, "STARTUP", "en", 17).text).toContain("founding brand no. 17");
    const de = welcomeEmail(url, "STARTUP", "de", 17).text;
    expect(de).toContain("Founding Brand Nr. 17");
    expect(de).toContain("3 % statt 10 %");
  });

  it("tells a founding creator about its place and what it keeps", () => {
    expect(welcomeEmail(url, "CREATOR", "en", 17).text).toContain("founding creator no. 17");
    const de = welcomeEmail(url, "CREATOR", "de", 17).text;
    expect(de).toContain("Founding Creator Nr. 17");
    expect(de).toContain("du bekommst 97 %");
  });

  it("says nothing about founding to accounts without a place", () => {
    expect(welcomeEmail(url, "STARTUP", "en").text).not.toMatch(/founding/i);
    expect(welcomeEmail(url, "STARTUP", "en", null).text).not.toMatch(/founding/i);
    expect(welcomeEmail(url, "CREATOR", "en").text).not.toMatch(/founding/i);
    expect(welcomeEmail(url, "CREATOR", "en", null).text).not.toMatch(/founding/i);
  });
});

describe("foundingNoticeEmail", () => {
  it("tells a brand its place and what it means, in the account's language", () => {
    const de = foundingNoticeEmail(7, "de").text;
    expect(de).toContain("Founding Brand Nr. 7");
    expect(de).toContain("3 % statt 10 %");
    expect(de).toContain("ersten 50 Marken");
    const en = foundingNoticeEmail(7, "en").text;
    expect(en).toContain("founding brand no. 7");
    expect(en).toContain("3% instead of 10%");
  });

  it("points at the plan in Settings and is no advert", () => {
    const email = foundingNoticeEmail(7, "de");
    expect(email.html).toContain("/dashboard/startup/settings#plan");
    expect(email.text).toContain("keine Werbung");
    expect(email.text).not.toMatch(/abmelden|unsubscribe/i);
  });

  it("tells a creator its own place and points at the creator plan", () => {
    const email = foundingNoticeEmail(12, "de", false, "creator");
    expect(email.text).toContain("Founding Creator Nr. 12");
    expect(email.text).toContain("ersten 100 Creatorn");
    expect(email.text).not.toContain("Marken auf comtor");
    expect(email.html).toContain("/dashboard/creator/settings#plan");
    expect(foundingNoticeEmail(12, "en", false, "creator").text).toContain("founding creator no. 12");
  });

  it("mentions a running subscription only for a brand that pays for one", () => {
    expect(foundingNoticeEmail(7, "de").text).not.toContain("Pro-Abo");
    expect(foundingNoticeEmail(7, "de", true).text).toContain("Pro-Abo läuft weiter");
    expect(foundingNoticeEmail(7, "en", true).text).toContain("subscription from before is still running");
  });
});

describe("marketingConsentEmail", () => {
  it("points at the confirm page and does not treat the mail itself as a yes", () => {
    const url = "https://www.comtor.app/marketing/confirm/abc";
    const email = marketingConsentEmail(url, "en");
    expect(email.subject).toBe("Confirm news from comtor");
    expect(email.text).toContain(url);
    expect(email.text).toContain("Nothing is turned on until you press the button");
  });
});

describe("marketingWelcomeEmail", () => {
  it("speaks to creators and brands separately", () => {
    const creator = marketingWelcomeEmail("https://www.comtor.app/?for=creators", "CREATOR", "A note from comtor", "Mia", 24, undefined, undefined, "en");
    const brand = marketingWelcomeEmail("https://www.comtor.app/?for=brands", "STARTUP", "A note for brands", "Glow", 3, undefined, undefined, "en");
    const one = marketingWelcomeEmail("https://www.comtor.app/?for=creators", "CREATOR", "A note from comtor", "Mia", 1, undefined, undefined, "en");
    expect(creator.subject).toBe("A note from comtor");
    expect(creator.text).toContain("Mia, earn money posting on social media.");
    expect(creator.text).toContain("See paid deals");
    expect(creator.text).toContain("24 brands already here");
    expect(creator.html).not.toContain("mock-creator");
    expect(brand.text).toContain("3 creators already here");
    expect(one.text).toContain("1 brand already here");
    expect(creator.html).toContain("/email/icons/swipe.png");
    expect(brand.html).toContain("/email/icons/megaphone.png");
    expect(creator.text).toContain("comtor is where brands post a paid deal");
    expect(creator.text.indexOf("comtor is where brands")).toBeLessThan(creator.text.indexOf("24 brands already here"));
    expect(creator.text).toContain("1. Swipe a deal.");
    expect(creator.text).toContain("You keep 90%");
    expect(creator.text).toContain("No more DMs about your rate.");
    expect(creator.text).toContain("Signing up is on the page.");
    expect(brand.text).toContain("Creators in your niche swipe right.");
    expect(brand.text).toContain("No base fee:");
    expect(brand.text).toContain("3% with Pro (€10 a month).");
    expect(creator.text).toContain("With Pro (€10 a month) you keep 97%.");
    expect(creator.html).toContain("/email/band-mark.jpg");
    expect(creator.html).not.toContain("mark-white.png");
    expect(creator.html).not.toContain("Button not working");
    expect(creator.html.split('href="https://www.comtor.app/?for=creators"')).toHaveLength(2);
    expect(brand.subject).toBe("A note for brands");
    expect(brand.text).toContain("Glow, grow your brand with content creators.");
    expect(brand.text).toContain("Post your first deal");
    expect(brand.html).toContain("https://www.comtor.app/?for=brands");
  });

  it("tells the recipient why they get it, from the consent note, and how to stop", () => {
    const mail = marketingWelcomeEmail(
      "https://www.comtor.app/?for=creators",
      "CREATOR",
      "A note from comtor",
      "Mia",
      2,
      "https://www.comtor.app/outreach/opt-out?x=1",
      "you ticked the box on our form on 2026-10-01",
      "en",
    );
    expect(mail.text).toContain("You are getting this email because you agreed to hear from comtor (you ticked the box on our form on 2026-10-01).");
    expect(mail.text).toContain("Stop these emails: https://www.comtor.app/outreach/opt-out?x=1");
    expect(mail.text).not.toContain("not for a private person");
  });

  it("opens the landing page on the matching side", () => {
    expect(marketingEntryUrl("CREATOR")).toContain("/?for=creators");
    expect(marketingEntryUrl("STARTUP")).toContain("/?for=brands");
  });
});

describe("testEmail", () => {
  const email = testEmail("https://www.comtor.app", "en");

  it("says what it is, in the subject and the body", () => {
    expect(email.subject).toBe("comtor test email");
    expect(email.html).toContain("It works.");
    expect(email.text).toContain("test email");
  });

  it("links to the site", () => {
    expect(email.html).toContain('href="https://www.comtor.app"');
  });
});

describe("accountSuspendedEmail", () => {
  it("gives the reason and says how to object", () => {
    const mail = accountSuspendedEmail("Fake follower numbers.", "en");
    expect(mail.subject).toBe("Your comtor account was suspended");
    expect(mail.text).toContain("Reason: Fake follower numbers.");
    expect(mail.text).toContain("info@comtor.app");
  });
});

describe("German emails", () => {
  const url = "https://www.comtor.app/verify-email/abc123";

  it("is the default language", () => {
    expect(verificationEmail(url).subject).toBe("Bestätige deine comtor-E-Mail-Adresse");
    expect(verificationEmail(url, "fr").subject).toBe("Verify your comtor email");
  });

  it("writes the page in German, with German words around the content", () => {
    const email = verificationEmail(url, "de");
    expect(email.html).toContain('<html lang="de"');
    expect(email.html).toContain("Button funktioniert nicht?");
    expect(email.html).toContain(">Impressum<");
    expect(email.html).toContain(">Datenschutz<");
    expect(email.text).toContain("Impressum: ");
    expect(email.text).toContain("Der Link gilt 24 Stunden.");
    expect(email.html.split(`href="${url}"`)).toHaveLength(3);
  });

  it("keeps the English text free of German", () => {
    const email = verificationEmail(url, "en");
    expect(email.html).toContain('<html lang="en"');
    expect(email.html).toContain("Button not working?");
    expect(email.text).not.toMatch(/Impressum|Datenschutz/);
  });

  it("has every email in German", () => {
    const emails = [
      welcomeEmail(url, "CREATOR", "de"),
      welcomeEmail(url, "STARTUP", "de"),
      passwordResetEmail(url, "de"),
      passwordChangedEmail(url, "de"),
      accountSuspendedEmail("Gefälschte Follower-Zahlen.", "de"),
      testEmail(url, "de"),
      foundingNoticeEmail(7, "de"),
      foundingNoticeEmail(7, "de", true),
      marketingConsentEmail(url, "de"),
      waitlistConfirmationEmail(url, "de"),
      marketingWelcomeEmail(url, "CREATOR", "Hallo", "Mia", 24, undefined, undefined, "de"),
      marketingWelcomeEmail(url, "STARTUP", "Hallo", "Glow", 1, undefined, undefined, "de"),
      dealNoticeEmail({ subject: "Erinnerung", text: "Dein Entwurf ist fällig.", url, actionNeeded: true }, "de"),
    ];
    for (const email of emails) {
      // None of the English sentences is left in the German mail.
      expect(email.text).not.toMatch(/\b(Verify your|Reset your|Didn't|you can ignore|Thanks for signing|swipe|already here|Imprint|Privacy)\b/);
      expect(email.html).toContain('<html lang="de"');
    }
  });

  it("speaks to creators and brands, with the same numbers", () => {
    const creator = marketingWelcomeEmail(url, "CREATOR", "Hallo", "Mia", 1234, undefined, undefined, "de");
    const brand = marketingWelcomeEmail(url, "STARTUP", "Hallo", "", 1, undefined, undefined, "de");
    expect(creator.text).toContain("Mia, verdiene Geld mit Posts in sozialen Medien.");
    expect(creator.text).toContain("1.234 Marken sind schon dabei");
    expect(creator.text).toContain("Du behältst 90 %.");
    expect(brand.text).toContain("Bring deine Marke mit Creatorn voran.");
    expect(brand.text).toContain("1 Creator ist schon dabei");
    expect(brand.text).toContain("comtor behält 10 % jeder Zahlung, mit Pro (10 € im Monat) nur 3 %.");
  });

  it("tells the recipient why they get it, and how to stop, in German", () => {
    const mail = marketingWelcomeEmail(
      url,
      "CREATOR",
      "Hallo",
      "Mia",
      2,
      "https://www.comtor.app/outreach/opt-out?x=1",
      "du hast am 01.10.2026 auf unserem Formular zugestimmt",
      "de",
    );
    expect(mail.text).toContain("Du bekommst diese E-Mail, weil du zugestimmt hast, E-Mails von comtor zu erhalten (du hast am 01.10.2026 auf unserem Formular zugestimmt).");
    expect(mail.text).toContain("Diese E-Mails abbestellen: https://www.comtor.app/outreach/opt-out?x=1");
  });

  it("gives the reason and the way to object in German", () => {
    const mail = accountSuspendedEmail("Gefälschte Follower-Zahlen.", "de");
    expect(mail.subject).toBe("Dein comtor-Konto wurde gesperrt");
    expect(mail.text).toContain("Grund: Gefälschte Follower-Zahlen.");
    expect(mail.html).toContain("mailto:info@comtor.app?subject=Gesperrtes%20Konto");
  });
});

describe("dealNoticeEmail", () => {
  const url = "https://www.comtor.app/dashboard/deals/d1";
  const base = { subject: "Reminder: your draft for “Autumn launch” is due", text: "Your draft for “Autumn launch” was due 8 Oct 2026.", url };

  it("carries the subject, the notice text and the link in both parts", () => {
    const email = dealNoticeEmail({ ...base, actionNeeded: true }, "en");
    expect(email.subject).toBe(base.subject);
    expect(email.html).toContain(base.text);
    expect(email.text).toContain(base.text);
    expect(email.html.split(`href="${url}"`)).toHaveLength(3);
    expect(email.text).toContain(url);
  });

  it("says whether the deal needs the person or only has news", () => {
    expect(dealNoticeEmail({ ...base, actionNeeded: true }, "en").text).toContain("Your deal needs you.");
    expect(dealNoticeEmail({ ...base, actionNeeded: false }, "en").text).toContain("News on your deal.");
    expect(dealNoticeEmail({ ...base, actionNeeded: true }, "de").text).toContain("Dein Deal braucht dich.");
    expect(dealNoticeEmail({ ...base, actionNeeded: false }, "de").text).toContain("Neuigkeiten zu deinem Deal.");
  });

  it("tells the person why the mail cannot be switched off", () => {
    expect(dealNoticeEmail({ ...base, actionNeeded: false }, "en").text).toContain("cannot be switched off");
    expect(dealNoticeEmail({ ...base, actionNeeded: false }, "de").text).toContain("lassen sich nicht abschalten");
  });

  it("escapes what a brand typed into a title", () => {
    const email = dealNoticeEmail({ ...base, text: 'Deal “<script>alert(1)</script> & Co” was cancelled.', actionNeeded: false }, "en");
    expect(email.html).not.toContain("<script>alert(1)");
    expect(email.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt; &amp; Co");
  });

  it("keeps the inbox preview short", () => {
    const email = dealNoticeEmail({ ...base, text: "x".repeat(300), actionNeeded: false }, "en");
    // The hidden line an inbox shows after the subject: the text cut at 107 characters, then the filler that keeps the body out.
    const preview = email.html.match(/mso-hide:all;">([^<]*)<\/div>/)?.[1].split("&#847;")[0];
    expect(preview).toBe(`${"x".repeat(107)}…`);
  });
});
