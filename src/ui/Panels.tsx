import { lazy, Suspense, useEffect } from "react";
import { useSequence, useUI } from "@/store";
import { useExit } from "@/lib/useExit";
import { SkyHud } from "./SkyHud";
import { SkyDock } from "./SkyDock";
import { Rail } from "./Rail";
import { Tour } from "./Tour";
import { SkyNav } from "./SkyNav";

/**
 * The six things that open over the sky are code-split.
 *
 * None of them is on the path to first paint: you scroll through the whole
 * entry sequence before a rail even exists, and most sessions never open all
 * six. Loading them with the sky means paying for a profile editor, a search
 * index and a dashboard before anybody has seen a star.
 *
 * They are prefetched on idle once you arrive, so the split costs a network
 * round trip that has already happened by the time anything is clicked - the
 * saving is in the critical path, not in the total.
 */
const ProfileWindow = lazy(() =>
  import("./ProfileWindow").then((m) => ({ default: m.ProfileWindow })),
);
const MessageWindow = lazy(() =>
  import("./MessageWindow").then((m) => ({ default: m.MessageWindow })),
);
const MenuPanel = lazy(() =>
  import("./panels/MenuPanel").then((m) => ({ default: m.MenuPanel })),
);
const CreatePanel = lazy(() =>
  import("./panels/CreatePanel").then((m) => ({ default: m.CreatePanel })),
);
const SearchPanel = lazy(() =>
  import("./panels/SearchPanel").then((m) => ({ default: m.SearchPanel })),
);
const DashboardPanel = lazy(() =>
  import("./panels/DashboardPanel").then((m) => ({ default: m.DashboardPanel })),
);

/** Long enough to read as leaving, short enough not to argue with you. */
const CLOSE_MS = 190;

/**
 * Pull the split chunks down while the browser has nothing better to do.
 *
 * `requestIdleCallback` where it exists, a timeout where it does not, and only
 * once you have actually arrived at the sky - prefetching during the entry
 * sequence would compete with the thing being animated.
 */
function usePrefetchPanels(ready: boolean) {
  useEffect(() => {
    if (!ready) return;

    const pull = () => {
      void import("./ProfileWindow");
      void import("./panels/MenuPanel");
      void import("./panels/CreatePanel");
      void import("./panels/SearchPanel");
      void import("./panels/DashboardPanel");
      void import("./MessageWindow");
    };

    const idle = window.requestIdleCallback;
    if (typeof idle === "function") {
      const id = idle(pull, { timeout: 3000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(pull, 1200);
    return () => window.clearTimeout(t);
  }, [ready]);
}

/**
 * Everything that lives over the sky.
 *
 * Only mounted at the sky: the rail has nowhere to take you during the entry
 * sequence, and a window over the road would be a different product.
 *
 * The open panel is held for a moment after it is dismissed so it can animate
 * away. Switching directly from one panel to another swaps immediately, since
 * both are the same window and animating a handover between them would just be
 * a stutter in the middle of a decision the person already made.
 *
 * A profile and a panel are two different layers, so the same handover would
 * otherwise cross-fade two full-size windows on top of each other. The rule is
 * the same one: whichever layer is on its way out is dropped the instant the
 * other is on its way in, and only animates away when nothing is replacing it.
 */
export function Panels() {
  const phase = useSequence((s) => s.phase);
  const panel = useUI((s) => s.panel);
  const profileOf = useUI((s) => s.profileOf);
  const messaging = useUI((s) => s.messaging);
  const { shown, closing } = useExit(panel, CLOSE_MS);
  const visiting = useExit(typeof profileOf === "number" ? profileOf : null, CLOSE_MS);
  const talking = useExit(messaging, CLOSE_MS);

  const atSky = phase === "constellation";
  usePrefetchPanels(atSky);

  if (!atSky) return null;

  return (
    <>
      <Rail />
      <SkyHud />
      <SkyDock />
      <SkyNav />
      <Tour />

      {/* One boundary for all six. A window is the whole surface, so there is
          never more than one of them resolving at a time, and a fallback that
          draws nothing is better than a spinner for something that is almost
          always already in memory. */}
      <Suspense fallback={null}>
        {visiting.shown !== null && !(visiting.closing && panel) && (
          <div
            className="win-layer"
            data-closing={visiting.closing}
            style={{ zIndex: "var(--z-window)" }}
          >
            <ProfileWindow star={visiting.shown} />
          </div>
        )}

        {talking.shown !== null && (
          <div
            className="win-layer"
            data-closing={talking.closing}
            style={{ zIndex: "var(--z-window)" }}
          >
            <MessageWindow star={talking.shown} />
          </div>
        )}

        {shown && !(closing && profileOf !== null) && (
          <div
            className="win-layer"
            data-closing={closing}
            style={{ zIndex: "var(--z-window)" }}
          >
            {shown === "profile" && <ProfileWindow star={null} />}
            {shown === "menu" && <MenuPanel />}
            {shown === "create" && <CreatePanel />}
            {shown === "search" && <SearchPanel />}
            {shown === "dashboard" && <DashboardPanel />}
          </div>
        )}
      </Suspense>
    </>
  );
}
