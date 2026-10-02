import { describe, expect, it } from "vitest";
import {
  passwordChangedEmail,
  passwordResetEmail,
  verificationEmail,
  waitlistConfirmationEmail,
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
