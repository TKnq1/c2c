#!/usr/bin/env python3
"""Generates the music bed and the sound effects of the videos.

    video/public/music/creator-bed.mp3   music for the creator video (42 s, 120 BPM)
    video/public/sfx/*.wav               UI sounds (pop, click, swipe, coin, ...)

Everything is synthesised from code (oscillators and filtered noise, no samples, nothing third-party), so it
carries no licence of its own, like public/sounds/success.mp3 (scripts/make-success-sound.py). Needs numpy and
ffmpeg (with libmp3lame):

    python3 scripts/make-audio.py

The music follows the scene grid in src/creator/CreatorVideo.tsx: one beat is 15 frames, and every scene starts
on a beat. If the scene durations change there, change the BEAT_* markers below with them.
"""
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM
ROOT = Path(__file__).resolve().parent.parent / "public"
rng = np.random.default_rng(7)

# Scene starts of the creator video, in beats (frame / 15).
BEAT_TRANSITIONS = [7, 14, 21, 25, 34, 47, 56, 63, 71, 77]
BEAT_LOGO = 21  # C04, logo on black
BEAT_DROP = 25  # C05, first step: the groove starts
BEAT_PAYOUT = 71  # C10
BEAT_CTA = 77  # C11
BEAT_END = 84  # 42 s


# ---------------------------------------------------------------------------------------------------------------
# Building blocks


def midi(note):
    return 440.0 * 2 ** ((note - 69) / 12)


def axis(dur):
    return np.arange(int(dur * SR)) / SR


def band(x, lo=None, hi=None, order=2):
    """Smooth high-/low-pass in the frequency domain (no phase smear worth hearing at these lengths)."""
    spectrum = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    gain = np.ones_like(f)
    if lo:
        gain /= np.sqrt(1 + (lo / np.maximum(f, 1)) ** (2 * order))
    if hi:
        gain /= np.sqrt(1 + (f / hi) ** (2 * order))
    return np.fft.irfft(spectrum * gain, n=len(x))


def noise(dur):
    return rng.uniform(-1, 1, int(dur * SR))


def declick(x, ms=4):
    n = min(len(x) // 2, int(ms / 1000 * SR))
    if n:
        ramp = np.linspace(0, 1, n)
        x[:n] *= ramp
        x[-n:] *= ramp[::-1]
    return x


def saw(freq, t, cutoff, max_harmonics=48):
    """Band-limited sawtooth, already low-passed: additive, each harmonic weighted by a 2-pole roll-off."""
    out = np.zeros_like(t)
    phase = rng.uniform(0, 2 * np.pi)
    for n in range(1, max_harmonics + 1):
        fn = freq * n
        if fn > min(cutoff * 5, SR / 2 - 2000):
            break
        out += (1 / n) / (1 + (fn / cutoff) ** 2) * np.sin(2 * np.pi * fn * t + phase * n)
    return out


def adsr(t, dur, attack, release, decay=None, sustain=1.0):
    env = np.minimum(1, t / max(attack, 1e-4))
    if decay:
        env = env * (sustain + (1 - sustain) * np.exp(-np.maximum(t - attack, 0) / decay))
    tail = np.clip((dur - t) / max(release, 1e-4), 0, 1)
    return env * tail


def place(buf, start, x, pan=0.0, gain=1.0):
    """Mix mono x into stereo buf at `start` seconds, equal-power pan (-1 left .. 1 right)."""
    i = int(round(start * SR))
    if i >= len(buf):
        return
    x = x[: len(buf) - i] * gain
    angle = (pan + 1) * np.pi / 4
    buf[i : i + len(x), 0] += x * np.cos(angle)
    buf[i : i + len(x), 1] += x * np.sin(angle)


def reverb(buf, seconds=2.2, decay=0.55, wet=0.25, lo=200, hi=7000):
    """Convolution with exponentially decaying stereo noise."""
    t = axis(seconds)
    out = buf.copy()
    n = len(buf) + len(t)
    size = 1 << (n - 1).bit_length()
    for ch in range(2):
        ir = band(rng.normal(0, 1, len(t)), lo, hi) * np.exp(-t / decay)
        ir /= np.sqrt(np.sum(ir**2))
        wet_signal = np.fft.irfft(np.fft.rfft(buf[:, ch], size) * np.fft.rfft(ir, size), size)[: len(buf)]
        out[:, ch] += wet_signal * wet
    return out


def write(path, x, peak=0.89):
    x = np.asarray(x, dtype=np.float64)
    x = x / max(np.max(np.abs(x)), 1e-9) * peak
    channels = 1 if x.ndim == 1 else x.shape[1]
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(channels)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    if path.is_relative_to(ROOT):
        print(f"wrote {path.relative_to(ROOT.parent)}")


# ---------------------------------------------------------------------------------------------------------------
# Instruments


def kick(gain=1.0):
    t = axis(0.45)
    freq = 45 + 105 * np.exp(-t / 0.045)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / 0.16)
    click = band(noise(0.45), 1500, 6000) * np.exp(-t / 0.004) * 0.3
    return declick((body + click) * gain)


