# Store release (Google Play & App Store)

The store apps are [Capacitor](https://capacitorjs.com) shells (`android/`, `ios/`)
that load the deployed Next.js site. There is no bundled web build: every page,
Server Action and Stripe flow keeps running on the server, so a deploy updates
the apps too, without a new store release. Only native changes (plugins, icons,
permissions, `capacitor.config.ts`) need a new build.

## 1. Before the first build

1. **Production URL.** Deploy the site and note its public HTTPS URL
   (custom domain recommended — it gets baked into the apps). Use the same
   origin for `CAP_SERVER_URL` and `NEXT_PUBLIC_SITE_URL`: Stripe's return
   URLs are built from the latter and only stay in the app on that origin.
2. **Migrations first.** Run `npm run db:deploy` against production *before*
   deploying code from this branch. The new columns and tables are additive,
   so the old code keeps working on the new schema, but the new code fails
   on sign-in without them.
3. **Separate database.** Production must not share the database with local dev
   (see README) — reviewers and real users will create data there.
4. **Review accounts.** On production, create one brand and one creator account
   with realistic sample data and **2FA off**. Both stores ask for them.
5. **App ID.** `appId` in `capacitor.config.ts` is `app.comtor`.
   Change it now if you want a different one — it can't change after the first
   upload. Update `PRODUCT_BUNDLE_IDENTIFIER` in Xcode and `applicationId` in
   `android/app/build.gradle` to match.

## 2. Sync the native projects

```bash
npm ci
CAP_RELEASE=1 CAP_SERVER_URL=https://your-domain.com npx cap sync
```

`CAP_RELEASE=1` makes the sync fail when `CAP_SERVER_URL` is missing, instead of
building an app that loads plain-http localhost.

Re-run this whenever `capacitor.config.ts`, a Capacitor plugin or
`CAP_SERVER_URL` changes. It also writes the server URL into the offline page
(`capacitor/www`, shown when the site can't be reached) through the
`capacitor:copy:before` hook.

How the shell behaves:

- Links to other sites open in the system browser. Stripe (`*.stripe.com`) is
  the exception, so Checkout returns to the app. Payment methods that redirect
  to a third party (PayPal, Klarna, bank redirects) still leave the app for
  that step; card payments and 3D Secure stay inside.
- Android's back button steps back through pages and, on the first page,
  sends the app to the background (`components/native-back-button.tsx`).
- iOS asks for camera/photo access only when someone picks a photo (texts in
  `ios/App/App/Info.plist`).

## 3. Push notifications

| | Setup | Server env |
|---|---|---|
| Android | Firebase project → add Android app with the app ID → download `google-services.json` into `android/app/`. Project settings → Service accounts → generate private key. | `FIREBASE_SERVICE_ACCOUNT` (JSON, one line) |
| iOS | Apple Developer → Keys → new key with *Apple Push Notifications service* → download the `.p8`. In Xcode, *Signing & Capabilities* shows *Push Notifications* (entitlement is already in `ios/App/App/App.entitlements`). | `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY`, `APNS_PRODUCTION=true` for TestFlight/App Store |

Browsers keep using Web Push (VAPID). The app decides per device which channel
to use; tokens live in the `NativePushToken` table.

## 4. Android → Google Play

1. `npm run cap:android` opens Android Studio.
2. Replace the launcher icons (`android/app/src/main/res/mipmap-*`) — e.g. with
   Android Studio's *Image Asset* tool from a 1024×1024 PNG.
3. *Build → Generate Signed App Bundle* → create an upload keystore
   (**back it up** — losing it means you can't ship updates).
4. Play Console ($25 one-time): create the app, upload the `.aab`, fill in
   *Data safety*, content rating, target audience, privacy policy URL
   (`/legal/privacy`), and the review accounts.
5. New personal developer accounts have to run a closed test (currently
   12 testers for 14 days) before production access is granted.

## 5. iOS → App Store

1. Apple Developer Program ($99/year), a Mac with Xcode.
2. `npm run cap:ios` opens Xcode. Select the *App* target → *Signing &
   Capabilities* → pick your team.
3. Replace the app icon in `ios/App/App/Assets.xcassets/AppIcon.appiconset`
   (1024×1024, no transparency).
4. *Product → Archive* → *Distribute App* → App Store Connect.
5. App Store Connect: screenshots (6.9" and 6.5" iPhone at minimum), description,
   *App Privacy* answers, privacy policy URL, support URL, review accounts.
6. Review notes worth including:
   - Brand-to-creator payments pay for real-world services (content creation
     and posting) between users, processed with Stripe.
   - The Pro subscription is not sold in the app (it's hidden when the user
     agent contains `ComtorApp/`, see `canSellProSubscription` in
     `lib/native-app-server.ts`).
   - Users can report and block other users, and delete their account in
     Settings → Danger zone.

## What the code already covers

- Account deletion and data export in Settings
- Suspended accounts (`/admin/users`) can't sign in and disappear from
  Discover, the Feed and new-request notifications
- Report/block for user-generated content (chat, profiles)
- Privacy policy, terms, imprint under `/legal/*`
- `/dev-*` review tools return 404 in production builds
- No "Add to Home Screen" banner inside the store apps
- Both store apps: no Pro upsell (settings, payments page, FAQ, and the
  checkout action itself refuses). Apple and Google both require their own
  billing for digital subscriptions; Pro stays on sale on the website.
