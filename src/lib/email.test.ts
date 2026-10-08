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

// The send log writes to the database; here it is only observed.
const logMail = vi.fn();
vi.mock("@/lib/mail-log", () => ({ logMail: (...args: unknown[]) => logMail(...args) }));

const email = { to: "someone@example.com", subject: "Hello", html: "<p>Hi</p>", text: "Hi" };

async function load() {
  vi.resetModules();
  return import("@/lib/email");
}

beforeEach(() => {
  send.mockReset();
  logMail.mockReset();
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

  it("logs every attempt with its subject and outcome, never the address", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_key");
    send.mockResolvedValueOnce({ data: { id: "abc123" }, error: null });
    send.mockResolvedValueOnce({ data: null, error: { name: "rate_limit", message: "Slow down." } });
    const { sendEmail } = await load();

    await sendEmail(email);
    await sendEmail(email);
    expect(logMail).toHaveBeenNthCalledWith(1, "Hello", { ok: true, id: "abc123" });
    expect(logMail).toHaveBeenNthCalledWith(2, "Hello", { ok: false, error: "rate_limit: Slow down." });
    expect(JSON.stringify(logMail.mock.calls)).not.toContain("someone@example.com");
  });

  it("hands attachments to Resend as buffers, and none when there are none", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_key");
    send.mockResolvedValue({ data: { id: "abc123" }, error: null });
    const { sendEmail } = await load();

    await sendEmail({ ...email, attachments: [{ filename: "RE-2026-000001.pdf", content: new Uint8Array([37, 80, 68, 70]) }] });
    const attached = send.mock.calls[0][0].attachments;
    expect(attached).toHaveLength(1);
    expect(attached[0].filename).toBe("RE-2026-000001.pdf");
    expect(Buffer.isBuffer(attached[0].content)).toBe(true);
    expect(attached[0].content.toString()).toBe("%PDF");

    await sendEmail(email);
    expect(send.mock.calls[1][0]).not.toHaveProperty("attachments");
    await sendEmail({ ...email, attachments: [] });
    expect(send.mock.calls[2][0]).not.toHaveProperty("attachments");
  });

  it("sends nothing and logs nothing in a dry run, even with a key", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_key");
    vi.stubEnv("EMAIL_DRY_RUN", "1");
    const { sendEmail } = await load();

    expect(await sendEmail(email)).toEqual({ ok: true, id: "dry-run" });
    expect(send).not.toHaveBeenCalled();
    expect(logMail).not.toHaveBeenCalled();
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
