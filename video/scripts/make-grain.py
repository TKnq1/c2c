#!/usr/bin/env python3
"""Film grain for the black screens of the ads (src/ads/kit.tsx, Grain).

    video/public/grain/g0.png … g5.png   six dark noise frames, 540x960: mostly black with bright speckles

The ads cycle through them every other frame and blend them (screen) over the black screens, so the grain moves like
on film.
Seeded, so a re-run gives the same files. Needs numpy and Pillow:

    python3 scripts/make-grain.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "grain"
W, H, FRAMES = 540, 960, 6


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(11)
    for i in range(FRAMES):
        fine = rng.normal(0, 1, (H, W))
        # A little blur gives the grain its body: single pixels would read as digital noise.
        coarse = np.asarray(Image.fromarray(((rng.normal(0, 1, (H // 2, W // 2)) * 40) + 128).clip(0, 255).astype("uint8")).resize((W, H), Image.BICUBIC), dtype=float) - 128
        # Centred low and clipped at black: on a black screen only the bright half of the noise can show.
        grain = 14 + fine * 26 + coarse * 0.5
        img = Image.fromarray(grain.clip(0, 255).astype("uint8")).filter(ImageFilter.GaussianBlur(0.6))
        img.save(OUT / f"g{i}.png")
        print(f"wrote public/grain/g{i}.png")


if __name__ == "__main__":
    main()
