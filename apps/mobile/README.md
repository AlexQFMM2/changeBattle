# ChangeBattle V2 Android Debug App

This package wraps the existing Web app with Capacitor for the first Android-only validation build.

## Build Flow

```bash
pnpm --filter @changebattle-v2/mobile cap:add:android
pnpm --filter @changebattle-v2/mobile android:debug
```

`android:debug` builds `apps/web/dist`, syncs it into Capacitor, and runs the Android Gradle wrapper.

## Windows Builder Notes

Use the existing Android builder machine first. Recommended environment:

```cmd
set ANDROID_HOME=G:\SDK
set ANDROID_SDK_ROOT=G:\SDK
set JAVA_HOME=D:\jdk-21.0.11
set PATH=D:\jdk-21.0.11\bin;G:\SDK\platform-tools;%PATH%
```

The first milestone is a debug APK only. Release signing, Play/App store packaging, and iOS are out of scope.

## Current Result

Windows builder smoke passed on 2026-07-16:

```text
D:\changeBattleV2-mobile\src\apps\mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

The generated debug APK is about 6.3 MB. The bundled Capacitor public assets are only the compiled Web entry files; images, audio, and Showdown sprites continue to load from the ChangeBattle CDN.

The Android runtime is detected as `mobile` and uses the server Battle API. The default debug endpoint is:

```text
https://api.65h26i.top/changebattle/battle
```

Set `VITE_CHANGEBATTLE_MOBILE_BATTLE_SERVICE_URL` at build time to point the APK at another Battle API, for example `http://10.0.2.2:5191` for an Android emulator that talks to a BattleService running on the Windows host.

The app is locked to landscape and uses `adjustNothing` for the soft keyboard.
