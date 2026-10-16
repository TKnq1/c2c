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

## Instagram: pinned posts

Two carousels to pin on the profile, one for creators and one for brands, 1080 x 1440 (3:4). The covers are short
animations with sound; `npm run posts` renders every slide to `out/pinned/` (MP4 for animated slides, mastered to
-14 LUFS, PNG for the others). Sources in `src/pinned/`, shared pieces of the app's UI in `src/posts/kit.tsx`.

## Instagram: Stories

13 stories, 1080 x 1920 (9:16): two short videos with sound and eleven images. `npm run stories` renders them to
`out/stories/` (MP4 mastered to -14 LUFS, PNG for the stills). Sources in `src/stories/`, which stories to post when
and the sticker texts in `STORIES.md`.

## Launch video (16:9)

A launch video for the website, YouTube and LinkedIn, 1920 x 1080, modelled on the cut of a SaaS launch video: typed
lines, statements set large, the web app's desktop view in 3D, the swipe on an iPhone, three lights (white, grey
mist, black), thin lines in the background now and then. Sources in `src/launch/`: `kit.tsx` building blocks
(springs, fly-ins, typing rhythm, pointer arcs, background arcs, app frames), `parts.tsx` shared pieces (typed lines,
slamming words, key sounds), `screens.tsx` and `app-screens.tsx` the app's screens (offer card, chat, request form
with its choice sheets, Discover), `phone.tsx` the iPhone and the Feed as the app draws it on a phone,
`scenes-creator.tsx` and `scenes-brand.tsx` the scenes, `scenes.tsx` their order and lengths.

```bash
npm run launch:stills   # one still per scene (its keyframe) to out/launch/ and a contact sheet out/launch-stills.png
npm run launch:raw      # the picture only: out/launch-raw.mp4
npm run launch:audio    # regenerate its music and sounds (needs python3, numpy, scipy, ffmpeg, fluidsynth, mido)
npm run launch:render   # with sound, lossless frames, CRF 14, mastered to -14 LUFS: out/launch-final.mp4
```

The music is pop lofi built for the cut by `scripts/make-audio.py --launch`: 90 BPM (a beat is 20 frames), F major,
the royal road IV-V-iii-vi (B flat maj9, C9, A minor 7, D minor 9). A Rhodes comping with a tape wobble, a warm bass,
swung lofi drums (round kick, dusty snare, a clap in the bigger grooves, swung hats), a vibraphone hook in the later
grooves, vinyl crackle underneath, and gang shouts ("Hey!" on the drop, "Ho!" as "Ausgezahlt." whips in, "Hey!" on the
big "Und" for brands) formant-synthesised from a glottal pulse through five gliding resonators, five voices wide. The
Rhodes, bass and vibraphone are the FluidR3 GM soundfont (MIT) played through fluidsynth
(`apt install fluidsynth fluid-soundfont-gm`, `pip install mido`). Quiet and filtered under the opening lines, the
groove from the turn, breaks under "Ein Swipe" and the switch to brands, drums out for the logo, soft again under the
call to action.

The effects stay minimal under the music: a quiet, muffled mechanical keyboard, a soft low boom on the big moments
(turn, reveal, payout, brands, logo), a shimmering whoosh into every zoom cut, a slam under words, a select tick;
`SfxGain` (`src/audio.tsx`) sets their overall level. They are synthesised (`scripts/make-audio.py --launch`:
`public/sfx/key-*.wav`, `boom`, `shimmer`, `slam`, `select`).

Every scene lasts whole beats (`beats` in `src/launch/scenes.tsx`, halves allowed), so every cut lands on a beat;
`scripts/grid.ts` hands the starts to the music. Change a scene's beats, then run `npm run launch:audio`.
`LaunchVideo` takes `music` and `sfx` props to render either layer on its own. The creators on Discover take a
portrait each (`photo` in `CREATORS`, `src/launch/app-screens.tsx`, a file in `public/`); without one the tile shows
the initials.
