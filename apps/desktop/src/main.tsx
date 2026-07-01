import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {App} from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App runtime="desktop" />
  </StrictMode>,
);

const bootSplash = document.getElementById("boot-splash");
if (bootSplash) {
  requestAnimationFrame(() => {
    bootSplash.classList.add("leaving");
    window.setTimeout(() => bootSplash.remove(), 220);
  });
}
