import type {CapacitorConfig} from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.changebattle.mobile",
  appName: "ChangeBattle",
  webDir: "dist",
  android: {
    backgroundColor: "#0c160f",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: "#0c160f",
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: "DARK",
      backgroundColor: "#0c160f",
    },
  },
};

export default config;
