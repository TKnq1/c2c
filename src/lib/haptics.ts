// A light tick from the phone's haptic engine, for the moments that deserve
// one: a card let go, a star, a switch, a pull to refresh.
//
// Android has navigator.vibrate. iOS Safari has no API for it, but from
// iOS 18 it plays the system's own tick whenever a switch control
// (<input type="checkbox" switch>) flips, also through a click on its
// label, so a hidden one gets flipped. Either way it only works inside the
// user's gesture (a click, pointerup or touchend handler), and a desktop
// just ignores it.
export function haptic() {
  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
      return;
    }
    const label = document.createElement("label");
    label.style.display = "none";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    input.tabIndex = -1;
    label.append(input);
    // Its clicks aren't the user's, so nothing else on the page hears them.
    label.addEventListener("click", (e) => e.stopPropagation());
    document.head.append(label);
    label.click();
    label.remove();
  } catch {
    // No haptics is never worth surfacing.
  }
}

// A double tick for a moment that worked out, like the end of onboarding.
// Android plays the pattern. iOS has the ticks only inside a user gesture
// (see above), so there the first can be missed when this runs after a
// load rather than a tap.
export function hapticSuccess() {
  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate([12, 70, 24]);
      return;
    }
    haptic();
    setTimeout(haptic, 110);
  } catch {
    // See haptic.
  }
}
