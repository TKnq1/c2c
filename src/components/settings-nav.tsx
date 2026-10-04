"use client";

import { useEffect, useRef, useState } from "react";
import type { Role } from "@prisma/client";
import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/translate";

// The Settings page's jump bar. Sections are grouped so it stays short —
// Security covers password, 2FA and recent logins; Account covers data
// export, deletion and the legal pages. Each group jumps to its first
// section.
type Group = { id: string; label: MessageKey; sections: string[] };

function groupsFor(role: Role): Group[] {
  return [
    { id: "profile", label: "settingsNav.profile", sections: ["profile"] },
    // Plan/billing only applies to brands; payouts only to creators —
    // brands pay out, they don't receive.
    role === "STARTUP"
      ? { id: "plan", label: "settingsNav.plan", sections: ["plan"] }
      : { id: "payouts", label: "settingsNav.payouts", sections: ["payouts"] },
    { id: "appearance", label: "settingsNav.appearance", sections: ["appearance"] },
    { id: "password", label: "settingsNav.security", sections: ["password", "two-factor", "logins"] },
    { id: "push", label: "settingsNav.notifications", sections: ["push"] },
    { id: "data", label: "settingsNav.account", sections: ["data", "danger", "legal"] },
  ];
}

export function SettingsNav({ role }: { role: Role }) {
  const { t } = useI18n();
  const groups = groupsFor(role);
  const [active, setActive] = useState(groups[0].id);
  // Whether the bar is scrolled all the way right — the fade that hints at
  // more chips goes away once there aren't any.
  const [atEnd, setAtEnd] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const check = () => setAtEnd(nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 2);
    check();
    nav.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      nav.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  // Follows the scroll: the current group is the last one whose section
  // heading has passed under the bar. On dashboard pages <main> is the
  // scroll container, not the window (see dashboard-shell in globals.css).
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const scroller = nav.closest("main");
    const sections = groupsFor(role).flatMap((g) =>
      g.sections.flatMap((id) => {
        const el = document.getElementById(id);
        return el ? [{ group: g.id, el }] : [];
      }),
    );
    const update = () => {
      const line = nav.getBoundingClientRect().bottom + 24;
      let current = sections[0]?.group ?? "profile";
      for (const s of sections) if (s.el.getBoundingClientRect().top <= line) current = s.group;
      // At the very end the last group counts even if its heading never
      // makes it up to the bar.
      if (scroller && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) current = sections.at(-1)?.group ?? current;
      setActive(current);
    };
    update();
    const target: HTMLElement | Window = scroller ?? window;
    target.addEventListener("scroll", update, { passive: true });
    return () => target.removeEventListener("scroll", update);
  }, [role]);

  // Keeps the current chip in view as the bar scrolls sideways on phones.
  useEffect(() => {
    const nav = navRef.current;
    const chip = nav?.querySelector<HTMLElement>(`[data-group="${active}"]`);
    if (!nav || !chip) return;
    nav.scrollTo({ left: chip.offsetLeft - (nav.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  return (
    <nav
      ref={navRef}
      aria-label={t("settingsNav.label")}
      // Flush under the header: <main>'s top padding is the header's
      // height plus 2rem (on phones the header floats over <main>), and a
      // sticky element sticks inside its scroll container's padding — so
      // it pulls up by the 2rem (-mt-8) and sticks that much higher
      // (-top-8). Frosted like the header, which it continues.
      className="sticky -top-8 z-10 -mx-6 -mt-8 flex md:mt-0 items-center gap-1.5 overflow-x-auto border-b border-ink/10 bg-background/80 px-6 py-2.5 text-sm backdrop-blur-xl backdrop-saturate-150 scrollbar-hide md:mx-0 md:px-0"
    >
      {groups.map((g) => (
        <a
          key={g.id}
          href={`#${g.id}`}
          data-group={g.id}
          aria-current={g.id === active ? "true" : undefined}
          onClick={(e) => {
            e.preventDefault();
            setActive(g.id);
            document.getElementById(g.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition ${
            g.id === active ? "bg-ink text-paper" : "text-neutral-500 hover:text-ink dark:text-neutral-400"
          }`}
        >
          {t(g.label)}
        </a>
      ))}
      {/* Sticky insets count from inside the bar's px-6, so -right-6 is
          what puts the fade on the screen's edge rather than 24px in. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none sticky -right-6 -ml-8 w-8 shrink-0 self-stretch bg-gradient-to-l from-background to-transparent transition-opacity md:hidden ${atEnd ? "opacity-0" : ""}`}
      />
    </nav>
  );
}
