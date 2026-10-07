#!/usr/bin/env python3
"""Cuts the ElevenLabs recordings into one file per scene and measures them.

    video/voice/source/creator.mp3, brand.mp3   the recordings, every line of VOICEOVER.md in order
    video/public/vo/<ID>.mp3                    one line per scene (C00, C01, ... B09)
    video/src/voice/<video>.json                each line's file and length, read by the videos

There is no speech recognition here (the models can't be downloaded in every environment). The lines are found by
their pauses instead: ElevenLabs pauses after every sentence, and also at a comma or a dash, so PLAN says how many
spoken stretches each line has. If the count doesn't add up, the script stops rather than guess. Needs numpy and
ffmpeg:

    python3 scripts/make-voiceover.py
"""
import json
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 16000

# Scene id and how many stretches of speech its line has (sentence parts split by a comma or a dash).
PLAN = {
    "creator": [
        ("C00", 1),  # Zweihundertfünfzig Euro für ein TikTok?
        ("C01", 1),  # Du postest sowieso.
        ("C02", 1),  # Dann lass dich dafür bezahlen.
        ("C03", 1),  # Schluss mit Preis-DMs.
        ("C04", 1),  # Das ist comtor.
        ("C05", 2),  # Profil anlegen, | Nische wählen.
        ("C06", 2),  # Durch Deals wischen – | das Budget steht auf der Karte.
        ("C07", 1),  # Deal im Chat klarmachen.
        ("C08", 1),  # Die Marke zahlt zuerst.
        ("C09", 3),  # Posten, | Link schicken, | fertig.
        ("C10", 1),  # Du behältst neunzig Prozent.
        ("C11", 2),  # Die ersten hundert Creator bekommen Pro kostenlos – | dann sind es siebenundneunzig.
        ("C12", 1),  # Jetzt auf comtor punkt app.
    ],
    "brand": [(f"B0{n}", 1) for n in range(1, 10)],
}

# Room kept around each line so no consonant is clipped.
PRE_ROLL = 0.04
POST_ROLL = 0.10
# The voice sits at this loudness; the music ducks under it (src/series.tsx).
VOICE_LOUDNESS = "I=-16:TP=-1.5:LRA=11"


def load(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def envelope(x, hop=0.01, win=0.04):
    """Loudness in dB every 10 ms, lightly smoothed."""
    h, w = int(hop * SR), int(win * SR)
    frames = np.lib.stride_tricks.sliding_window_view(np.pad(x, (w // 2, w // 2)), w)[::h]
    db = 10 * np.log10(np.mean(frames**2, axis=1) + 1e-10)
    kernel = np.hanning(5)
    return np.convolve(db, kernel / kernel.sum(), mode="same")


def stretches(env, min_gap=0.10, min_len=0.12):
    """Stretches of speech: above a threshold between the noise floor and the loud parts, short gaps bridged."""
    floor, top = np.percentile(env, 10), np.percentile(env, 95)
    on = env > floor + 0.35 * (top - floor)
    found, start = [], None
    for i, value in enumerate(on):
        if value and start is None:
            start = i * 0.01
        if not value and start is not None:
            found.append([start, i * 0.01])
            start = None
    if start is not None:
        found.append([start, len(on) * 0.01])
    merged = []
    for s in found:
        if merged and s[0] - merged[-1][1] < min_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [s for s in merged if s[1] - s[0] >= min_len]


def normalised(source, tmp):
    """The whole recording brought to VOICE_LOUDNESS with one linear gain (two-pass loudnorm), lightly high-passed."""
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(source), "-af", f"highpass=f=70,loudnorm={VOICE_LOUDNESS}:print_format=json", "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=True,
    ).stderr
    m = json.loads(probe[probe.rindex("{") :])
    second = (
        f"highpass=f=70,loudnorm={VOICE_LOUDNESS}:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
        f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}"
    )
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(source), "-af", second, "-ar", "44100", str(tmp)], check=True)
    return tmp


def main():
    out_dir = ROOT / "public" / "vo"
    out_dir.mkdir(parents=True, exist_ok=True)
    for video, plan in PLAN.items():
        source = ROOT / "voice" / "source" / f"{video}.mp3"
        found = stretches(envelope(load(source)))
        expected = sum(parts for _, parts in plan)
        if len(found) != expected:
            raise SystemExit(f"{source.name}: found {len(found)} stretches of speech, the script has {expected}. Check the recording.")

        tmp = out_dir / f".{video}-normalised.wav"
        normalised(source, tmp)
        lines, i = {}, 0
        for scene, parts in plan:
            start = max(0.0, found[i][0] - PRE_ROLL)
            end = found[i + parts - 1][1] + POST_ROLL
            i += parts
            length = end - start
            target = out_dir / f"{scene}.mp3"
            fade = f"afade=t=in:d=0.01,afade=t=out:st={length - 0.04:.3f}:d=0.04"
            subprocess.run(
                ["ffmpeg", "-y", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{length:.3f}", "-i", str(tmp), "-af", fade, "-b:a", "192k", str(target)],
                check=True,
            )
            lines[scene] = {"file": f"vo/{scene}.mp3", "seconds": round(length, 3)}
            print(f"{scene}: {start:6.2f}-{end:6.2f}  {length:.2f} s")
        tmp.unlink()
        (ROOT / "src" / "voice" / f"{video}.json").write_text(json.dumps(lines, indent=2) + "\n")
        print(f"wrote src/voice/{video}.json")


if __name__ == "__main__":
    main()