def clap(gain=1.0):
    t = axis(0.35)
    env = np.zeros_like(t)
    for k, offset in enumerate((0.0, 0.011, 0.022)):
        env += np.where(t >= offset, np.exp(-(t - offset) / (0.006 if k < 2 else 0.09)), 0)
    return declick(band(noise(0.35), 900, 5000) * env * 0.6 * gain)


def hat(open_=False, gain=1.0):
    dur = 0.28 if open_ else 0.06
    t = axis(dur)
    return declick(band(noise(dur), 7000, None) * np.exp(-t / (0.09 if open_ else 0.014)) * gain)


def crash(gain=1.0):
    t = axis(2.4)
    return declick(band(noise(2.4), 4500, 14000) * np.exp(-t / 0.7) * gain)


def pad_note(note, dur, cutoff=1400):
    t = axis(dur)
    voices = sum(saw(midi(note + d), t, cutoff) for d in (-0.08, 0.0, 0.07))
    return declick(voices * adsr(t, dur, 0.35, 0.5) / 3)


def pluck(note, dur=0.5, bright=1.0):
    t = axis(dur)
    f = midi(note)
    out = np.zeros_like(t)
    for n in range(1, 10):
        out += np.sin(2 * np.pi * f * n * t) / n**1.3 * np.exp(-t * (4 + n * 3.5 / bright))
    return declick(out * np.minimum(1, t / 0.003))


def bass(note, dur):
    t = axis(dur)
    f = midi(note)
    body = np.sin(2 * np.pi * f * t) + 0.35 * saw(f, t, 500, 12)
    return declick(body * adsr(t, dur, 0.005, 0.03, decay=0.12, sustain=0.6))


def impact():
    t = axis(2.5)
    freq = 32 + 50 * np.exp(-t / 0.25)
    boom = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / 0.9)
    hit = band(noise(2.5), None, 2500) * np.exp(-t / 0.18) * 0.5
    return declick(boom + hit)


def riser(dur):
    t = axis(dur)
    sweep = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2.5 * t / dur)) / SR) * 0.15
    air = band(noise(dur), 2000, 12000) * 0.5
    return declick((sweep + air) * (t / dur) ** 2.2)


# ---------------------------------------------------------------------------------------------------------------
# The creator bed

# vi - IV - I - V in C: Am7, Fmaj7, Cmaj7, G6. Pad voicing, bass root.
CHORDS = [
    ([57, 60, 64, 67], 45),
    ([53, 57, 60, 64], 41),
    ([55, 60, 64, 71], 48),
    ([55, 59, 62, 64], 43),
]
FINAL = ([60, 64, 67, 71, 74], 36)  # Cmaj9 under the call to action
ARP = [0, 1, 2, 3, 2, 1, 3, 2]


def beat_t(beat):
    return beat * BEAT


