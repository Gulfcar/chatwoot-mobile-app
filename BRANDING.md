# GC Support branding

- App display name: `GC Support`
- Android application ID: `com.gulfcar.support`
- iOS bundle identifier: `com.gulfcar.support`
- Expo slug: `gc-support`
- URL scheme: `gcsupport`
- Chatwoot base URL: `https://support.gulfcar.com.sa`
- Primary app background: `#011E4F` (deep navy)
- Logo treatment: approved Gulf Car gold emblem with the original Arabic/English wordmark proportions; no `Support` text is added to the logo artwork.

## Approved asset usage

The final native assets are committed on this branch:

- `assets/icon.png`: gold Gulf Car emblem on the deep-navy background for launcher/store icon usage.
- `assets/adaptive-icon.png`: transparent gold emblem foreground; Android supplies `#011E4F` as the adaptive-icon background.
- `assets/splash.png`: transparent full Gulf Car logo (emblem + Arabic + English wordmark) on the `#011E4F` splash background.

## Deep links

The mobile config derives the iOS associated domain and Android HTTPS intent-filter host from `EXPO_PUBLIC_CHATWOOT_BASE_URL`, defaulting to `support.gulfcar.com.sa`.

The verification files already served by `support.gulfcar.com.sa` are **not valid for GC Support yet**. They currently identify the old Chatwoot app (`com.chatwoot.app`) and must be replaced before verified universal/app links are considered configured.

Required release values:

- iOS `/.well-known/apple-app-site-association`: use `<APPLE_TEAM_ID>.com.gulfcar.support` for the GC Support app ID.
- Android `/.well-known/assetlinks.json`: use package `com.gulfcar.support` and the SHA-256 fingerprint of the final GC Support Android signing certificate.

The custom scheme `gcsupport://` remains available independently of domain verification.

## Release setup still pending

- Create the Firebase Android app using `com.gulfcar.support` and add `google-services.json` locally/secrets as appropriate.
- Create the Firebase iOS app using `com.gulfcar.support` and add `GoogleService-Info.plist` locally/secrets as appropriate.
- Replace the existing server-side iOS/Android app-link verification files with the GC Support identities above.
- Link the project to the Gulf Car Expo/EAS account and set the final EAS project ID.
