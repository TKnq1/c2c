#!/usr/bin/env python3
"""Generates public/sounds/success.mp3, the success sound of the onboarding moments.

Made from code with additive synthesis (no samples, nothing third-party), so it carries no licence of
its own. Needs only Python 3 and ffmpeg with libmp3lame:

    python3 scripts/make-success-sound.py
"""
import math
import struct
import subprocess
import tempfile
import wave
from pathlib import Path

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "public" / "sounds" / "success.mp3"

# A struck wooden bar: the fundamental plus two inharmonic partials that die away faster.
MARIMBA = ((1, 1.0), (3.9, 0.35), (9.2, 0.06))
# C5 E5 G5 A5 C6 E6, one every 0.1 s.
NOTES = (523.25, 659.25, 783.99, 880.0, 1046.5, 1318.5)


def tone(freq, dur, amp, partials, attack=0.002, decay=8.5):
    out = []
    for i in range(int(dur * SR)):
        t = i / SR
        env = min(1.0, t / attack) * math.exp(-decay * t)
        release = min(1.0, (dur - t) / 0.02)  # never a click at the cut
        v = sum(a * math.sin(2 * math.pi * freq * m * t) * math.exp(-0.9 * (m - 1) * t) for m, a in partials)
        out.append(v * env * release * amp)
    return out


def mix_into(buf, start, samples):
    i0 = int(start * SR)
    if len(buf) < i0 + len(samples):
        buf.extend([0.0] * (i0 + len(samples) - len(buf)))
    for i, s in enumerate(samples):
        buf[i0 + i] += s


def echo(buf, taps=((0.11, 0.35), (0.23, 0.18), (0.37, 0.09))):
    out = list(buf) + [0.0] * int(0.45 * SR)
    for delay, gain in taps:
        d = int(delay * SR)
        for i, s in enumerate(buf):
            out[i + d] += s * gain
    return out


def main():
    buf = []
    for k, freq in enumerate(NOTES):
        mix_into(buf, k * 0.1, tone(freq, 0.5, 0.8, MARIMBA))
    buf = echo(buf)

    peak = max(abs(s) for s in buf)
    gain = 0.5 / peak  # about -6 dB, as loud as the swipe sounds
    fade = int(0.06 * SR)
    n = len(buf)
    pcm = [
        int(max(-1.0, min(1.0, s * gain * (min(1.0, (n - i) / fade) if i > n - fade else 1.0))) * 32767)
        for i, s in enumerate(buf)
    ]
    with tempfile.TemporaryDirectory() as tmp:
        wav_path = Path(tmp) / "success.wav"
        with wave.open(str(wav_path), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(struct.pack("<%dh" % n, *pcm))
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_path), "-codec:a", "libmp3lame", "-b:a", "64k", "-ar", "44100", "-ac", "1", str(OUT)],
            check=True,
        )
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
