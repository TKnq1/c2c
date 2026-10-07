import { after } from "next/server";

// Runs work after the response when there is a request to run it after, and right away (not awaited) when there is not
// (a script, a test). Failures are logged and never reach the caller: this is for side jobs like a notice.
export function runAfter(task: () => Promise<unknown>) {
  const guarded = () => task().catch((error) => console.error("Background task failed", error));
  try {
    after(guarded);
  } catch {
    void guarded();
  }
}
