import { describe, expect, it } from "vitest";
import { isSessionRevoked } from "@/lib/session-revocation";

describe("isSessionRevoked", () => {
  const changedAt = new Date("2026-10-02T10:00:00Z");
  const before = changedAt.getTime() - 60_000;
  const after = changedAt.getTime() + 60_000;

  it("keeps every login while the password was never changed", () => {
    expect(isSessionRevoked({ sid: "a", loginAt: before }, { sessionsRevokedAt: null, keptSessionId: null })).toBe(false);
  });
  it("logs out a login that began before the change", () => {
    expect(isSessionRevoked({ sid: "phone", loginAt: before }, { sessionsRevokedAt: changedAt, keptSessionId: "laptop" })).toBe(true);
  });
  it("keeps the login that changed the password", () => {
    expect(isSessionRevoked({ sid: "laptop", loginAt: before }, { sessionsRevokedAt: changedAt, keptSessionId: "laptop" })).toBe(false);
  });
  it("keeps a login made after the change", () => {
    expect(isSessionRevoked({ sid: "tablet", loginAt: after }, { sessionsRevokedAt: changedAt, keptSessionId: "laptop" })).toBe(false);
  });
  it("logs out everyone after a reset, which keeps no login", () => {
    expect(isSessionRevoked({ sid: "laptop", loginAt: before }, { sessionsRevokedAt: changedAt, keptSessionId: null })).toBe(true);
  });
  it("treats a login without a start time as older than the change", () => {
    expect(isSessionRevoked({}, { sessionsRevokedAt: changedAt, keptSessionId: "laptop" })).toBe(true);
  });
});
