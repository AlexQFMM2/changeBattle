import {App as CapacitorApp} from "@capacitor/app";
import {SplashScreen} from "@capacitor/splash-screen";
import {StatusBar, Style} from "@capacitor/status-bar";

export async function configureNativeShell(): Promise<void> {
  await SplashScreen.hide().catch(() => undefined);
  await StatusBar.setStyle({style: Style.Dark}).catch(() => undefined);
  await StatusBar.hide().catch(() => undefined);
  await StatusBar.setOverlaysWebView({overlay: true}).catch(() => undefined);
  CapacitorApp.addListener("appStateChange", ({isActive}) => {
    if (isActive) void StatusBar.hide().catch(() => undefined);
  }).catch(() => undefined);
  CapacitorApp.addListener("backButton", ({canGoBack}) => {
    if (canGoBack) window.history.back();
  }).catch(() => undefined);
}
