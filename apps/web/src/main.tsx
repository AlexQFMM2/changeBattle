import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {App} from "./App";
import "./styles.css";

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
  };
};

function runtimeForEnvironment(): "web" | "mobile" {
  const capacitor = typeof window === "undefined" ? undefined : (window as CapacitorWindow).Capacitor;
  if (capacitor?.isNativePlatform?.() || capacitor?.getPlatform?.() === "android") return "mobile";
  return "web";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App runtime={runtimeForEnvironment()} />
  </StrictMode>,
);
