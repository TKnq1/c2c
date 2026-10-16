#!/usr/bin/env python3
"""Generates the music bed and the sound effects of the videos.

    video/public/music/creator-bed.mp3   music for the creator video (120 BPM)
    video/public/music/brand-bed.mp3     music for the brand video (120 BPM)
    video/public/music/ads/<ID>.mp3      music for each 15 s ad (src/ads), with --ads only these
    video/public/sfx/*.wav               UI sounds (pop, click, swipe, coin, ...)
    video/public/music/launch-bed.mp3    music for the 16:9 launch video (90 BPM), with --launch only this, the
    video/public/music/vertical-bed.mp3  9:16 cut's and the launch video's own sounds (keys, whip, slam, select, ...)

Everything is synthesised from code (oscillators and filtered noise, no samples, nothing third-party), so it
carries no licence of its own, like public/sounds/success.mp3 (scripts/make-success-sound.py). Needs numpy and
ffmpeg (with libmp3lame):

    python3 scripts/make-audio.py

The music follows the scene grid of each video (src/voice/grid.json, written by scripts/grid.ts): one beat is 15
frames, and every scene starts on a beat. `npm run audio` writes the grid and then the music.
"""
import json
import subprocess
import sys
import tempfile
import wave
import zlib
from pathlib import Path

import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM
ROOT = Path(__file__).resolve().parent.parent / "public"
rng = np.random.default_rng(7)

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
# The beds

# Pad voicing and bass root per chord, all in C.
AM7, FMAJ7, CMAJ7, G6 = ([57, 60, 64, 67], 45), ([53, 57, 60, 64], 41), ([55, 60, 64, 71], 48), ([55, 59, 62, 64], 43)
FINAL = ([60, 64, 67, 71, 74], 36)  # Cmaj9 under the call to action
ARP = [0, 1, 2, 3, 2, 1, 3, 2]

# The music follows the scenes as the videos play them (fitted to the voiceover): src/voice/grid.json has each
# scene's start in beats (frame / 15), written by scripts/grid.ts. The markers below name scenes, not beats.
GRID = json.loads((ROOT.parent / "src" / "voice" / "grid.json").read_text())

CREATOR = {
    "video": "creator",
    "file": "creator-bed.mp3",
    "chords": [AM7, FMAJ7, CMAJ7, G6],  # vi - IV - I - V
    "hook": ("C00", "C01"),  # kick and bass under the card slam, then the music drops back
    "hats_from": "C02",
    "kicks_from": "C03",
    "logo": "C04",  # logo on black
    "drop": "C05",  # first step: the groove starts
    "lift": "C07",  # the chat: 16th shaker on top
    "accents": ["C10", "C11"],  # the payout, the founding offer: fill and crash
    "breakdown": "C11",  # no kick or bass for the first two bars of the offer
    "cta_riser": True,
    "cta": "C12",
}
BRAND = {
    "video": "brand",
    "file": "brand-bed.mp3",
    "chords": [CMAJ7, G6, AM7, FMAJ7],  # I - V - vi - IV
    "hook": ("B01", "B02"),  # the ads flicked away
    "hats_from": "B02",
    "kicks_from": "B03",
    "logo": "B04",
    "drop": "B05",  # the request
    "lift": "B06",  # creators coming in
    "accents": ["B08"],  # the founding offer
    "breakdown": "B08",
    "cta_riser": True,
    "cta": "B09",
}


def resolve(spec):
    """The spec's scene names turned into beats on the video's grid."""
    grid = GRID[spec["video"]]
    at = grid["scenes"]
    return {
        **spec,
        "hook": (at[spec["hook"][0]], at[spec["hook"][1]]),
        "hats_from": at[spec["hats_from"]],
        "kicks_from": at[spec["kicks_from"]],
        "logo": at[spec["logo"]],
        "drop": at[spec["drop"]],
        "lift": at[spec["lift"]],
        "accents": [at[name] for name in spec["accents"]],
        "breakdown": (at[spec["breakdown"]], at[spec["breakdown"]] + 4) if spec["breakdown"] else None,
        "cta": at[spec["cta"]],
        "end": grid["end"],
    }


def beat_t(beat):
    return beat * BEAT


