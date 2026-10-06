#!/usr/bin/env python3
"""Brings a rendered video's sound to the loudness social platforms play at (-14 LUFS, peaks under -1 dBTP).

    python3 scripts/master.py out/creator.mp4 out/brand.mp4   ->  out/creator-final.mp4, out/brand-final.mp4

One linear gain from a two-pass loudnorm, so the mix (voice, ducked music, sounds) keeps its balance. The picture is
copied untouched. Needs ffmpeg.
"""
import json
import subprocess
import sys
from pathlib import Path

TARGET = "I=-14:TP=-1:LRA=11"


def master(path: Path) -> Path:
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(path), "-af", f"loudnorm={TARGET}:print_format=json", "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=True,
    ).stderr
    m = json.loads(probe[probe.rindex("{") :])
    second = (
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
    for arg in sys.argv[1:]:
        master(Path(arg))
