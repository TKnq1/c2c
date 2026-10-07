"use client";

import { useEffect, useRef, useState } from "react";
import { FiPlay, FiSquare, FiTrash2 } from "react-icons/fi";
import { ACCENTS, ACCENT_KEYS, type AccentKey } from "@/lib/admin-theme";
import { addSongs, listSongs, playSong, removeSong, type StoredSong } from "@/lib/admin-song";

// Small pieces shared by the settings page and the setup assistant.

export const fieldClass = "rounded border border-ink/15 bg-paper px-3 py-1.5 text-sm outline-none focus:border-ink";

export function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-ink/10 py-3 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-bold">{label}</p>
        {hint && <p className="text-xs text-neutral-600 dark:text-neutral-400">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-ink/15 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-xs transition ${value === o.value ? "bg-ink font-bold text-paper" : "text-neutral-600 dark:text-neutral-400"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function AccentPicker({ value, onChange }: { value: AccentKey; onChange: (key: AccentKey) => void }) {
  return (
    <div role="radiogroup" aria-label="Akzentfarbe" className="flex gap-2">
      {ACCENT_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          aria-label={ACCENTS[key].label}
          title={ACCENTS[key].label}
          onClick={() => onChange(key)}
          className={`h-7 w-7 rounded-full border-2 border-paper transition ${value === key ? "ring-2 ring-ink" : "ring-1 ring-ink/15"}`}
          style={{ background: ACCENTS[key].light }}
        />
      ))}
    </div>
  );
}

export const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function WindowPicker({ from, to, onChange }: { from: number; to: number; onChange: (from: number, to: number) => void }) {
  return (
    <span className="flex items-center gap-2 text-sm">
      <select value={from} onChange={(e) => onChange(Number(e.target.value), to)} aria-label="Von" className={fieldClass}>
        {Array.from({ length: 24 }, (_, h) => (
          <option key={h} value={h}>
            {hourLabel(h)}
          </option>
        ))}
      </select>
      bis
      <select value={to} onChange={(e) => onChange(from, Number(e.target.value))} aria-label="Bis" className={fieldClass}>
        {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => (
          <option key={h} value={h}>
            {hourLabel(h)}
          </option>
        ))}
      </select>
    </span>
  );
}

// The songs stored in this browser: add, listen, remove. The files never leave the device.
export function SongManager({ volume }: { volume: number }) {
  const [songs, setSongs] = useState<StoredSong[]>([]);
  const [playing, setPlaying] = useState<number | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    void listSongs().then(setSongs);
    return () => audio.current?.pause();
  }, []);

  const preview = (song: StoredSong) => {
    audio.current?.pause();
    if (playing === song.id) {
      setPlaying(null);
      return;
    }
    audio.current = playSong(song, volume);
    audio.current.onended = () => setPlaying(null);
    setPlaying(song.id);
  };

  return (
    <div>
      <p className="mb-2 text-xs text-neutral-600 dark:text-neutral-400">
        Die Dateien bleiben nur in diesem Browser und werden nirgendwohin hochgeladen. Bei mehreren wechselt der Song jeden Tag.
      </p>
      <ul className="mb-2 flex flex-col">
        {songs.map((song) => (
          <li key={song.id} className="flex items-center gap-2 border-t border-ink/10 py-1.5 text-sm first:border-t-0">
            <span className="min-w-0 flex-1 truncate">{song.name}</span>
            <button type="button" onClick={() => preview(song)} aria-label={playing === song.id ? "Stopp" : "Anhören"} className="rounded p-1.5 text-graphite transition hover:bg-fog hover:text-ink">
              {playing === song.id ? <FiSquare className="h-4 w-4" aria-hidden /> : <FiPlay className="h-4 w-4" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={async () => {
                await removeSong(song.id);
                setSongs(await listSongs());
              }}
              aria-label={`${song.name} entfernen`}
              className="rounded p-1.5 text-graphite transition hover:bg-fog hover:text-ink"
            >
              <FiTrash2 className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
        {songs.length === 0 && <li className="text-xs text-neutral-500">Noch kein Song gewählt.</li>}
      </ul>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-4 py-1.5 text-xs font-bold transition hover:bg-fog">
        Datei wählen
        <input
          type="file"
          accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac"
          multiple
          className="sr-only"
          onChange={async (e) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            e.target.value = "";
            if (files.length === 0) return;
            await addSongs(files);
            setSongs(await listSongs());
          }}
        />
      </label>
    </div>
  );
}
