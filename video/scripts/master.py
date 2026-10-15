#!/usr/bin/env python3
"""Brings a rendered video's sound to the loudness social platforms play at (-14 LUFS, peaks under -1 dBTP).

    python3 scripts/master.py out/creator.mp4 out/brand.mp4   ->  out/creator-final.mp4, out/brand-final.mp4
    python3 scripts/master.py --limit out/launch.mp4          ->  out/launch-final.mp4

One linear gain from a two-pass loudnorm, so the mix (voice, ducked music, sounds) keeps its balance. loudnorm falls
back to dynamic compression when that gain would push the peaks past the ceiling; with --limit the gain is applied as
is and a fast limiter catches the transients instead, so a quiet opening stays quiet. The picture is copied
untouched. Needs ffmpeg.
"""
import json
import subprocess
import sys
from pathlib import Path

TARGET = "I=-14:TP=-1:LRA=11"


def master(path: Path, limit=False) -> Path:
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(path), "-af", f"loudnorm={TARGET}:print_format=json", "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=True,
    ).stderr
    m = json.loads(probe[probe.rindex("{") :])
    gain = -14 - float(m["input_i"])
    second = f"volume={gain:.2f}dB,alimiter=limit=0.82:attack=1:release=40:level=0" if limit else (
        f"loudnorm={TARGET}:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
        f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}"
    )
    out = path.with_name(f"{path.stem}-final{path.suffix}")
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(path), "-c:v", "copy", "-af", second, "-ar", "48000", "-c:a", "aac", "-b:a", "256k", str(out)],
        check=True,
    )
    print(f"{out}: {m['input_i']} LUFS -> -14 LUFS")
    return out


if __name__ == "__main__":
    args = sys.argv[1:]
    for arg in args:
        if arg != "--limit":
            master(Path(arg), limit="--limit" in args)
