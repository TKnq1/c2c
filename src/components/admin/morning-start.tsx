"use client";

import { useEffect, useRef, useState } from "react";
import { FiPause, FiPlay, FiVolume2, FiX } from "react-icons/fi";
import { localDayKey, shouldShowMorningStart } from "@/lib/admin-morning";
import { listSongs, playSong, songOfTheDay } from "@/lib/admin-song";

const LAST_KEY = "admin-morning-last";
const VISIT_KEY = "admin-morning-shown";

export type MorningProps = {
  enabled: boolean;
  from: number;
  to: number;
  everyTime: boolean;
  volume: number;
  name: string | null;
  stats: { newUsers: number; openTasks: number; feeLabel: string };
  goalLine: string;
};

// The first time the dashboard opens in the morning: a full-screen "Guten Morgen" with three numbers and a Start
// button. The click is what lets the browser play sound, so the song starts there, fading in. It plays on while you move
// around the admin, with a small control to pause it. Without a song the screen is just the greeting.
export function MorningStart(props: MorningProps) {
  const [open, setOpen] = useState(false);
  const [hasSong, setHasSong] = useState(false);
  const [playing, setPlaying] = useState<"playing" | "paused" | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let last: string | null = null;
    let shown = false;
    try {
      last = localStorage.getItem(LAST_KEY);
      shown = sessionStorage.getItem(VISIT_KEY) === "1";
    } catch {
      // Storage blocked: the screen can only show once per page load, which is the safest fallback.
    }
    const now = new Date();
    if (!shouldShowMorningStart({ enabled: props.enabled, from: props.from, to: props.to, everyTime: props.everyTime, now, lastShownDay: last, shownThisVisit: shown })) return;
    try {
      localStorage.setItem(LAST_KEY, localDayKey(now));
      sessionStorage.setItem(VISIT_KEY, "1");
    } catch {
      // See above.
    }
    void listSongs().then((songs) => setHasSong(songs.length > 0));
    queueMicrotask(() => setOpen(true));
    // Only the first render decides: changing a setting later must not pop the screen up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => audio.current?.pause(), []);

  const start = async (withSong: boolean) => {
    setOpen(false);
    if (!withSong) return;
    const song = songOfTheDay(await listSongs());
    if (!song) return;
    audio.current = playSong(song, props.volume);
    setPlaying("playing");
  };

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying("playing");
    } else {
      el.pause();
      setPlaying("paused");
    }
  };

  const stop = () => {
    audio.current?.pause();
    audio.current = null;
    setPlaying(null);
  };

  const today = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Guten Morgen" className="fixed inset-0 z-[60] grid place-items-center bg-paper/90 p-6 backdrop-blur-xl">
          <div className="flex w-full max-w-2xl flex-col items-center gap-5 text-center">
            <div className="flex h-9 items-end gap-1" aria-hidden>
              {[10, 22, 14, 30, 18, 26, 12].map((h, i) => (
                <i key={i} className="w-[5px] rounded-sm bg-accent" style={{ height: h }} />
              ))}
            </div>
            <p className="text-sm tracking-wide text-neutral-600 dark:text-neutral-400">{today}</p>
            <h1 className="font-display text-[2.5rem] leading-[2.75rem] font-black tracking-tight sm:text-[4rem] sm:leading-[4.25rem]">
              Guten Morgen{props.name ? `, ${props.name}` : ""}
            </h1>
            <p className="-mt-1 text-lg text-neutral-600 dark:text-neutral-400">Dein Tag in zehn Sekunden:</p>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { value: props.stats.newUsers.toLocaleString("de-DE"), label: "neue Nutzer in 24 Stunden" },
                { value: props.stats.openTasks.toLocaleString("de-DE"), label: props.stats.openTasks === 1 ? "Aufgabe wartet auf dich" : "Aufgaben warten auf dich" },
                { value: props.stats.feeLabel, label: "Provision in diesem Monat" },
              ].map((s) => (
                <div key={s.label} className="rounded border border-ink/10 bg-paper px-3 py-4">
                  <p className="font-display text-[2rem] leading-9 font-black tracking-tight">{s.value}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[0.9375rem] text-neutral-600 dark:text-neutral-400">{props.goalLine}</p>
            <button
              type="button"
              autoFocus
              onClick={() => void start(hasSong)}
              className="mt-1 inline-flex items-center gap-2.5 rounded-full bg-accent px-10 py-3.5 text-lg font-bold text-on-accent shadow-lg transition hover:opacity-90"
            >
              <FiPlay className="h-5 w-5" aria-hidden />
              Start
            </button>
            <p className="flex flex-wrap items-center justify-center gap-2 text-sm text-graphite">
              <FiVolume2 className="h-4 w-4" aria-hidden />
              {hasSong ? "Dein Morgen-Song startet leise und blendet ein." : "Kein Song gewählt. Du kannst einen unter „Anpassen“ hinzufügen."}
              {hasSong && (
                <button type="button" onClick={() => void start(false)} className="underline">
                  Ohne Song starten
                </button>
              )}
            </p>
          </div>
        </div>
      )}
      {playing && (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-1 rounded-full border border-ink/10 bg-paper py-1 pr-1 pl-3 text-xs shadow-lg">
          <FiVolume2 className="h-4 w-4 text-accent" aria-hidden />
          <span className="mr-1 font-bold">Morgen-Song</span>
          <button type="button" onClick={toggle} aria-label={playing === "playing" ? "Pause" : "Weiter"} className="rounded-full p-1.5 transition hover:bg-fog">
            {playing === "playing" ? <FiPause className="h-4 w-4" aria-hidden /> : <FiPlay className="h-4 w-4" aria-hidden />}
          </button>
          <button type="button" onClick={stop} aria-label="Song beenden" className="rounded-full p-1.5 transition hover:bg-fog">
            <FiX className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
    </>
  );
}
