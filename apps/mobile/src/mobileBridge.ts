import {configureNativeShell} from "./mobileNativeShell";
import {createMobileRuntime} from "./mobileRuntime";

export function installMobileBridge(): void {
  if (window.changeBattle) return;
  void configureNativeShell();
  window.changeBattle = createMobileRuntime();
}