def make_bed(spec):
    chords = spec["chords"]
    logo, drop, cta, end = spec["logo"], spec["drop"], spec["cta"], spec["end"]
    hook_from, intro = spec["hook"]
    hats_from, kicks_from = spec["hats_from"], spec["kicks_from"]
    length = int(beat_t(end) * SR)
    music = np.zeros((length, 2))  # pads, plucks, bass: ducked by the kick
    drums = np.zeros((length, 2))
    fx = np.zeros((length, 2))
    kicks = []

    def chord_at(beat, origin):
        return chords[int((beat - origin) // 4) % len(chords)]

    def in_breakdown(beat):
        return spec["breakdown"] is not None and spec["breakdown"][0] <= beat < spec["breakdown"][1]

    # Hook: straight in with kick, clap and bass on the first chord; beat 0 is left to the scene's own impact.
    for beat in range(hook_from + 1, intro):
        place(drums, beat_t(beat), kick(0.9))
        kicks.append(beat_t(beat))
        if (beat - hook_from) % 2 == 0:
            place(drums, beat_t(beat), clap(0.45), pan=-0.05)
        for half in (0, 0.5):
            place(drums, beat_t(beat + half), hat(gain=0.16 if half else 0.08), pan=0.25)
        place(music, beat_t(beat + 0.5), bass(chords[0][1], BEAT * 0.45), gain=0.45)
    for k, note in enumerate(chords[0][0]):
        place(music, beat_t(hook_from), pad_note(note, beat_t(intro - hook_from), 1500), pan=(k - 1.5) / 2.5, gain=0.13)
    place(fx, beat_t(intro) - 0.35, band(noise(0.35), 3000, 10000) * np.linspace(0, 1, int(0.35 * SR)) ** 3, gain=0.25)

    # Intro: the music drops back to a pad and a quiet arpeggio, a chord every bar, the last one held into the logo.
    for bar_start in range(intro, logo, 4):
        notes, _ = chord_at(bar_start, intro)
        dur = beat_t(min(4, logo - bar_start)) + 0.3
        for k, note in enumerate(notes):
            place(music, beat_t(bar_start), pad_note(note, dur, 900), pan=(k - 1.5) / 2.5, gain=0.16)
    for step in range(intro * 2, logo * 2):
        beat = step / 2
        notes, _ = chord_at(beat, intro)
        note = notes[ARP[step % len(ARP)]] + 12
        place(music, beat_t(beat), pluck(note, 0.6, 0.8), pan=0.35 if step % 2 else -0.35, gain=0.08 + 0.05 * (beat - intro) / (logo - intro))

    # Build-up: hats from the second scene, kicks from the third, a riser and a clap roll into the logo.
    for step in range(hats_from * 2, logo * 2):
        place(drums, beat_t(step / 2), hat(gain=0.18 if step % 2 else 0.1), pan=0.3)
    for beat in range(kicks_from, logo):
        place(drums, beat_t(beat), kick(0.55))
        _, root = chord_at(beat, intro)
        place(music, beat_t(beat), bass(root, BEAT * 0.9), gain=0.22)
    for k, step in enumerate(np.arange(logo - 2, logo, 0.25)):
        place(drums, beat_t(step), clap(0.15 + 0.06 * k))
    place(fx, beat_t(logo - 4), riser(beat_t(4)), gain=0.5)

    # Logo: impact, then the next chord held and swelling into the drop.
    place(fx, beat_t(logo), impact(), gain=0.9)
    place(fx, beat_t(logo), crash(0.35), pan=0.2)
    for k, note in enumerate(chords[1][0]):
        place(music, beat_t(logo), pad_note(note, beat_t(drop - logo), 700), pan=(k - 1.5) / 2.5, gain=0.15)
    swell_t = axis(beat_t(2))
    place(fx, beat_t(drop - 2), band(noise(beat_t(2)), 3000, 11000) * (swell_t / swell_t[-1]) ** 3, gain=0.35)

    # Groove: the walkthrough, from the first step to the call to action.
    for beat in range(drop, cta):
        rel = beat - drop
        quiet = in_breakdown(beat)
        notes, root = chord_at(beat, drop)
        if not quiet:
            place(drums, beat_t(beat), kick(1.0))
            kicks.append(beat_t(beat))
            place(music, beat_t(beat + 0.5), bass(root, BEAT * 0.45), gain=0.5)
            place(drums, beat_t(beat), hat(gain=0.1), pan=0.25)
        if rel % 2 == 1:
            place(drums, beat_t(beat), clap(0.35 if quiet else 0.55), pan=-0.05)
        place(drums, beat_t(beat + 0.5), hat(open_=rel % 2 == 1, gain=0.22), pan=0.25)
        if beat >= spec["lift"] and not quiet:
            for q in (0.25, 0.75):
                place(drums, beat_t(beat + q), hat(gain=0.07), pan=-0.4)
        if rel % 4 == 0 or beat == drop:
            for k, note in enumerate(notes):
                place(music, beat_t(beat), pad_note(note, beat_t(4) + 0.2, 1100 if quiet else 1600), pan=(k - 1.5) / 2.5, gain=0.16 if quiet else 0.13)
        for half in (0, 0.5):
            step = int(rel * 2 + half * 2)
            if step % 8 in (0, 3, 5, 6):
                note = notes[ARP[step % len(ARP)]] + 12
                place(music, beat_t(beat + half), pluck(note, 0.5, 1.4), pan=0.4 if step % 2 else -0.4, gain=0.14)
    place(fx, beat_t(drop), crash(0.4), pan=-0.2)
    for accent in spec["accents"]:
        for k, step in enumerate(np.arange(accent - 1, accent, 0.25)):  # fill into the accent
            place(drums, beat_t(step), clap(0.25 + 0.1 * k))
        place(fx, beat_t(accent), crash(0.35), pan=0.2)
    if spec["cta_riser"]:
        place(fx, beat_t(cta - 4), riser(beat_t(4)), gain=0.45)
        for k, step in enumerate(np.arange(cta - 1, cta, 0.25)):
            place(drums, beat_t(step), clap(0.2 + 0.08 * k))

    # Call to action: drums stop on one last hit, a long Cmaj9 rings out.
    place(drums, beat_t(cta), kick(1.0))
    place(fx, beat_t(cta), crash(0.45))
    if spec["cta_riser"]:
        place(fx, beat_t(cta), impact(), gain=0.6)
    notes, root = FINAL
    tail = beat_t(end - cta)
    for k, note in enumerate(notes):
        place(music, beat_t(cta), pad_note(note, tail, 2000), pan=(k - 2) / 3, gain=0.13)
        place(music, beat_t(cta) + k * 0.09, pluck(note + 12, 1.6, 0.7), pan=(k - 2) / 3, gain=0.12)
    place(music, beat_t(cta), bass(root, tail), gain=0.45)

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
# The ads: 15 s, five beats each (src/ads/index.tsx). Quieter and cleaner than the long videos: tension under the
# pain, a hit on the turn, the groove only under the product, one long chord under the call to action.

AD_CHORDS = {
    "creator": [FMAJ7, CMAJ7, G6, AM7],  # IV - I - V - vi
    "brand": [CMAJ7, G6, AM7, FMAJ7],  # I - V - vi - IV
}


def make_ad_bed(grid, audience):
    at = [int(round(b)) for b in grid["scenes"].values()]
    turn, mech, payoff, cta, end = at[1], at[2], at[3], at[4], int(round(grid["end"]))
    chords = AD_CHORDS[audience]
    length = int(beat_t(end + 2) * SR)
    music = np.zeros((length, 2))
    drums = np.zeros((length, 2))
    fx = np.zeros((length, 2))
    kicks = []

    # Pain: a dark pad, a single muted note ticking on the eighths, a soft pulse every two beats.
    notes, root = AM7
    for k, note in enumerate(notes):
        place(music, 0, pad_note(note - 12 if k == 0 else note, beat_t(turn) + 0.3, 700), pan=(k - 1.5) / 2.5, gain=0.15)
    for step in range(0, turn * 2):
        place(music, beat_t(step / 2), pluck(69 if step % 4 else 72, 0.25, 0.5), pan=0.3 if step % 2 else -0.3, gain=0.05 + 0.05 * step / (turn * 2))
    for beat in range(0, turn, 2):
        place(music, beat_t(beat), bass(root, BEAT * 1.6), gain=0.28)
    place(fx, beat_t(turn - 2), riser(beat_t(2)), gain=0.45)

    # Turn: the hit, then the first chord of the groove swelling in.
    place(fx, beat_t(turn), impact(), gain=0.8)
    place(fx, beat_t(turn), crash(0.3), pan=0.2)
    for k, note in enumerate(chords[0][0]):
        place(music, beat_t(turn), pad_note(note, beat_t(mech - turn) + 0.2, 900), pan=(k - 1.5) / 2.5, gain=0.13)

    # Product and payoff: the groove.
    for beat in range(mech, cta):
        rel = beat - mech
        chord_notes, chord_root = chords[(rel // 4) % len(chords)]
        place(drums, beat_t(beat), kick(0.9))
        kicks.append(beat_t(beat))
        if rel % 2 == 1:
            place(drums, beat_t(beat), clap(0.4), pan=-0.05)
        place(drums, beat_t(beat + 0.5), hat(open_=rel % 2 == 1, gain=0.18), pan=0.25)
        place(music, beat_t(beat + 0.5), bass(chord_root, BEAT * 0.45), gain=0.45)
        if rel % 4 == 0:
            for k, note in enumerate(chord_notes):
                place(music, beat_t(beat), pad_note(note, beat_t(4) + 0.2, 1500), pan=(k - 1.5) / 2.5, gain=0.12)
        for half in (0, 0.5):
            step = int(rel * 2 + half * 2)
            if step % 8 in (0, 3, 5, 6):
                place(music, beat_t(beat + half), pluck(chord_notes[ARP[step % len(ARP)]] + 12, 0.5, 1.3), pan=0.4 if step % 2 else -0.4, gain=0.12)
    place(fx, beat_t(mech), crash(0.35), pan=-0.2)
    place(fx, beat_t(payoff), crash(0.3), pan=0.2)
    for k, step in enumerate(np.arange(cta - 1, cta, 0.25)):
        place(drums, beat_t(step), clap(0.15 + 0.07 * k))

    # Call to action: one last hit, a long Cmaj9, a soft pulse so it doesn't stall.
    place(drums, beat_t(cta), kick(1.0))
    kicks.append(beat_t(cta))
    place(fx, beat_t(cta), crash(0.4))
    notes, root = FINAL
    tail = beat_t(end - cta + 2)
    for k, note in enumerate(notes):
        place(music, beat_t(cta), pad_note(note, tail, 2000), pan=(k - 2) / 3, gain=0.13)
        place(music, beat_t(cta) + k * 0.09, pluck(note + 12, 1.6, 0.7), pan=(k - 2) / 3, gain=0.12)
    place(music, beat_t(cta), bass(root, tail), gain=0.4)
    for beat in range(cta + 1, int(end)):
        place(drums, beat_t(beat + 0.5), hat(gain=0.1), pan=0.25)

    t = np.arange(length) / SR
    duck = np.ones(length)
    for start in kicks:
        i = int(start * SR)
        seg = t[i : i + int(0.4 * SR)] - start
        duck[i : i + len(seg)] = np.minimum(duck[i : i + len(seg)], 1 - 0.5 * np.exp(-seg / 0.11))
    music *= duck[:, None]

    mix = reverb(music, wet=0.3) + reverb(drums, seconds=1.0, decay=0.25, wet=0.08) + reverb(fx, seconds=3.0, decay=0.9, wet=0.35)
    mix = np.tanh(mix / np.max(np.abs(mix)) * 1.6) / np.tanh(1.6)
    fade = int(1.0 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
    return mix


# ---------------------------------------------------------------------------------------------------------------
# The launch video (src/launch): pop lofi at the cut's tempo (90 BPM, a beat is 20 frames), F major, the royal road
# IV-V-iii-vi (B flat maj9, C9, A minor 7, D minor 9). A Rhodes comping with a light tape wobble, a warm bass, swung
# lofi drums (round kick, dusty snare, a clap in the bigger grooves, swung hats) and a vibraphone hook in the later
# grooves. The Rhodes, bass and vibraphone are the FluidR3 GM soundfont (MIT) through fluidsynth (apt: fluidsynth
# fluid-soundfont-gm; pip: mido); the drums are synthesised. Quiet and filtered under the opening lines, the groove
# from the turn, breaks under "Ein Swipe" and the switch to brands, drums out for the logo, then two soft bars and a
# last chord on the bar line, left to ring out to the end.

SF2 = Path("/usr/share/sounds/sf2/FluidR3_GM.sf2")
# (bass root, Rhodes voicing) per bar.
LOFI_PROG = [(46, [62, 65, 69, 72]), (48, [64, 67, 70, 74]), (45, [64, 67, 69, 72]), (50, [64, 65, 69, 72])]
# The vibraphone hook over four bars: (beat, beats, note).
LOFI_HOOK = [
    (0, 0.5, 72), (0.5, 0.5, 74), (1, 1, 77), (2.5, 0.5, 74), (3, 1, 72),
    (4, 0.5, 69), (4.5, 0.5, 72), (5, 1.5, 74), (6.5, 0.5, 76), (7, 1, 74),
    (8, 0.5, 76), (8.5, 0.5, 74), (9, 1, 72), (10, 1.5, 69),
    (12, 0.5, 67), (12.5, 0.5, 69), (13, 1.5, 72), (14.5, 1.5, 69),
]
SWING = 0.07  # beats an offbeat eighth is late


def lbeat():
    return 60 / GRID["launch"]["bpm"]


def lt(beat):
    return beat * lbeat()


def swung(beat):
    """Offbeat eighths a little late, like a played groove."""
    return beat + (SWING if abs((beat % 1) - 0.5) < 1e-6 else 0)


def gm_render(notes, program, length):
    """Plays (beat, beats, note, velocity) on one GM program through fluidsynth, stereo, `length` seconds."""
    import mido

    mid = mido.MidiFile(ticks_per_beat=480)
    track = mido.MidiTrack()
    mid.tracks.append(track)
    track.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(GRID["launch"]["bpm"]), time=0))
    track.append(mido.Message("program_change", program=program, channel=0, time=0))
    events = sorted(
        [(int(b * 480), 1, n, int(np.clip(v, 1, 127))) for b, d, n, v in notes] + [(int((b + d) * 480), 0, n, 0) for b, d, n, v in notes],
        key=lambda e: (e[0], e[1]),
    )
    now = 0
    for at, on, note, vel in events:
        track.append(mido.Message("note_on" if on else "note_off", note=note, velocity=vel, channel=0, time=at - now))
        now = at
    with tempfile.TemporaryDirectory() as tmp:
        mid_path, wav_path = Path(tmp) / "part.mid", Path(tmp) / "part.wav"
        mid.save(mid_path)
        subprocess.run(
            ["fluidsynth", "-ni", "-q", "-R", "0", "-C", "0", "-g", "0.6", "-r", str(SR), "-T", "wav", "-F", str(wav_path), str(SF2), str(mid_path)],
            check=True,
            capture_output=True,
        )
        with wave.open(str(wav_path)) as w:
            data = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float64).reshape(-1, w.getnchannels()) / 32768
    out = np.zeros((int(length * SR), 2))
    n = min(len(out), len(data))
    out[:n] = data[:n, :2]
    return out


def level(x, target_db):
    """Scales a stem so its sounding part sits at `target_db` RMS: the mix is set by these targets."""
    sounding = x[np.abs(x).max(axis=1) > 1e-4]
    rms = np.sqrt(np.mean(sounding**2)) if len(sounding) else 1.0
    return x * 10 ** (target_db / 20) / max(rms, 1e-9)


def stereo_band(x, lo=None, hi=None):
    return np.stack([band(x[:, ch], lo, hi) for ch in range(2)], axis=1)


def open_filter(x, start, stop, f0, f1, steps=24):
    """Low-pass opening from f0 to f1 between `start` and `stop` seconds, in short blocks."""
    out = x.copy()
    edges = np.linspace(int(start * SR), int(stop * SR), steps + 1).astype(int)
    pad = int(0.05 * SR)
    for k in range(steps):
        lo, hi = edges[k], edges[k + 1]
        s0 = max(0, lo - pad)
        out[lo:hi] = stereo_band(x[s0:hi], None, f0 * (f1 / f0) ** (k / (steps - 1)))[lo - s0 :]
    return out


def muffle(x, start, stop, cutoff):
    """Low-pass a stretch (a break) and leave the rest."""
    out = x.copy()
    a, b = int(start * SR), int(stop * SR)
    pad = int(0.05 * SR)
    seg = stereo_band(x[max(0, a - pad) : b + pad], None, cutoff)
    out[a:b] = seg[a - max(0, a - pad) : a - max(0, a - pad) + (b - a)]
    return out


def tape_wobble(x, depth_ms=0.5, rate=0.55):
    """A slow, slightly uneven pitch wobble like worn tape: a delay line swinging a millisecond or so."""
    n = len(x)
    t = np.arange(n) / SR
    delay = (3 + depth_ms * np.sin(2 * np.pi * rate * t) + 0.15 * np.sin(2 * np.pi * 2.7 * t + 1.3)) / 1000 * SR
    idx = np.clip(np.arange(n) - delay, 0, n - 1)
    return np.stack([np.interp(idx, np.arange(n), x[:, ch]) for ch in range(2)], axis=1)


def lofi_kick(gain=1.0):
    t = axis(0.45)
    freq = 54 + 70 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / 0.24)
    knock = band(noise(0.45), 200, 2500) * np.exp(-t / 0.008) * 0.25
    return declick(band(np.tanh((body + knock) * 1.6), None, 3500) * gain)


def lofi_snare(gain=1.0):
    t = axis(0.3)
    crack = band(noise(0.3), 500, 6500) * np.exp(-t / 0.075)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.045) * 0.7
    return declick(band(np.tanh((crack + body) * 1.8), None, 7000) * gain)


