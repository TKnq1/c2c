# comtor videos (Remotion)

Own package, separate from the Next.js app. Storyboard: `STORYBOARD.md`.

```bash
cd video
npm install
npm run studio          # preview in the browser
npm run render:creator  # out/creator.mp4
npm run render:brand    # out/brand.mp4
npm run styleframes     # one still per storyboard scene + contact sheets in out/
npm run render:creator:stems  # out/creator-music.wav + out/creator-sfx.wav, for mixing a voiceover
npm run audio           # regenerate public/music + public/sfx (needs python3, numpy, ffmpeg)
```

Without internet access to remotion.media, point Remotion at a local Chromium: `--browser-executable=<path>`.

## Sound

Music and UI sounds are synthesised by `scripts/make-audio.py` (no samples, no third-party licence). The creator
video runs on a 120 BPM grid: one beat is 15 frames, every scene lasts whole beats, so cuts land on the beat. When
scene durations change in `src/creator/CreatorVideo.tsx`, update the `BEAT_*` markers in the script and rerun
`npm run audio`. `CreatorVideo` takes `music` and `sfx` props to render either layer on its own.
