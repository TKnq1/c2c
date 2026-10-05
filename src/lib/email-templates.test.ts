import { describe, expect, it } from "vitest";
import {
  passwordChangedEmail,
  passwordResetEmail,
  testEmail,
  verificationEmail,
  waitlistConfirmationEmail,
  marketingEntryUrl,
  marketingWelcomeEmail,
  welcomeEmail,
} from "@/lib/email-templates";

describe("verificationEmail", () => {
  const url = "https://www.comtor.app/verify-email/abc123";
  const email = verificationEmail(url);

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
    expect(passwordResetEmail("https://www.comtor.app/reset-password/x").subject).toBe("Reset your comtor password");
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
    const email = passwordChangedEmail("https://www.comtor.app/forgot-password");
    expect(email.subject).toBe("Your comtor password was changed");
    expect(email.html).toContain('href="https://www.comtor.app/forgot-password"');
    expect(email.text).toContain("Wasn't you?");
  });
});

describe("waitlistConfirmationEmail", () => {
  it("links to the confirmation page and promises one email only", () => {
    const url = "https://www.comtor.app/waitlist/confirm/abc";
    const email = waitlistConfirmationEmail(url);
    expect(email.html).toContain(`href="${url}"`);
    expect(email.text).toContain("one email");
  });
});

describe("welcomeEmail", () => {
  const url = "https://www.comtor.app/verify-email/abc123";

  it("carries the verification link", () => {
    const email = welcomeEmail(url, "CREATOR");
    expect(email.html.split(`href="${url}"`)).toHaveLength(3);
    expect(email.text).toContain(url);
  });

  it("tells creators and brands what comes next", () => {
    expect(welcomeEmail(url, "CREATOR").text).toContain("brand deals");
    expect(welcomeEmail(url, "STARTUP").text).toContain("first request");
  });
});

describe("marketingWelcomeEmail", () => {
  it("speaks to creators and brands separately", () => {
    const creator = marketingWelcomeEmail("https://www.comtor.app/onboarding?role=creator", "CREATOR", "A note from comtor", "Mia", 24);
    const brand = marketingWelcomeEmail("https://www.comtor.app/onboarding?role=brand", "STARTUP", "A note for brands", "Glow", 3);
    const one = marketingWelcomeEmail("https://www.comtor.app/onboarding?role=creator", "CREATOR", "A note from comtor", "Mia", 1);
    expect(creator.subject).toBe("A note from comtor");
    expect(creator.text).toContain("Mia, brand collabs just got easier.");
    expect(creator.text).toContain("See paid deals");
    expect(creator.text).toContain("24 brands already here");
    expect(creator.html).not.toContain("mock-creator");
    expect(brand.text).toContain("3 creators already here");
    expect(one.text).toContain("1 brand already here");
    expect(creator.html).toContain("/email/icons/swipe.png");
    expect(creator.html).not.toContain("/landing/icons/");
    expect(brand.html).toContain("/email/icons/megaphone.png");
    expect(creator.text).toContain("comtor is where brands post a paid deal");
    expect(creator.text).toContain("1. Swipe a deal.");
    expect(creator.text).toContain("You keep 90%");
    expect(creator.text).toContain("No more DMs about your rate.");
    expect(creator.text).toContain("About two minutes.");
    expect(brand.text).toContain("Creators in your niche swipe right.");
    expect(brand.text).toContain("No subscription:");
    expect(brand.text).toContain("3% on Pro.");
    expect(creator.html).toContain("/email/band-mark.jpg");
    expect(creator.html).not.toContain("mark-white.png");
    expect(creator.html).not.toContain("Button not working");
    expect(creator.html.split('href="https://www.comtor.app/onboarding?role=creator"')).toHaveLength(2);
    expect(brand.subject).toBe("A note for brands");
    expect(brand.text).toContain("Glow, find the right creators for your product.");
    expect(brand.text).toContain("Post your first deal");
    expect(brand.html).toContain("https://www.comtor.app/onboarding?role=brand");
  });

  it("opens onboarding for someone who has no account yet", () => {
    expect(marketingEntryUrl("CREATOR")).toContain("/onboarding?role=creator");
    expect(marketingEntryUrl("STARTUP")).toContain("/onboarding?role=brand");
  });
});

describe("testEmail", () => {
  const email = testEmail("https://www.comtor.app");

  it("says what it is, in the subject and the body", () => {
    expect(email.subject).toBe("comtor test email");
    expect(email.html).toContain("It works.");
    expect(email.text).toContain("test email");
  });

  it("links to the site", () => {
    expect(email.html).toContain('href="https://www.comtor.app"');
  });
});
