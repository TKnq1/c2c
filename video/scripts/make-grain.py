#!/usr/bin/env python3
"""Film grain for the black screens of the ads (src/ads/kit.tsx, Grain).

    video/public/grain/dark.png   one static noise frame, 1080x1920: black with fine, faint speckles

Like the grain of the app's emails (public/email/band-dark.jpg): fine, quiet and standing still. The ads lay it over
the black screens (screen blend), so it never moves. Seeded, so a re-run gives the same file. Needs numpy and Pillow:

    python3 scripts/make-grain.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "grain"
W, H = 1080, 1920


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("g*.png"):
        old.unlink()
    rng = np.random.default_rng(11)
    # Centred low and clipped at black: on a black screen only the bright half of the noise shows.
    grain = np.clip(rng.normal(5, 4.5, (H, W)), 0, 255)
    img = Image.fromarray(grain.astype("uint8")).filter(ImageFilter.GaussianBlur(0.45))
    img.save(OUT / "dark.png")
    print("wrote public/grain/dark.png")


if __name__ == "__main__":
    main()
