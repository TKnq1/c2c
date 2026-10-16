#!/usr/bin/env python3
"""Fits the launch video's music to its cut.

The track is Lukrembo's "Jay" (freetouse.com), licensed music that is not ours to redistribute: it lives in
public/music/licensed/, which git ignores. 80 BPM; counted in bars of 3 s from its drop at 26.286 s it runs: intro,
groove (bars 0-15), breakdown (16-23), groove (24-31), a one-bar break (32), groove (33-39), outro (40 on).

The video's turn (L02) lands on the drop, so the track starts that far before it; the scenes sit on its bars from
there (src/launch/scenes.tsx). At the logo (L14) the track jumps to its one-bar break, and a bar later to its outro,
so the video ends as the track does. The jumps fall on bar lines with a few milliseconds of fade. Reads the scene
starts from src/voice/grid.json (npx tsx scripts/grid.ts). Needs ffmpeg.

    python3 scripts/launch-music.py   ->  public/music/licensed/launch-track.mp3
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "music" / "licensed" / "lukrembo-jay.mp3"
OUT = ROOT / "public" / "music" / "licensed" / "launch-track.mp3"
DROP = 26.286  # the drop's downbeat in the track, in seconds
BAR = 3.0  # four beats at 80 BPM
BREAK_BAR = 32
OUTRO_BAR = 40
EDGE = 0.008  # fade at each jump
END_FADE = 1.5


def bar(n):
    return DROP + n * BAR


def main():
    if not SOURCE.exists():
        raise SystemExit(f"missing {SOURCE.relative_to(ROOT)}: put the licensed track there first")
    grid = json.loads((ROOT / "src" / "voice" / "grid.json").read_text())["launch"]
    beat = 60 / grid["bpm"]
    turn = grid["scenes"]["L02"] * beat
    logo = grid["scenes"]["L14"] * beat
    end = grid["end"] * beat
    # (track start, length): straight to the logo, the logo over the break, then the outro to the end.
    segments = [(DROP - turn, logo), (bar(BREAK_BAR), BAR), (bar(OUTRO_BAR), end - logo - BAR)]
    chains = []
    for k, (start, length) in enumerate(segments):
        fade_in = 0.4 if k == 0 else EDGE
        fade_out = END_FADE if k == len(segments) - 1 else EDGE
        chains.append(
            f"[0:a]atrim=start={start:.4f}:duration={length:.4f},asetpts=PTS-STARTPTS,"
            f"afade=t=in:d={fade_in},afade=t=out:st={length - fade_out:.4f}:d={fade_out}[s{k}]"
        )
    graph = ";".join(chains) + ";" + "".join(f"[s{k}]" for k in range(len(segments))) + f"concat=n={len(segments)}:v=0:a=1"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(SOURCE), "-filter_complex", graph, "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "256k", str(OUT)], check=True)
    print(f"wrote {OUT.relative_to(ROOT)}: track from {segments[0][0]:.2f} s, break at {logo:.2f} s, outro at {logo + BAR:.2f} s, {end:.2f} s long")


if __name__ == "__main__":
    main()
