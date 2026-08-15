import type { ExpoConfig } from "expo/config";

const bundleId = process.env.LOOPFORGE_BUNDLE_ID?.trim() || "com.loopforge.mobile";
const scheme = process.env.LOOPFORGE_SCHEME?.trim() || "loopforge";

const config: ExpoConfig = {
  name: "LoopForge",
  slug: "loopforge-mobile",
  version: "2.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: bundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ["audio"],
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: bundleId,
    permissions: [
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.RECORD_AUDIO",
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
      "android.permission.FOREGROUND_SERVICE_MICROPHONE",
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: false,
        data: [{ scheme }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "react-native-audio-api",
      {
        iosBackgroundMode: true,
        iosMicrophonePermission:
          "LoopForge benötigt Mikrofonzugriff für Loop-Aufnahmen und Overdubs.",
        androidPermissions: [
          "android.permission.POST_NOTIFICATIONS",
          "android.permission.MODIFY_AUDIO_SETTINGS",
          "android.permission.RECORD_AUDIO",
          "android.permission.FOREGROUND_SERVICE",
          "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
          "android.permission.FOREGROUND_SERVICE_MICROPHONE",
        ],
        androidForegroundService: true,
        androidFSTypes: ["mediaPlayback", "microphone"],
      },
    ],
    [
      "expo-audio",
      {
        microphonePermission:
          "LoopForge benötigt Mikrofonzugriff für Loop-Aufnahmen und Overdubs.",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
