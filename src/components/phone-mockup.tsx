import { Avatar } from "@/components/avatar";
import { PlatformIcon } from "@/components/platform-icons";
import { Stars } from "@/components/stars";
import type { SignupRole } from "@/components/signup-form";

// Brand view: browsing the Discover feed of creators.
const MOCK_CREATORS = [
  { name: "Mia K.", niche: "Beauty", platform: "Instagram", followers: "58K", rating: 4.8 },
  { name: "Jonas R.", niche: "Fitness", platform: "TikTok", followers: "112K", rating: 4.9 },
  { name: "Aria N.", niche: "Travel", platform: "YouTube", followers: "34K", rating: 5.0 },
  { name: "Noah B.", niche: "Gaming", platform: "Twitch", followers: "89K", rating: 4.7 },
];

// Creator view: browsing their matching feed of brand requests. Company
// names match the app's own seeded demo brands for authenticity.
const MOCK_REQUESTS = [
  { company: "Glow Beauty Co.", title: "Skincare Launch Video", niche: "Beauty", minFollowers: "10K+" },
  { company: "FitTech Labs", title: "Gym Gear Review", niche: "Fitness", minFollowers: "25K+" },
  { company: "TasteBox", title: "Unboxing Collab", niche: "Food", minFollowers: "15K+" },
  { company: "StyleHub", title: "Capsule Wardrobe Post", niche: "Fashion", minFollowers: "20K+" },
];

export function PhoneMockup({ role = "STARTUP", className }: { role?: SignupRole; className?: string }) {
  return (
    <div
      className={`shrink-0 rounded-[2.75rem] border-[6px] border-neutral-900 bg-neutral-900 p-1.5 shadow-2xl dark:border-neutral-700 dark:bg-neutral-700 ${className ?? ""}`}
    >
      <span className="absolute left-1/2 top-3.5 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-700" />
      <div className="aspect-[9/19.5] w-full overflow-hidden rounded-[2.25rem] bg-paper flex flex-col">
        <div className="h-9 shrink-0" />
        <div className="flex items-center justify-between px-4 pb-3 shrink-0">
          <span className="font-display text-sm">c2c</span>
          <span className="text-[9px] font-medium uppercase tracking-wide text-neutral-400">
            {role === "STARTUP" ? "Discover" : "Feed"}
          </span>
        </div>
        <div className="flex flex-col gap-2 px-3">
          {role === "STARTUP"
            ? MOCK_CREATORS.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-2.5 rounded-2xl border border-ink/10 bg-paper p-2.5"
                >
                  <Avatar src={null} name={c.name} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold">{c.name}</p>
                    <span className="inline-flex items-center gap-1 text-[9px] text-neutral-500 dark:text-neutral-400">
                      <Stars rating={c.rating} className="text-[9px]" />
                      {c.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded bg-fog px-1.5 py-0.5 text-[8px] text-neutral-700 dark:text-neutral-300">
                      {c.niche}
                    </span>
                    <span className="flex items-center gap-1 text-[8px] text-neutral-500 dark:text-neutral-400">
                      <PlatformIcon platform={c.platform} className="h-2.5 w-2.5" />
                      {c.followers}
                    </span>
                  </div>
                </div>
              ))
            : MOCK_REQUESTS.map((r) => (
                <div
                  key={r.title}
                  className="flex items-center gap-2.5 rounded-2xl border border-ink/10 bg-paper p-2.5"
                >
                  <Avatar src={null} name={r.company} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[9px] text-neutral-500 dark:text-neutral-400">{r.company}</p>
                    <p className="truncate text-[11px] font-semibold">{r.title}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded bg-fog px-1.5 py-0.5 text-[8px] text-neutral-700 dark:text-neutral-300">
                      {r.niche}
                    </span>
                    <span className="text-[8px] text-neutral-500 dark:text-neutral-400">{r.minFollowers}</span>
                  </div>
                </div>
              ))}
        </div>
        <div className="mt-auto flex shrink-0 justify-center pb-2 pt-4">
          <div className="h-1 w-24 rounded-full bg-ink/20" />
        </div>
      </div>
    </div>
  );
}
