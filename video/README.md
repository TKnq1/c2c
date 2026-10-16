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
npm run launch:audio    # regenerate its music and sounds (needs python3, numpy, ffmpeg, fluidsynth, mido)
npm run launch:render   # with sound, lossless frames, CRF 14, mastered to -14 LUFS: out/launch-final.mp4
```

The scenes are drawn in frames of 30 per second, but the video runs at 60: `LaunchVideo` plays every drawn frame in
two steps (`SceneSpeed`, `STEPS_PER_FRAME` in `src/launch/scenes.tsx`), so the camera, the springs and the hand-overs
get their in-between positions. Timings in the scenes stay in drawn frames.

The music is pop lofi built for the cut by `scripts/make-audio.py --launch`: 90 BPM (a beat is 20 drawn frames),
F major. A Rhodes with a light tape wobble, a warm bass, swung lofi drums, a vibraphone, a marimba, a second electric
piano and a pad, all from the FluidR3 GM soundfont (MIT) played through fluidsynth (`apt install fluidsynth
fluid-soundfont-gm`, `pip install mido`), the drums synthesised. Its parts follow the scenes: filtered and held under
the opening lines with a few notes of the hook far off; a light groove from the turn (side stick, the bass on the
roots) that fills out halfway; a break under "Ein Swipe"; the big groove with the vibraphone hook for the swipe,
arpeggios joining for the deal, a crash on the payout; muffled for the switch to brands; for the brands a second
progression (vi-IV-I-V instead of the royal road IV-V-iii-vi) with its own marimba melody; half time under the
difference; one big chord for the logo; and the hook once more on the marimba under the call to action before a last
chord on the bar line that rings out into the last frame. Snare runs, risers and a soft crash lead into the big
moments.

The effects stay minimal under the music: a quiet, muffled mechanical keyboard, a soft low boom on the big moments
(turn, reveal, payout, brands, logo), a soft shimmer into every dive, a low, airy sweep under every pan, a slam
under words, a select tick; `SfxGain` (`src/audio.tsx`) sets their overall level. They are synthesised
(`scripts/make-audio.py --launch`: `public/sfx/key-*.wav`, `boom`, `shimmer`, `sweep`, `slam`, `select`).

The scenes hand over without a hard cut (`exit` in `src/launch/scenes.tsx`): a `dive` pushes into a point and the
next scene lands out of the blur around its `focus`, a `pan` slides both scenes edge to edge, motion-blurred. The key
presses (Annehmen, Beitragslink einreichen, Anfrage posten, Einladen) get a macro close-up (`Macro` in `kit.tsx`).

Every scene lasts whole beats (`beats` in `src/launch/scenes.tsx`, halves allowed), so every cut lands on a beat;
`scripts/grid.ts` hands the starts to the music. Change a scene's beats, then run `npm run launch:audio`.
`LaunchVideo` takes `music` and `sfx` props to render either layer on its own. The creators on Discover take a
portrait each (`photo` in `CREATORS`, `src/launch/app-screens.tsx`, a file in `public/`); without one the tile shows
the initials.
