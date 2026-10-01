"use client";

import { chooseLandingRole } from "@/components/landing/landing-role";

// For whoever tapped the wrong side on the way in (on phones the page only
// shows the side they picked). Back to the top, where the other side starts.
export function SwitchSideLink() {
  function switchTo(role: "creator" | "brand") {
    chooseLandingRole(role);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return (
    <p>
      <button type="button" data-for="creator" onClick={() => switchTo("brand")} className="underline underline-offset-2 hover:text-ink">
        Are you a brand? See comtor for brands
      </button>
      <button type="button" data-for="brand" onClick={() => switchTo("creator")} className="underline underline-offset-2 hover:text-ink">
        Are you a creator? See comtor for creators
      </button>
    </p>
  );
}