def lofi_clap(gain=1.0):
    t = axis(0.35)
    out = np.zeros_like(t)
    for k, at in enumerate((0.0, 0.011, 0.023)):
        tt = np.maximum(t - at, 0)
        out += (t >= at) * np.exp(-tt / (0.006 if k < 2 else 0.09))
    return declick(band(noise(0.35) * out, 800, 5500) * gain)


def lofi_hat(gain=1.0, open_=False):
    t = axis(0.25 if open_ else 0.06)
    return declick(band(noise(len(t) / SR), 6000, 12000) * np.exp(-t / (0.09 if open_ else 0.018)) * gain)


def make_launch_bed(grid):
    end = grid["end"]
    length = lt(end + 2)
    rhodes, bass, vib, pad = [], [], [], []
    n = int(length * SR)
    kick_bus, snare_bus, clap_bus, hat_bus = (np.zeros((n, 2)) for _ in range(4))
    kicks = []

    def chord(start, beat):
        return LOFI_PROG[int((beat - start) // 4) % 4]

    def human():
        return rng.uniform(-0.015, 0.015)

    def comp(start, stop, vel=68, stabs=True):
        """The Rhodes: the chord on one, stabs on the and of two and on four."""
        for bar_at in np.arange(start, stop, 4.0):
            root, voicing = chord(start, bar_at)
            # Without stabs the chord holds for the whole bar, so the quiet parts flow instead of stopping and starting.
            hits = [(0, 1.4, vel), (1.5, 0.45, vel - 14), (3, 0.6, vel - 8)] if stabs else [(0, 3.9, vel)]
            for off, dur, v in hits:
                beat = bar_at + off
                if beat >= stop:
                    continue
                for k, note in enumerate(voicing):
                    rhodes.append((swung(beat) + human() + k * 0.01, min(dur, stop - beat), note, v + rng.integers(-6, 6)))

    def pads(start, stop, last=None):
        """A warm pad under the quiet parts, so they carry on between the Rhodes' chords."""
        for bar_at in np.arange(start, stop, 4.0):
            _, voicing = last if last is not None else chord(start, bar_at)
            for note in voicing:
                pad.append((bar_at, min(4.0, stop - bar_at) + 0.3, note - 12, 64))

    def bassline(start, stop):
        for bar_at in np.arange(start, stop, 4.0):
            root, _ = chord(start, bar_at)
            for off, dur, iv in ((0, 1.2, 0), (1.5, 0.35, 7), (2.5, 0.9, 0), (3.5, 0.4, 12)):
                if bar_at + off < stop:
                    bass.append((swung(bar_at + off), dur, root - 12 + iv, 92 if off == 0 else 76))

    def drums(start, stop, clap=False, shaker=False, hats_only=False):
        for k in range(int(round((stop - start) * 4))):
            beat = start + k / 4
            pos = (beat - start) % 4
            t0 = lt(swung(beat))
            if hats_only:
                if pos % 0.5 == 0:
                    place(hat_bus, t0, lofi_hat(0.35 if pos % 1 else 0.2), pan=0.3)
                continue
            if pos in (0, 1.75, 2.5):
                place(kick_bus, t0, lofi_kick(1.0 if pos == 0 else 0.8))
                kicks.append(t0)
            if pos in (1, 3):
                place(snare_bus, t0, lofi_snare(), pan=0.05)
                if clap:
                    place(clap_bus, t0 + 0.004, lofi_clap(), pan=-0.1)
            if pos % 0.5 == 0:
                place(hat_bus, t0, lofi_hat(0.5 if pos % 1 else 0.3), pan=0.3)
            elif shaker or pos == 3.75:
                place(hat_bus, t0, lofi_hat(0.18), pan=-0.3)

    def hook(start, stop):
        for rep in range(int((stop - start) // 16)):
            for b, d, note in LOFI_HOOK:
                beat = start + rep * 16 + b
                if beat + d <= stop:
                    vib.append((swung(beat), d, note, 84))

    sec = grid["sections"]
    # The vertical cut has no "Ein Swipe" line: its break is then empty.
    turn, swipe, brands, brief, logo, cta = (sec[k] for k in ("turn", "swipe", "brands", "brief", "logo", "cta"))
    swipe_line = sec.get("swipeLine", swipe)
    # Opening: the Rhodes held and filtered, hats only in the last bar.
    comp(0, turn, vel=48, stabs=False)
    pads(0, turn)
    if turn >= 2:
        drums(turn - 2, turn)
    # Groove from the turn.
    comp(turn, swipe_line)
    bassline(turn, swipe_line)
    drums(turn, swipe_line)
    # "Ein Swipe": the Rhodes and the vibraphone alone.
    comp(swipe_line, swipe, vel=56, stabs=False)
    pads(swipe_line, swipe)
    vib.extend((swipe_line + b, d, note, 70) for b, d, note in LOFI_HOOK if b + d <= swipe - swipe_line)
    # The bigger groove with the hook.
    comp(swipe, brands)
    bassline(swipe, brands)
    drums(swipe, brands, clap=True, shaker=True)
    hook(swipe + 4, brands)
    # The switch to brands: drums muffled, the Rhodes on.
    comp(brands, brief, vel=60)
    bassline(brands, brief)
    drums(brands, brief)
    # Briefing, Discover, the difference: the full groove again.
    comp(brief, logo)
    bassline(brief, logo)
    drums(brief, logo, clap=True, shaker=True)
    hook(brief + 4, logo)
    # Logo: drums out, one big chord.
    for k, note in enumerate([46, 58, 62, 65, 69, 72]):
        rhodes.append((logo + k * 0.02, 5.5, note, 76))
    bass.append((logo, 5.5, 34, 90))
    pads(logo, cta, last=(46, [58, 62, 65, 69]))
    for k, note in enumerate((72, 77, 81)):
        vib.append((logo + 1 + k * 0.5, 2, note, 74))
    # Call to action: the Rhodes and hats softly, then F major 9 on a bar line, ringing out to the end.
    final = cta + 4 * max(1, int((end - 2.5 - cta) // 4))
    comp(cta, final, vel=50, stabs=False)
    pads(cta, final)
    pads(final, end, last=(41, [57, 60, 64, 69]))
    drums(cta, final, hats_only=True)
    for k, note in enumerate([41, 53, 60, 64, 69, 72]):
        rhodes.append((final + k * 0.02, end - final + 1, note, 56))
    bass.append((final, end - final, 29, 70))

    keys = gm_render(rhodes, 4, length)
    music = (
        level(stereo_band(keys, 90, None), -17)
        + level(stereo_band(gm_render(bass, 33, length), None, 900), -18)
        + level(gm_render(vib, 11, length), -23)
        + level(stereo_band(gm_render(pad, 89, length), 120, 5000), -27)
    )
    music = tape_wobble(music)
    duck = np.ones(n)
    for t0 in kicks:
        i = int(t0 * SR)
        seg = np.arange(min(int(0.3 * SR), n - i)) / SR
        duck[i : i + len(seg)] = np.minimum(duck[i : i + len(seg)], 1 - 0.2 * np.exp(-seg / 0.1))
    music *= duck[:, None]
    music = open_filter(music, 0, lt(turn), 700, 9000)
    drum_bus = level(kick_bus, -15) + level(snare_bus, -20) + level(clap_bus, -25) + level(hat_bus, -27)
    drum_bus = muffle(drum_bus, lt(brands), lt(brief), 1400)
    drum_bus = stereo_band(np.tanh(drum_bus * 1.3), None, 9500)
    mix = reverb(music, seconds=1.6, decay=0.45, wet=0.18) + drum_bus
    place(mix, lt(turn - 2), riser(lt(2)), gain=0.6)
    # The last chord fades into the video's last frame, nothing after it.
    stop, fade = int(lt(end) * SR), int(1.8 * SR)
    mix[stop - fade : stop] *= np.linspace(1, 0, fade)[:, None] ** 1.5
    mix[stop:] = 0
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


# Both beds land at the same loudness, so the two videos play equally loud.
BED_LOUDNESS = "I=-14:TP=-1.5:LRA=11"


def write_mp3(path, x, peak, limit=False):
    with tempfile.TemporaryDirectory() as tmp:
        wav_path = Path(tmp) / "bed.wav"
        write(wav_path, x, peak)
        path.parent.mkdir(parents=True, exist_ok=True)
        # Two-pass loudnorm: measure, then apply one linear gain.
        probe = subprocess.run(
            ["ffmpeg", "-hide_banner", "-i", str(wav_path), "-af", f"loudnorm={BED_LOUDNESS}:print_format=json", "-f", "null", "-"],
            check=True,
            capture_output=True,
            text=True,
        ).stderr
        measured = json.loads(probe[probe.rindex("{") :])
        # loudnorm drops to dynamic compression when one gain would push the peaks past the ceiling; with `limit` the
        # gain is applied as is and a fast limiter catches the transients instead, so quiet passages stay quiet.
        gain = -14 - float(measured["input_i"])
        second = f"volume={gain:.2f}dB,alimiter=limit=0.84:attack=1:release=50:level=0" if limit else (
            f"loudnorm={BED_LOUDNESS}:linear=true:measured_I={measured['input_i']}:measured_TP={measured['input_tp']}"
            f":measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}:offset={measured['target_offset']}"
        )
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_path), "-af", second, "-ar", str(SR), "-codec:a", "libmp3lame", "-b:a", "192k", str(path)],
            check=True,
        )
    print(f"wrote {path.relative_to(ROOT.parent)}")


def sfx_ding():
    """Notification: two bell tones a fifth apart."""
    out = np.zeros(int(0.7 * SR))
    for k, note in enumerate((84, 91)):
        t = axis(0.6)
        bell = sum(a * np.sin(2 * np.pi * midi(note) * r * t) * np.exp(-t / d) for r, a, d in ((1, 1.0, 0.25), (2.01, 0.3, 0.12), (3.0, 0.12, 0.06)))
        i = int(k * 0.08 * SR)
        out[i : i + len(t)] += bell * (0.8 if k else 1.0)
    return declick(out)


def sfx_hit():
    """Impact for something landing hard: a sub drop, a punchy body and a short crack."""
    t = axis(0.9)
    freq = 38 + 90 * np.exp(-t / 0.05)
    sub = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / 0.28)
    crack = band(noise(0.9), 1200, 9000) * np.exp(-t / 0.012) * 0.7
    body = band(noise(0.9), 150, 1200) * np.exp(-t / 0.05) * 0.5
    return declick(np.tanh((sub + crack + body) * 1.5))


def sfx_key(pitch, heavy=False):
    """A quiet mechanical key, the deep, muffled kind (lubed linear switch, foam in the case): the bottom-out rings a
    few case modes (`pitch` sets the lowest) for a few milliseconds, a soft keycap tap on top, and the faint top-out
    of the release ~80 ms later. `heavy` (space, delete) sits lower with a little stabiliser rattle."""
    dur = 0.18
    t = axis(dur)
    out = np.zeros_like(t)
    base = pitch * (0.78 if heavy else 1.0) * rng.uniform(0.97, 1.03)

    def ring(at, f0, ratios, amps, decays, gain):
        th = np.maximum(t - at, 0)
        on = t >= at
        for r, a, d in zip(ratios, amps, decays):
            out[:] += on * gain * a * np.sin(2 * np.pi * f0 * r * th + rng.uniform(0, 2 * np.pi)) * np.exp(-th / d)

    ring(0, base, (1, 2.2, 4.1, 7.1, 11.6), (0.55, 1.0, 0.7, 0.4, 0.2), (0.026, 0.017, 0.011, 0.007, 0.004), 1.0)
    out += band(noise(dur), 1800, 6500) * np.exp(-t / 0.0016) * 0.35
    if heavy:
        ring(0.004, base * 1.9, (1, 2.7), (0.4, 0.25), (0.01, 0.006), 0.6)
    release = 0.07 + rng.uniform(0, 0.03)
    ring(release, base * 2.6, (1, 2.3, 4.4), (0.6, 0.4, 0.2), (0.008, 0.005, 0.003), 0.22)
    return declick(out * np.minimum(1, t / 0.0004))


def sfx_boom():
    """A deep boom for the big moments (the turn, the reveal, the logo): a sine falling from ~150 Hz onto A flat 1 with
    a long tail, saturated so it carries on small speakers, a soft thump of air on top."""
    dur = 1.6
    t = axis(dur)
    freq = 51.9 + 100 * np.exp(-t / 0.05)
    body = np.tanh(np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / 0.55) * 1.8) / np.tanh(1.8)
    thump = band(noise(dur), 80, 900) * np.exp(-t / 0.03) * 0.25
    return declick((body + thump) * np.minimum(1, t / 0.003), ms=40)


def sfx_shimmer(dur=0.9):
    """The transition into a cut: air swelling up through the band with glints of high sparkle in it, peaking at ~0.77 s
    (where the cut goes) and gone right after, the reference's whoosh as the camera dives into a word."""
    t = axis(dur)
    raw = noise(dur)
    out = np.zeros_like(t)
    for k in range(10):
        centre = 900 * 10 ** (k / 9)
        out += band(raw, centre * 0.6, centre * 1.5) * np.exp(-(((t / dur) - (0.15 + 0.75 * k / 9)) ** 2) / 0.02)
    out *= (t / dur) ** 2.2 * np.exp(-np.maximum(t - 0.85 * dur, 0) / 0.03)
    for _ in range(26):
        at = dur * (0.3 + 0.55 * rng.random() ** 0.6)
        gt = axis(0.05)
        grain = np.sin(2 * np.pi * rng.uniform(3500, 9000) * gt) * np.exp(-gt / 0.012) * (at / dur) ** 2 * 0.25
        i = int(at * SR)
        out[i : i + len(grain)] += grain[: len(out) - i]
    return declick(out, ms=6)


def sfx_whip(dur=0.5):
    """The whip into a word: a soft rush of air rising to the cut, quieter and smoother than a whoosh."""
    t = axis(dur)
    raw = noise(dur)
    out = np.zeros_like(t)
    for k in range(10):
        centre = 400 * (10000 / 400) ** (k / 9)
        weight = np.exp(-(((t / dur) - k / 9) ** 2) / 0.02)
        out += band(raw, centre * 0.7, centre * 1.4) * weight
    return declick(out * (t / dur) ** 2 * np.clip((dur - t) / 0.05, 0, 1))


def sfx_slam():
    """A word landing: a short breath of air and a soft, low touch, felt more than heard."""
    rush_len = 0.08
    t = axis(rush_len)
    rush = band(noise(rush_len), 1500, 9000) * (t / rush_len) ** 2 * 0.35
    t2 = axis(0.3)
    freq = 70 + 60 * np.exp(-t2 / 0.03)
    touch = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t2 / 0.08) * 0.8
    return declick(np.concatenate([rush, touch]))


