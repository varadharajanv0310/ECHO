import { createRoot } from "react-dom/client";

// Self-hosted. wdth.css carries both the weight and the width axis, which the
// wordmark animates.
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/geist-mono";

import "./index.css";
import App from "./App";

// Deliberately not wrapped in StrictMode. Double-invoked effects would create
// and tear down WebGL contexts and rAF loops twice, which makes the trail
// accumulation in the particle field look different in dev than in the build -
// and dev is where this gets judged by eye.
createRoot(document.getElementById("root")!).render(<App />);