def creator_bed():
    length = int(beat_t(BEAT_END) * SR)
    music = np.zeros((length, 2))  # pads, plucks, bass: ducked by the kick
    drums = np.zeros((length, 2))
    fx = np.zeros((length, 2))
    kicks = []

    def chord_at(beat, origin):
        return CHORDS[int((beat - origin) // 4) % len(CHORDS)]

    # Intro (hook): pad and a quiet arpeggio; four bars from beat 0, the last one held into the logo.
    for bar_start in range(0, BEAT_LOGO, 4):
        notes, _ = chord_at(bar_start, 0)
        dur = beat_t(min(4, BEAT_LOGO - bar_start)) + 0.3
        for k, note in enumerate(notes):
            place(music, beat_t(bar_start), pad_note(note, dur, 900), pan=(k - 1.5) / 2.5, gain=0.16)
    for step in range(BEAT_LOGO * 2):
        beat = step / 2
        notes, _ = chord_at(beat, 0)
        note = notes[ARP[step % len(ARP)]] + 12
        place(music, beat_t(beat), pluck(note, 0.6, 0.8), pan=0.35 if step % 2 else -0.35, gain=0.08 + 0.05 * beat / BEAT_LOGO)

    # Build-up: hats from the second scene, kicks and a clap roll before the logo.
    for step in range(7 * 2, BEAT_LOGO * 2):
        place(drums, beat_t(step / 2), hat(gain=0.18 if step % 2 else 0.1), pan=0.3)
    for beat in range(14, BEAT_LOGO):
        place(drums, beat_t(beat), kick(0.55))
        _, root = chord_at(beat, 0)
        place(music, beat_t(beat), bass(root, BEAT * 0.9), gain=0.22)
    for k, step in enumerate(np.arange(19, BEAT_LOGO, 0.25)):
        place(drums, beat_t(step), clap(0.15 + 0.06 * k))
    place(fx, beat_t(17), riser(beat_t(BEAT_LOGO - 17)), gain=0.5)

    # Logo: impact, then a held F chord swelling into the drop.
    place(fx, beat_t(BEAT_LOGO), impact(), gain=0.9)
    place(fx, beat_t(BEAT_LOGO), crash(0.35), pan=0.2)
    for k, note in enumerate(CHORDS[1][0]):
        place(music, beat_t(BEAT_LOGO), pad_note(note, beat_t(BEAT_DROP - BEAT_LOGO), 700), pan=(k - 1.5) / 2.5, gain=0.15)
    swell_t = axis(beat_t(2))
    place(fx, beat_t(BEAT_DROP - 2), band(noise(beat_t(2)), 3000, 11000) * (swell_t / swell_t[-1]) ** 3, gain=0.35)

    # Groove: the walkthrough, from the first step to the call to action.
    for beat in range(BEAT_DROP, BEAT_CTA):
        rel = beat - BEAT_DROP
        place(drums, beat_t(beat), kick(1.0))
        kicks.append(beat_t(beat))
        if rel % 2 == 1:
            place(drums, beat_t(beat), clap(0.55), pan=-0.05)
        place(drums, beat_t(beat + 0.5), hat(open_=rel % 2 == 1, gain=0.22), pan=0.25)
        place(drums, beat_t(beat), hat(gain=0.1), pan=0.25)
        if beat >= 47:  # from the chat on: 16th shaker for a lift
            for q in (0.25, 0.75):
                place(drums, beat_t(beat + q), hat(gain=0.07), pan=-0.4)
        notes, root = chord_at(beat, BEAT_DROP)
        place(music, beat_t(beat + 0.5), bass(root, BEAT * 0.45), gain=0.5)
        if rel % 4 == 0:
            for k, note in enumerate(notes):
                place(music, beat_t(beat), pad_note(note, beat_t(4) + 0.2, 1600), pan=(k - 1.5) / 2.5, gain=0.13)
        for half in (0, 0.5):
            step = int(rel * 2 + half * 2)
            if step % 8 in (0, 3, 5, 6):
                note = notes[ARP[step % len(ARP)]] + 12
                place(music, beat_t(beat + half), pluck(note, 0.5, 1.4), pan=0.4 if step % 2 else -0.4, gain=0.14)
    place(fx, beat_t(BEAT_DROP), crash(0.4), pan=-0.2)
    for k, step in enumerate(np.arange(BEAT_PAYOUT - 1, BEAT_PAYOUT, 0.25)):  # fill into the payout
        place(drums, beat_t(step), clap(0.25 + 0.1 * k))
    place(fx, beat_t(BEAT_PAYOUT), crash(0.3), pan=0.2)

    # Call to action: drums stop on one last hit, a long Cmaj9 rings out.
    place(drums, beat_t(BEAT_CTA), kick(1.0))
    place(fx, beat_t(BEAT_CTA), crash(0.45))
    notes, root = FINAL
    tail = beat_t(BEAT_END - BEAT_CTA)
    for k, note in enumerate(notes):
        place(music, beat_t(BEAT_CTA), pad_note(note, tail, 2000), pan=(k - 2) / 3, gain=0.13)
        place(music, beat_t(BEAT_CTA) + k * 0.09, pluck(note + 12, 1.6, 0.7), pan=(k - 2) / 3, gain=0.12)
    place(music, beat_t(BEAT_CTA), bass(root, tail), gain=0.45)

    # Sidechain: everything but the drums ducks under each groove kick.
    t = np.arange(length) / SR
    duck = np.ones(length)
    for start in kicks:
        i = int(start * SR)
        seg = t[i : i + int(0.4 * SR)] - start
        duck[i : i + len(seg)] = np.minimum(duck[i : i + len(seg)], 1 - 0.55 * np.exp(-seg / 0.11))
    music *= duck[:, None]

    mix = reverb(music, wet=0.3) + reverb(drums, seconds=1.0, decay=0.25, wet=0.08) + reverb(fx, seconds=3.0, decay=0.9, wet=0.35)
    mix = np.tanh(mix / np.max(np.abs(mix)) * 1.6) / np.tanh(1.6)  # gentle glue
    fade = int(1.2 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
    return mix


# ---------------------------------------------------------------------------------------------------------------
# Sound effects (mono)


def sfx_whoosh(dur=0.42, lo=300, hi=6000):
    """Air moving past: noise whose band sweeps up, rising then falling."""
    t = axis(dur)
    segments = 10
    out = np.zeros_like(t)
    raw = noise(dur)
    for k in range(segments):
        centre = lo * (hi / lo) ** (k / (segments - 1))
        weight = np.exp(-(((t / dur) - k / (segments - 1)) ** 2) / 0.02)
        out += band(raw, centre * 0.6, centre * 1.6) * weight
    return declick(out * np.sin(np.pi * t / dur) ** 1.5)


def sfx_pop(start=380, end=880, dur=0.11):
    t = axis(dur)
    freq = start + (end - start) * (1 - np.exp(-t / 0.018))
    return declick(np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / 0.035))


def sfx_click():
    t = axis(0.05)
    tick = band(noise(0.05), 2500, 9000) * np.exp(-t / 0.0025)
    body = np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.006) * 0.5
    return declick(tick + body)


def sfx_tick():
    t = axis(0.04)
    return declick(band(noise(0.04), 1800, 7000) * np.exp(-t / 0.004) + np.sin(2 * np.pi * 420 * t) * np.exp(-t / 0.008) * 0.4)


def sfx_coin():
    t = axis(0.7)
    out = np.zeros_like(t)
    for hit, gain in ((0.0, 1.0), (0.07, 0.6)):
        th = np.maximum(t - hit, 0)
        on = t >= hit
        for ratio, amp, decay in ((1, 1.0, 0.25), (2.76, 0.5, 0.12), (5.4, 0.3, 0.07), (8.93, 0.15, 0.04)):
            out += on * amp * gain * np.sin(2 * np.pi * 1950 * ratio * th) * np.exp(-th / decay)
    return declick(out)


def sfx_like():
    """Pop plus a short sparkle."""
    out = np.concatenate([sfx_pop(450, 950, 0.12), np.zeros(int(0.3 * SR))])
    for k, note in enumerate((88, 91, 95)):
        t = axis(0.25)
        out[int((0.04 + k * 0.045) * SR) :][: len(t)] += np.sin(2 * np.pi * midi(note) * t) * np.exp(-t / 0.06) * 0.35
    return declick(out)


def sfx_strike():
    """Marker stroke through a word."""
    dur = 0.22
    t = axis(dur)
    scratch = band(noise(dur), 1500, 6000) * (0.6 + 0.4 * np.sin(2 * np.pi * 38 * t))
    return declick(scratch * np.sin(np.pi * t / dur) ** 0.7)


def sfx_stamp():
    t = axis(0.35)
    freq = 55 + 120 * np.exp(-t / 0.03)
    thud = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / 0.09)
    slap = band(noise(0.35), 600, 4000) * np.exp(-t / 0.015) * 0.6
    return declick(thud + slap)