def sfx_select():
    """Text being selected: a soft tick with a short high blip."""
    t = axis(0.12)
    return declick(band(noise(0.12), 2000, 8000) * np.exp(-t / 0.003) * 0.6 + np.sin(2 * np.pi * 1320 * t) * np.exp(-t / 0.03) * 0.4)


def seed(name):
    """Fresh noise per sound, so regenerating one never changes another."""
    global rng
    rng = np.random.default_rng(zlib.crc32(name.encode()))


def main_launch():
    seed("launch-bed.mp3")
    # One gain and a limiter instead of loudnorm's compression, so the quiet opening stays quiet.
    write_mp3(ROOT / "music" / "launch-bed.mp3", make_launch_bed(GRID["launch"]), peak=0.8, limit=True)
    # The 9:16 cut: the same music on its own, shorter grid.
    seed("vertical-bed.mp3")
    write_mp3(ROOT / "music" / "vertical-bed.mp3", make_launch_bed(GRID["vertical"]), peak=0.8, limit=True)
    effects = {
        "key-1": lambda: sfx_key(190),
        "key-2": lambda: sfx_key(215),
        "key-3": lambda: sfx_key(172),
        "key-del": lambda: sfx_key(140, heavy=True),
        "whip": sfx_whip,
        "slam": sfx_slam,
        "select": sfx_select,
        "boom": sfx_boom,
        "shimmer": sfx_shimmer,
    }
    for name, make in effects.items():
        seed(name)
        write(ROOT / "sfx" / f"{name}.wav", make(), peak=0.6)


