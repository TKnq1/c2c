# comtor videos (Remotion)

Own package, separate from the Next.js app. Storyboard: `STORYBOARD.md`.

```bash
cd video
npm install
npm run studio          # preview in the browser
npm run render:creator  # out/creator.mp4
npm run render:brand    # out/brand.mp4
npm run styleframes     # one still per storyboard scene + contact sheets in out/
```

Without internet access to remotion.media, point Remotion at a local Chromium: `--browser-executable=<path>`.
