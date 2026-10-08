#!/usr/bin/env python3
"""Prepares the ElevenLabs recordings of the 15 s ads (ADS.md).

Two ways to deliver the recordings, per ad, and they can be mixed:

    video/voice/source/ads/AC1-1.mp3 … AC1-5.mp3   one file per line (always works, wins over the next one)
    video/voice/source/ads/AC1.mp3                 one file per ad, the five lines with a pause of about a second

and the results:

    video/public/vo/ads/<ID>.mp3      every line trimmed and brought to the voice loudness
    video/src/voice/ads.json          each line's file and length, read by src/ads/index.tsx

A line without a recording is left out, so the ad keeps its drawn timing there. The lines of one file per ad are found
by their pauses (ElevenLabs pauses after every sentence and at commas), so PLAN says how many spoken stretches each
line has. If the count doesn't add up, the script stops and lists the stretches it found rather than guess; per-line
files are the way out. Needs numpy and ffmpeg:

    python3 scripts/make-ad-voiceover.py && npm run ads:audio
"""
import importlib.util
import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Number of spoken stretches (sentences, or parts split by a comma) of each line, as in ADS.md.
PLAN = {
    "AC1": [2, 1, 2, 2, 3],
    "AC2": [3, 1, 2, 2, 3],
    "AC4": [2, 1, 2, 2, 3],
    "AB1": [4, 1, 1, 1, 3],
    "AB2": [3, 1, 2, 1, 3],
    "AB3": [4, 1, 1, 1, 3],
}

# Room kept around each line so no consonant is clipped.
PRE_ROLL = 0.04
POST_ROLL = 0.10
VOICE_LOUDNESS = "I=-16:TP=-1.5:LRA=11"
# Leading and trailing silence below this level is trimmed.
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,areverse"
AUDIO = (".mp3", ".wav", ".m4a")
LINE = re.compile(r"^A[CB]\d-[1-5]$")
AD = re.compile(r"^A[CB]\d$")


def pause_tools():
    """The pause detection of the long videos' script (scripts/make-voiceover.py), whose name has a dash."""
    spec = importlib.util.spec_from_file_location("make_voiceover", ROOT / "scripts" / "make-voiceover.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def split_ad(ad, source, tools, tmp):
    """The five lines of one recording, cut at the pauses: {line id: wav file}."""
    found = tools.stretches(tools.envelope(tools.load(source)))
    expected = sum(PLAN[ad])
    if len(found) != expected:
        listing = ", ".join(f"{a:.2f}-{b:.2f}" for a, b in found)
        raise SystemExit(
            f"{source.name}: found {len(found)} stretches of speech, the script has {expected} ({PLAN[ad]} per line).\n"
            f"  found: {listing}\n  Check the recording, or deliver this ad as one file per line ({ad}-1.mp3 … {ad}-5.mp3)."
        )
    lines, i = {}, 0
    for n, parts in enumerate(PLAN[ad], start=1):
        start = max(0.0, found[i][0] - PRE_ROLL)
        end = found[i + parts - 1][1] + POST_ROLL
        i += parts
        target = tmp / f"{ad}-{n}.wav"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{end - start:.3f}", "-i", str(source), "-ar", "44100", str(target)], check=True)
        lines[f"{ad}-{n}"] = target
    return lines


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
    for old in out_dir.glob("*.mp3"):
        old.unlink()

    files = sorted(p for p in source_dir.glob("*.*") if p.suffix.lower() in AUDIO)
    per_line = {p.stem: p for p in files if LINE.match(p.stem)}
    per_ad = {p.stem: p for p in files if AD.match(p.stem)}
    for p in files:
        if p.stem not in per_line and p.stem not in per_ad:
            print(f"skipped {p.name} (expected e.g. AC1.mp3 or AC1-1.mp3)")
    for ad in per_ad:
        if ad not in PLAN:
            raise SystemExit(f"{per_ad[ad].name}: no such ad (known: {', '.join(PLAN)})")

    lines = {}
    with tempfile.TemporaryDirectory() as tmp:
        if per_ad:
            tools = pause_tools()
            for ad, source in per_ad.items():
                lines.update(split_ad(ad, source, tools, Path(tmp)))
        lines.update(per_line)

        result = {}
        for line_id in sorted(lines):
            target = out_dir / f"{line_id}.mp3"
            loudnorm(lines[line_id], target)
            result[line_id] = {"file": f"vo/ads/{target.name}", "seconds": seconds(target)}
            print(f"{line_id}: {result[line_id]['seconds']:.2f} s")
    (ROOT / "src" / "voice" / "ads.json").write_text(json.dumps(result, indent=2) + "\n")
    print(f"wrote src/voice/ads.json ({len(result)} lines)")


if __name__ == "__main__":
    main()
