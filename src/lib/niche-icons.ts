import type { IconType } from "react-icons";
import {
  IoAirplaneOutline,
  IoBarbellOutline,
  IoGameControllerOutline,
  IoLaptopOutline,
  IoPricetagOutline,
  IoRestaurantOutline,
  IoShirtOutline,
  IoSparklesOutline,
  IoSunnyOutline,
} from "react-icons/io5";

// One icon per niche (see NICHES in constants.ts) — shared between the Feed
// swipe cards and Discover so a niche reads as the same icon everywhere
// instead of two components drifting into visually-similar-but-different
// choices over time.
export const NICHE_ICONS: Record<string, IconType> = {
  Beauty: IoSparklesOutline,
  Fitness: IoBarbellOutline,
  Food: IoRestaurantOutline,
  Fashion: IoShirtOutline,
  Tech: IoLaptopOutline,
  Travel: IoAirplaneOutline,
  Gaming: IoGameControllerOutline,
  Lifestyle: IoSunnyOutline,
};

// Fallback for any value not in the list above, same defensive pattern as
// TAB_ICONS in nav.tsx, so an unmapped niche degrades instead of crashing.
// A plain object lookup at each call site (NICHE_ICONS[niche] ??
// DEFAULT_NICHE_ICON), not a getNicheIcon() function — react-hooks'
// static-components rule can't prove a function call always returns the
// same stable component reference, and flags it as "creating a component
// during render" even though this one always does return one of the fixed
// icons above.
export const DEFAULT_NICHE_ICON: IconType = IoPricetagOutline;
