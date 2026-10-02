import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// What Resend's client answers in each test; the module under test builds a
// new client per send, as it does in production.
const send = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    constructor(key?: string) {
      if (!key) throw new Error("Missing API key. Pass it to the constructor `new Resend(\"re_123\")`");
    }
    emails = { send };
  },
}));

const email = { to: "someone@example.com", subject: "Hello", html: "<p>Hi</p>", text: "Hi" };

async function load() {
  vi.resetModules();
  return import("@/lib/email");
}

beforeEach(() => {
  send.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("sendEmail", () => {
  it("returns the id when Resend takes the email", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_key");
    send.mockResolvedValue({ data: { id: "abc123" }, error: null });
    const { sendEmail } = await load();

    expect(await sendEmail(email)).toEqual({ ok: true, id: "abc123" });
  });

  it("returns Resend's own error instead of throwing, and logs it", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_key");
    send.mockResolvedValue({ data: null, error: { name: "validation_error", message: "The comtor.app domain is not verified." } });
    const { sendEmail } = await load();

    expect(await sendEmail(email)).toEqual({
      ok: false,
      error: "validation_error: The comtor.app domain is not verified.",
    });
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("The comtor.app domain is not verified."));
  });

  it("doesn't throw without an API key", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { sendEmail } = await load();

    const result = await sendEmail(email);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Missing API key");
  });

  it("sends from EMAIL_FROM, trimmed", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_key");
    vi.stubEnv("EMAIL_FROM", "  comtor <no-reply@comtor.app>\n");
    send.mockResolvedValue({ data: { id: "x" }, error: null });
    const { sendEmail } = await load();

    await sendEmail(email);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ from: "comtor <no-reply@comtor.app>" }));
  });
});

describe("emailSetup", () => {
  it("flags the shared test sender when EMAIL_FROM is missing", async () => {
    vi.stubEnv("EMAIL_FROM", "");
    vi.stubEnv("RESEND_API_KEY", "re_key");
    const { emailSetup } = await load();

    expect(emailSetup()).toEqual({ from: "comtor <onboarding@resend.dev>", apiKeySet: true, usesSharedTestSender: true });
  });

  it("reports the configured sender and a missing key, never the key itself", async () => {
    vi.stubEnv("EMAIL_FROM", "comtor <no-reply@comtor.app>");
    vi.stubEnv("RESEND_API_KEY", "");
    const { emailSetup } = await load();

    const setup = emailSetup();
    expect(setup).toEqual({ from: "comtor <no-reply@comtor.app>", apiKeySet: false, usesSharedTestSender: false });
    expect(JSON.stringify(setup)).not.toContain("re_");
  });
});
