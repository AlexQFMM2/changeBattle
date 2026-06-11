import {createRoot} from "react-dom/client";
import {App} from "../../desktop/src/App";
import {installMobileBridge} from "./mobileBridge";
import "./mobile.css";

installMobileBridge();

createRoot(document.getElementById("root")!).render(<App />);
