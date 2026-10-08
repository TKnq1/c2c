#!/usr/bin/env python3
"""Prepares the ElevenLabs recordings of the 15 s ads (ADS.md).

    video/voice/source/ads/<ID>.mp3   one recording per line, named after its scene: AC1-1.mp3 … AB5-5.mp3
    video/public/vo/ads/<ID>.mp3      the same line trimmed and brought to the voice loudness
    video/src/voice/ads.json          each line's file and length, read by src/ads/index.tsx

Silence at the start and end of a recording is cut. A line without a recording is left out, so the ad keeps its
drawn timing there. Needs ffmpeg:

    python3 scripts/make-ad-voiceover.py && npm run audio -- --ads
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICE_LOUDNESS = "I=-16:TP=-1.5:LRA=11"
# Leading and trailing silence below this level is trimmed, keeping a little room so no consonant is clipped.
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,areverse"
ID = re.compile(r"^A[CB][1-5]-[1-5]$")


def loudnorm(source, target):
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(source), "-af", f"{TRIM},highpass=f=70,loudnorm={VOICE_LOUDNESS}:print_format=json", "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=True,
    ).stderr
    m = json.loads(probe[probe.rindex("{") :])
    second = (
        f"{TRIM},highpass=f=70,loudnorm={VOICE_LOUDNESS}:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
        f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}"
    )
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(source), "-af", second, "-ar", "44100", "-b:a", "192k", str(target)], check=True)


def seconds(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True)
    return round(float(out.stdout.strip()), 3)


def main():
    source_dir = ROOT / "voice" / "source" / "ads"
    out_dir = ROOT / "public" / "vo" / "ads"
    out_dir.mkdir(parents=True, exist_ok=True)
    lines = {}
    for source in sorted(source_dir.glob("*.*")):
        if source.suffix.lower() not in (".mp3", ".wav", ".m4a") or not ID.match(source.stem):
            print(f"skipped {source.name} (expected e.g. AC1-1.mp3)")
            continue
        target = out_dir / f"{source.stem}.mp3"
        loudnorm(source, target)
        lines[source.stem] = {"file": f"vo/ads/{target.name}", "seconds": seconds(target)}
        print(f"{source.stem}: {lines[source.stem]['seconds']:.2f} s")
    (ROOT / "src" / "voice" / "ads.json").write_text(json.dumps(lines, indent=2) + "\n")
    print(f"wrote src/voice/ads.json ({len(lines)} lines)")


if __name__ == "__main__":
    main()
