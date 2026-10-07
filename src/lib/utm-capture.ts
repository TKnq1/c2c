import { readUtm, type Utm } from "@/lib/utm";

// The campaign of the link this page was opened with, read once when the sign-up starts and kept in memory only:
// nothing is written to the device, and a reload reads the address again. The sign-up form sends it along.
let captured: Utm | null | undefined;

export function captureUtm(): Utm | null {
  if (captured === undefined) captured = typeof window === "undefined" ? null : readUtm(new URLSearchParams(window.location.search));
  return captured;
}
