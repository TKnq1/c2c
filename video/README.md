# comtor videos (Remotion)

Own package, separate from the Next.js app. Storyboard: `STORYBOARD.md`.

```bash
cd video
npm install
npm run studio          # preview in the browser
npm run render:creator  # out/creator.mp4, mastered to -14 LUFS as out/creator-final.mp4
npm run render:brand    # out/brand.mp4, out/brand-final.mp4
npm run styleframes     # one still per storyboard scene + contact sheets in out/
npm run render:creator:stems  # out/creator-voice.wav, -music.wav, -sfx.wav: each layer on its own
npm run render:brand:stems    # the same for the brand video
npm run voice           # cut voice/source/*.mp3 into lines, refit the scenes, regenerate the music
npm run audio           # regenerate public/music + public/sfx (needs python3, numpy, ffmpeg)
```

Without internet access to remotion.media, point Remotion at a local Chromium: `--browser-executable=<path>`.

## Sound

Music and UI sounds are synthesised by `scripts/make-audio.py` (no samples, no third-party licence). Both videos
run on a 120 BPM grid: one beat is 15 frames, every scene lasts whole beats, so cuts land on the beat. When scene
durations change in `src/creator/CreatorVideo.tsx` or `src/brand/BrandVideo.tsx`, update `CREATOR` / `BRAND` in
the script and rerun `npm run audio`. Both beds are normalised to the same loudness. `CreatorVideo` and
`BrandVideo` take `music` and `sfx` props to render either layer on its own.

## Voiceover

The ElevenLabs recordings live in `voice/source/creator.mp3` and `brand.mp3`, every line of `VOICEOVER.md` in order.
`npm run voice` cuts them into one file per scene (`public/vo/`, found by the pauses, see
`scripts/make-voiceover.py`), and each video then fits its scenes to the lines (`fitToVoice` in `src/series.tsx`):
a scene gets as long as its line needs, in whole beats, and plays its animation up to 1.5x faster when that is shorter
than drawn. The music is rebuilt on that grid and ducks under the voice. Replace a recording and run `npm run voice`,
then render.

## Instagram posts

Five static posts in the landing page style, 1080 x 1440 (3:4). `npm run posts` renders them to `out/posts/`; sources in
`src/posts/`, captions and posting order in `POSTS.md`.
