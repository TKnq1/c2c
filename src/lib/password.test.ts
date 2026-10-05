import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { BCRYPT_COST, hashPassword, verifyPassword } from "@/lib/password";

describe("verifyPassword", () => {
  it("accepts the right password and refuses a wrong one", async () => {
    const passwordHash = await hashPassword("correct horse battery");
    expect(await verifyPassword({ passwordHash }, "correct horse battery")).toBe(true);
    expect(await verifyPassword({ passwordHash }, "wrong")).toBe(false);
  });

  it("refuses when there is no account, and does the same bcrypt work as for a real one", async () => {
    const passwordHash = await hashPassword("x".repeat(12));
    const time = async (user: { passwordHash: string } | null) => {
      const start = performance.now();
      await verifyPassword(user, "not-the-password");
      return performance.now() - start;
    };
    expect(await verifyPassword(null, "anything")).toBe(false);
    // Same order of magnitude (a missing account used to return without hashing at all).
    const known = await time({ passwordHash });
    const unknown = await time(null);
    expect(unknown).toBeGreaterThan(known * 0.4);
  });

  it("hashes at the cost the dummy hash uses", async () => {
    const hash = await hashPassword("abcdefghij");
    expect(bcrypt.getRounds(hash)).toBe(BCRYPT_COST);
    // the dummy comes through verifyPassword(null, …): its cost is part of the timing argument
    expect(bcrypt.getRounds("$2b$10$3J0Ncz106pUt0YW2Gp06cerUZXMB6rDZEjx4Xc/yKUjrr3njkhuO6")).toBe(BCRYPT_COST);
  });
});
