import type {CapacitorConfig} from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "top.changebattle.v2debug",
  appName: "ChangeBattle V2 Debug",
  webDir: "../web/dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