def sfx_lock():
    out = np.zeros(int(0.25 * SR))
    for hit, pitch in ((0.0, 2600), (0.07, 1900)):
        t = axis(0.06)
        click = band(noise(0.06), 1500, 8000) * np.exp(-t / 0.003) + np.sin(2 * np.pi * pitch * t) * np.exp(-t / 0.01) * 0.6
        i = int(hit * SR)
        out[i : i + len(t)] += click
    t = axis(0.25)
    out += np.sin(2 * np.pi * 380 * t) * np.exp(-np.maximum(t - 0.07, 0) / 0.04) * (t >= 0.07) * 0.5
    return declick(out)


def write_mp3(path, x, peak):
    with tempfile.TemporaryDirectory() as tmp:
        wav_path = Path(tmp) / "bed.wav"
        write(wav_path, x, peak)
        path.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_path), "-codec:a", "libmp3lame", "-b:a", "192k", str(path)], check=True)
    print(f"wrote {path.relative_to(ROOT.parent)}")


def main():
    write_mp3(ROOT / "music" / "creator-bed.mp3", creator_bed(), peak=0.8)
    effects = {
        "whoosh": sfx_whoosh(),
        "swipe": sfx_whoosh(0.26, 600, 9000),
        "pop": sfx_pop(),
        "pop-low": sfx_pop(260, 520, 0.12),
        "click": sfx_click(),
        "tick": sfx_tick(),
        "coin": sfx_coin(),
        "like": sfx_like(),
        "strike": sfx_strike(),
        "stamp": sfx_stamp(),
        "lock": sfx_lock(),
    }
    for name, x in effects.items():
        write(ROOT / "sfx" / f"{name}.wav", x, peak=0.6)


if __name__ == "__main__":
    main()
