import { afterEach, describe, expect, it } from "vitest";
import { isSealed, open, seal } from "@/lib/secret-box";

const KEY = Buffer.alloc(32, 7).toString("base64");

afterEach(() => {
  delete process.env.TOTP_ENCRYPTION_KEY;
});

describe("secret-box", () => {
  it("stores the secret unchanged when no key is configured", () => {
    expect(seal("JBSWY3DPEHPK3PXP")).toBe("JBSWY3DPEHPK3PXP");
    expect(open("JBSWY3DPEHPK3PXP")).toBe("JBSWY3DPEHPK3PXP");
  });

  it("round-trips with a key and hides the secret", () => {
    process.env.TOTP_ENCRYPTION_KEY = KEY;
    const sealed = seal("JBSWY3DPEHPK3PXP");
    expect(isSealed(sealed)).toBe(true);
    expect(sealed).not.toContain("JBSWY3DPEHPK3PXP");
    expect(open(sealed)).toBe("JBSWY3DPEHPK3PXP");
  });

  it("uses a fresh nonce each time", () => {
    process.env.TOTP_ENCRYPTION_KEY = KEY;
    expect(seal("abc")).not.toBe(seal("abc"));
  });

  it("still reads a plaintext secret after a key was added", () => {
    process.env.TOTP_ENCRYPTION_KEY = KEY;
    expect(open("JBSWY3DPEHPK3PXP")).toBe("JBSWY3DPEHPK3PXP");
  });

  it("refuses a tampered value", () => {
    process.env.TOTP_ENCRYPTION_KEY = KEY;
    const sealed = seal("secret");
    const broken = sealed.slice(0, -2) + (sealed.endsWith("AA") ? "BB" : "AA");
    expect(() => open(broken)).toThrow();
  });

  it("refuses a sealed value without the key", () => {
    process.env.TOTP_ENCRYPTION_KEY = KEY;
    const sealed = seal("secret");
    delete process.env.TOTP_ENCRYPTION_KEY;
    expect(() => open(sealed)).toThrow();
  });

  it("rejects a key of the wrong length", () => {
    process.env.TOTP_ENCRYPTION_KEY = Buffer.alloc(16).toString("base64");
    expect(() => seal("x")).toThrow();
  });
});
