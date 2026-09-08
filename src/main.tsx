import { createRoot } from "react-dom/client";

// Self-hosted. wdth.css carries both the weight and the width axis, which the
// wordmark animates.
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/geist-mono";

import "./index.css";
import App from "./App";

// Last on purpose. Every rule in here overrides one from a component
// stylesheet at the same specificity, so it has to be evaluated after all of
// them - which means importing it after the tree that pulls them in.
import "./ui/handheld.css";

// Deliberately not wrapped in StrictMode. Double-invoked effects would create
// and tear down WebGL contexts and rAF loops twice, which makes the trail
// accumulation in the particle field look different in dev than in the build -
// and dev is where this gets judged by eye.
createRoot(document.getElementById("root")!).render(<App />);
