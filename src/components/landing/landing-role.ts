"use client";

import { createContext, createElement, useContext, useEffect, useSyncExternalStore } from "react";
import { BRAND_LANDING_PATH, LANDING_ROLE_KEY } from "@/components/landing/landing-role-script";

export type LandingRole = "creator" | "brand";

const listeners = new Set<() => void>();

// The side the address itself stands for: "brand" on /marken, null on "/" (where creators are only the default).
const PageRoleContext = createContext<LandingRole | null>(null);

export function LandingPageRole({ role, children }: { role: LandingRole | null; children: React.ReactNode }) {
  return createElement(PageRoleContext.Provider, { value: role }, children);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): LandingRole | null {
  const role = document.documentElement.dataset.landingRole;
  return role === "brand" || role === "creator" ? role : null;
}

// null until a side is picked, unless the address stands for one (/marken); on the server it's only the address.
export function useLandingRole(): LandingRole | null {
  const pageRole = useContext(PageRoleContext);
  return useSyncExternalStore(subscribe, getSnapshot, () => null) ?? pageRole;
}

export function landingPath(role: LandingRole) {
  return role === "brand" ? BRAND_LANDING_PATH : "/";
}

// The address bar follows the side on show: "/" for creators, /marken for brands. Replaced, not pushed: switching
// sides isn't a step to go back from. ?for= has done its job once the address says the side.
function syncAddress(role: LandingRole) {
  const url = new URL(window.location.href);
  url.searchParams.delete("for");
  url.pathname = landingPath(role);
  if (url.href !== window.location.href) window.history.replaceState(null, "", url);
}

function setRole(role: LandingRole | null) {
  if (role) document.documentElement.dataset.landingRole = role;
  else delete document.documentElement.dataset.landingRole;
  listeners.forEach((listener) => listener());
}

function storedRole(): LandingRole | null {
  try {
    const role = localStorage.getItem(LANDING_ROLE_KEY);
    return role === "brand" || role === "creator" ? role : null;
  } catch {
    return null;
  }
}

export function chooseLandingRole(role: LandingRole) {
  setRole(role);
  try {
    localStorage.setItem(LANDING_ROLE_KEY, role);
  } catch {
    // Private mode: it just won't be remembered next time.
  }
  syncAddress(role);
}

// Once the page is up, the same rule as the inline script, for arrivals inside the app too (where <html> still
// carries the side of the last landing visit): /marken shows brands, "/" ?for=creators shows creators, otherwise
// the choice remembered from an earlier visit. A remembered brand choice then moves the address on to /marken.
export function LandingRoleSync({ role }: { role: LandingRole | null }) {
  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get("for");
    const shown = role ?? (asked === "creators" || asked === "creator" ? "creator" : storedRole());
    setRole(shown);
    syncAddress(shown ?? "creator");
  }, [role]);
  return null;
}
