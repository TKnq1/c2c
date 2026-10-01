"use client";

import { useSyncExternalStore } from "react";
import { LANDING_ROLE_KEY } from "@/components/landing/landing-role-script";

export type LandingRole = "creator" | "brand";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): LandingRole | null {
  const role = document.documentElement.dataset.landingRole;
  return role === "brand" || role === "creator" ? role : null;
}

// null until a side is picked (and always on the server).
export function useLandingRole(): LandingRole | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function chooseLandingRole(role: LandingRole) {
  document.documentElement.dataset.landingRole = role;
  try {
    localStorage.setItem(LANDING_ROLE_KEY, role);
  } catch {
    // Private mode: it just won't be remembered next time.
  }
  listeners.forEach((listener) => listener());
}
