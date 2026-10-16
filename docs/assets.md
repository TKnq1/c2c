# Assets: where they come from

Every image, icon, sound and font the app ships, and what is known about its source and licence. Keep this
file current when an asset is added or replaced. Open items are marked **to confirm**.

| Asset | Where | Source / licence | Status |
|---|---|---|---|
| Lato (Regular, Bold, Black) | `public/email/fonts/*.ttf`, `next/font/google` in `src/app/layout.tsx` | SIL Open Font License 1.1, text in `public/email/fonts/OFL.txt` | ok |
| Product photos (9) | `public/landing/*.jpg` | Unsplash (see the comment in `src/components/landing/landing-data.ts`), Unsplash License | **to confirm**: add the Unsplash URL and photographer per file below |
| Feature icons (8, 3D emoji style) | `public/landing/icons/*.png`, `public/email/icons/*.png` | not documented. They look like Microsoft Fluent Emoji 3D (MIT licence, notice required) | **to confirm** the source; if Fluent Emoji, add the Microsoft MIT notice to `/legal/licenses`; if another set, record its licence |
| Sounds: swipe (2) | `public/sounds/swipe-left.mp3`, `swipe-right.mp3` | not documented | **to confirm**: record the licence or who made them, otherwise replace them with CC0 sounds |
| Sound: success | `public/sounds/success.mp3` | generated from code (additive synthesis, no samples), see `scripts/make-success-sound.py`. Own work, no third-party licence | ok |
| Logo, splash, email bands and marks | `public/logo.png`, `public/logo-splash.png`, `public/email/band-*.jpg`, `mark-white.png`, `icon.png` | own design (assumed) | **to confirm**: keep the design files and proof of rights |
| UI icons | `react-icons`: Feather (`fi`), Ionicons (`io5`), Simple Icons (`si`) | MIT, MIT, CC0. Brand marks are the owners' trademarks, used to name the platform | ok |
| Open-source packages | `node_modules`, `public/third-party-notices.txt` | see `npm run licenses:generate` | regenerate after dependency changes |
| App Store / Google Play badges | none | Removed until the apps are published. Use the current official badges, linked, at launch | n/a |

## Photo sources (fill in)

| File | Unsplash URL | Photographer |
|---|---|---|
| `bottle-blue.jpg` | | |
| `cream-lemon.jpg` | | |
| `flask-pastel.jpg` | | |
| `glasses-lilac.jpg` | | |
| `leather-tote.jpg` | | |
| `lipstick-red.jpg` | | |
| `matcha.jpg` | | |
| `serum-orange.jpg` | | |
| `watermelon-headphones.jpg` | | |
