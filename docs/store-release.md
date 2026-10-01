# Store release (Google Play & App Store)

The store apps are [Capacitor](https://capacitorjs.com) shells (`android/`, `ios/`)
that load the deployed Next.js site. There is no bundled web build: every page,
Server Action and Stripe flow keeps running on the server, so a deploy updates
the apps too, without a new store release. Only native changes (plugins, icons,
permissions, `capacitor.config.ts`) need a new build.

## 1. Before the first build

1. **Production URL.** Deploy the site and note its public HTTPS URL
   (custom domain recommended — it gets baked into the apps).
2. **Separate database.** Production must not share the database with local dev
   (see README) — reviewers and real users will create data there.
3. **Review accounts.** On production, create one brand and one creator account
   with realistic sample data and **2FA off**. Both stores ask for them.
4. **App ID.** `appId` in `capacitor.config.ts` is `app.comtor`.
   Change it now if you want a different one — it can't change after the first
   upload. Update `PRODUCT_BUNDLE_IDENTIFIER` in Xcode and `applicationId` in
   `android/app/build.gradle` to match.

## 2. Sync the native projects

```bash
npm ci
CAP_SERVER_URL=https://your-domain.com npx cap sync
```

Re-run this whenever `capacitor.config.ts`, a Capacitor plugin or
`CAP_SERVER_URL` changes.

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
   - The Pro subscription is not sold in the iOS app (it's hidden when the
     user agent contains `ComtorApp/ios`, see `lib/native-app.ts`).
   - Users can report and block other users, and delete their account in
     Settings → Danger zone.

## What the code already covers

- Account deletion and data export in Settings
- Report/block for user-generated content (chat, profiles)
- Privacy policy, terms, imprint under `/legal/*`
- `/dev-*` review tools return 404 in production builds
- iOS app: no Pro upsell (settings, payments page, FAQ, and the checkout
  action itself refuses)
