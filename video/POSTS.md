# Instagram-Posts

Fünf Posts im Stil der Landingpage, Hochformat 3:4 (1080 × 1440, das Format des Instagram-Rasters). Jeder Post steht
für sich. Reihenfolge als Vorschlag:

| # | Datei | Thema | Zielgruppe |
|---|---|---|---|
| 1 | `post-1.png` | „250 € für ein TikTok?“ (Hook) | Creator |
| 2 | `post-2.png` | „Jeder scrollt an Werbung vorbei.“ (Hook) | Marken |
| 3 | `post-3.png` | „Vom Swipe bis zur Auszahlung.“ (4 Schritte) | Creator |
| 4 | `post-4.png` | „Die Marke zahlt zuerst.“ (Vertrauen) | beide |
| 5 | `post-5.png` | „Pro gratis für die Ersten.“ (100 Creator, 50 Marken) | beide |

```
npm run posts            # alle fünf nach out/posts/ (und das Übersichtsblatt out/posts.png)
node scripts/render-posts.mjs 3   # nur Post 3
```

Wie die Videos brauchen die Renderer einen Chromium; ohne Download: `-- --browser-executable=<Pfad>`.
Die Quellen liegen in `src/posts/` (`kit.tsx` hat Telefonrahmen, Karten und den Farbverlauf der Landingpage,
`Post1.tsx` bis `Post5.tsx` die Posts). Die 3D-Icons in Post 3 sind Microsoft Fluent Emoji (MIT, `public/icons/LICENSE.txt`).

Posts mit Beispieldaten (1, 2, 4) tragen den Hinweis „Beispiel: Marken, Preise und Bewertungen sind erfunden.“, wie die
Landingpage. Im Bild steht bewusst kein „UGC konvertiert am besten“ und keine Zahl freier Plätze.

## Captions

**Post 1**

> 250 € für ein TikTok? 💸
>
> Auf comtor steht das Budget schon auf der Karte. Du wischst durch bezahlte Marken-Deals, die Marke zahlt, bevor du postest, und du behältst 90 %.
>
> Schon jetzt im Web: comtor.app (Link in der Bio)
>
> #ugc #ugccreator #contentcreator #creator #tiktok #reels #nebenverdienst #markenkooperation #comtor

**Post 2**

> Jeder scrollt an Werbung vorbei. Echten Creatorn hören die Leute zu.
>
> Auf comtor postest du einen Deal mit Budget, Plattform und Inhalt. Passende Creator melden sich bei dir, und dein Geld wird zurückgehalten, bis der Post online ist.
>
> 👉 comtor.app (Link in der Bio)
>
> #ugc #ugccontent #ugccreator #influencermarketing #socialmediamarketing #onlinemarketing #startup #comtor

**Post 3**

> Vom Swipe bis zur Auszahlung, in 4 Schritten:
>
> 1️⃣ Wisch durch Marken-Deals. Rechts heißt: Du bist interessiert.
> 2️⃣ Das Budget steht auf der Karte. Schluss mit DMs über Preise.
> 3️⃣ Bezahlt, bevor du postest. Die Marke zahlt zuerst.
> 4️⃣ Du behältst 90 %. Mit Pro sogar 97 %.
>
> Jetzt im Web: comtor.app (Link in der Bio)
>
> #ugc #ugccreator #contentcreator #creatorlife #tiktok #reels #comtor
>
> Icons: Microsoft Fluent Emoji (MIT)

**Post 4**

> Die Marke zahlt zuerst. 🔒
>
> Nimmst du ein Angebot an, zahlt die Marke zuerst. Das Geld wird zurückgehalten, bis dein Post online ist. Die Marke hat 3 Tage Zeit, ihn freizugeben. Antwortet sie nicht, geht die Zahlung trotzdem an dich.
>
> 👉 comtor.app (Link in der Bio)
>
> #ugc #ugccreator #contentcreator #creator #kooperation #comtor

**Post 5**

> Pro gratis für die Ersten. 🎁
>
> Die ersten 100 Creator und die ersten 50 Marken bekommen Pro kostenlos, solange ihr Konto besteht. Mit Pro zahlst du nur 3 % statt 10 % Gebühr. Sonst kostet Pro 10 € im Monat.
>
> Sichere dir deinen Platz: comtor.app (Link in der Bio)
>
> #ugc #ugccreator #contentcreator #startup #marken #creator #comtor
