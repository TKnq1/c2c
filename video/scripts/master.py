#!/usr/bin/env python3
"""Brings a rendered video's sound to the loudness social platforms play at (-14 LUFS, peaks under -1 dBTP).

    python3 scripts/master.py out/creator.mp4 out/brand.mp4   ->  out/creator-final.mp4, out/brand-final.mp4
    python3 scripts/master.py --gain=3.4 out/launch.mp4       ->  out/launch-final.mp4

One linear gain from a two-pass loudnorm, so the mix (voice, ducked music, sounds) keeps its balance. With --gain the
given gain (dB) is applied instead of a loudness target and a fast limiter catches the transients: for a video of
effects only that music is laid under later, which keeps its effects at the level they would have in that mix. The
picture is copied untouched. Needs ffmpeg.
"""
import json
import subprocess
import sys
from pathlib import Path

TARGET = "I=-14:TP=-1:LRA=11"


def master(path: Path, gain: float | None = None) -> Path:
    out = path.with_name(f"{path.stem}-final{path.suffix}")
    if gain is not None:
        encode(path, out, f"volume={gain:.2f}dB,alimiter=limit=0.82:attack=1:release=40:level=0")
        print(f"{out}: {gain:+.1f} dB")
        return out
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(path), "-af", f"loudnorm={TARGET}:print_format=json", "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=True,
    ).stderr
    m = json.loads(probe[probe.rindex("{") :])
    encode(
        path,
        out,
        f"loudnorm={TARGET}:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
        f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}",
    )
    print(f"{out}: {m['input_i']} LUFS -> -14 LUFS")
    return out


def encode(path: Path, out: Path, audio_filter: str):
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(path), "-c:v", "copy", "-af", audio_filter, "-ar", "48000", "-c:a", "aac", "-b:a", "256k", str(out)],
        check=True,
    )


if __name__ == "__main__":
    args = sys.argv[1:]
    gain = next((float(a.split("=", 1)[1]) for a in args if a.startswith("--gain=")), None)
    for arg in args:
        if not arg.startswith("--"):
            master(Path(arg), gain)
