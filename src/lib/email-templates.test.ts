import { describe, expect, it } from "vitest";
import {
  passwordChangedEmail,
  passwordResetEmail,
  testEmail,
  verificationEmail,
  waitlistConfirmationEmail,
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
    const creator = marketingWelcomeEmail("https://www.comtor.app/dashboard/creator", "CREATOR");
    const brand = marketingWelcomeEmail("https://www.comtor.app/dashboard/startup/new", "STARTUP");
    expect(creator.subject).toBe("You're in on comtor");
    expect(creator.text).toContain("Open your feed");
    expect(brand.text).toContain("Post a request");
    expect(brand.html).toContain("https://www.comtor.app/dashboard/startup/new");
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
