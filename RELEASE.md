# Android release build

## Build the release APK

From the project root, run:

```bash
npm run android:release
```

Or manually:

```bash
cd android
gradlew.bat assembleRelease
```

The first build can take 5–10 minutes. Later builds are faster.

## Where is the APK?

After a successful build, the installable file is:

- **Path:** `android/app/build/outputs/apk/release/app-release.apk`

## Install on your phone

1. Copy `app-release.apk` to your Android phone (USB, cloud, or email).
2. On the phone, open the APK file.
3. If prompted, allow installation from unknown sources (Settings → Security).
4. Tap **Install** and open the app.

## Signing (optional, for Play Store)

This build uses the **debug keystore**, so it is fine for testing on your own device. For Google Play or production, create a release keystore and configure `android/app/build.gradle` with `signingConfigs.release`. See [React Native: Signed APK](https://reactnative.dev/docs/signed-apk-android).