def main():
    if "--launch" in sys.argv:
        main_launch()
        return
    for ad_id, grid in GRID.get("ads", {}).items():
        seed(f"ad-{ad_id}")
        write_mp3(ROOT / "music" / "ads" / f"{ad_id}.mp3", make_ad_bed(grid, "creator" if ad_id.startswith("AC") else "brand"), peak=0.8)
    if "--ads" in sys.argv:
        return
    for spec in (CREATOR, BRAND):
        seed(spec["file"])
        write_mp3(ROOT / "music" / spec["file"], make_bed(resolve(spec)), peak=0.8)
    effects = {
        "whoosh": lambda: sfx_whoosh(),
        "swipe": lambda: sfx_whoosh(0.26, 600, 9000),
        "pop": lambda: sfx_pop(),
        "pop-low": lambda: sfx_pop(260, 520, 0.12),
        "click": sfx_click,
        "tick": sfx_tick,
        "coin": sfx_coin,
        "like": sfx_like,
        "strike": sfx_strike,
        "stamp": sfx_stamp,
        "lock": sfx_lock,
        "ding": sfx_ding,
        "hit": sfx_hit,
    }
    for name, make in effects.items():
        seed(name)
        write(ROOT / "sfx" / f"{name}.wav", make(), peak=0.6)


if __name__ == "__main__":
    main()
