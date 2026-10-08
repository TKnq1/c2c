#!/usr/bin/env python3
"""Prepares the ElevenLabs recordings of the 15 s ads (ADS.md).

Two ways to deliver the recordings, per ad, and they can be mixed:

    video/voice/source/ads/AC1-1.mp3 … AC1-5.mp3   one file per line (always works, wins over the next one)
    video/voice/source/ads/AC1.mp3                 one file per ad, the five lines with a pause of about a second

and the results:

    video/public/vo/ads/<ID>.mp3      every line trimmed and brought to the voice loudness
    video/src/voice/ads.json          each line's file and length, read by src/ads/index.tsx

A line without a recording is left out, so the ad keeps its drawn timing there. Pauses inside a line are tightened and the
voice sped up a little (GAP_CAP, TEMPO below) so the ads stay close to 15 s. The lines of one file per ad are found
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
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent

# Number of spoken stretches (sentences, or parts split by a comma) of each line, as in ADS.md. The counts of AC2, AC4 and
# AB3 are those of the recordings made on 2026-10-08, where the voice left an extra pause in "Pro kostenlos" (AC2),
# "Mit | einem Klick" (AC4) and "Nicht auf | comtor" (AB3). A new recording needs its own counts (or one file per line).
PLAN = {
    "AC1": [2, 1, 2, 2, 3],
    "AC2": [3, 1, 2, 2, 4],
    "AC4": [2, 1, 3, 2, 3],
    "AB1": [4, 1, 1, 1, 3],
    "AB2": [3, 1, 2, 1, 3],
    "AB3": [4, 2, 1, 1, 3],
}

# Room kept around each line so no consonant is clipped.
PRE_ROLL = 0.04
POST_ROLL = 0.10
# The ads are 15 s, a spoken line has to fit its scene. A pause inside a line (between its sentences) is cut down to
# at most GAP_CAP seconds, and everything is played TEMPO times faster (pitch stays). Set both to None / 1.0 for the
# recordings as they are.
GAP_CAP = 0.22
TEMPO = 1.08
SR = 44100
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


def read_audio(source):
    """The whole recording as mono floats at 44.1 kHz."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(source), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def write_wav(path, samples):
    pcm = (np.clip(samples, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def assemble(audio, parts):
    """One line from its spoken stretches [(start, end), ...]: a pause longer than GAP_CAP is cut down to GAP_CAP."""
    inner_pre, inner_post = 0.03, 0.05
    pieces = []
    for k, (start, end) in enumerate(parts):
        first, last = k == 0, k == len(parts) - 1
        a = max(0.0, start - (PRE_ROLL if first else inner_pre))
        b = end + (POST_ROLL if last else inner_post)
        pieces.append(audio[int(a * SR) : int(b * SR)].copy())
        if not last:
            gap = parts[k + 1][0] - end
            if GAP_CAP is not None and gap > GAP_CAP:
                pieces.append(np.zeros(int(max(0.0, GAP_CAP - inner_post - inner_pre) * SR), dtype=np.float32))
            else:
                pieces[-1] = audio[int(a * SR) : int((parts[k + 1][0] - inner_pre) * SR)].copy()
    return np.concatenate(pieces)


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
    audio = read_audio(source)
    lines, i = {}, 0
    for n, count in enumerate(PLAN[ad], start=1):
        target = tmp / f"{ad}-{n}.wav"
        write_wav(target, assemble(audio, found[i : i + count]))
        i += count
        lines[f"{ad}-{n}"] = target
    return lines


def loudnorm(source, target):
    speed = f"atempo={TEMPO}," if TEMPO != 1.0 else ""
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(source), "-af", f"{speed}{TRIM},highpass=f=70,loudnorm={VOICE_LOUDNESS}:print_format=json", "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=True,
    ).stderr
    m = json.loads(probe[probe.rindex("{") :])
    second = (
        f"{speed}{TRIM},highpass=f=70,loudnorm={VOICE_LOUDNESS}:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
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
