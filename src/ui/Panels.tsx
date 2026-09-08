import { useSequence } from "@/store/sequence";
import { useUI } from "@/store/ui";
import { useExit } from "@/lib/useExit";
import { ProfilePanel } from "./panels/ProfilePanel";
import { MenuPanel } from "./panels/MenuPanel";
import { CreatePanel } from "./panels/CreatePanel";
import { SearchPanel } from "./panels/SearchPanel";
import { DashboardPanel } from "./panels/DashboardPanel";
import { SkyHud } from "./SkyHud";
import { SkyDock } from "./SkyDock";
import { Rail } from "./Rail";

/** Long enough to read as leaving, short enough not to argue with you. */
const CLOSE_MS = 190;

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
 */
export function Panels() {
  const phase = useSequence((s) => s.phase);
  const panel = useUI((s) => s.panel);
  const { shown, closing } = useExit(panel, CLOSE_MS);

  if (phase !== "constellation") return null;

  return (
    <>
      <Rail />
      <SkyHud />
      <SkyDock />

      {shown && (
        <div
          className="win-layer"
          data-closing={closing}
          style={{ zIndex: "var(--z-window)" }}
        >
          {shown === "profile" && <ProfilePanel />}
          {shown === "menu" && <MenuPanel />}
          {shown === "create" && <CreatePanel />}
          {shown === "search" && <SearchPanel />}
          {shown === "dashboard" && <DashboardPanel />}
        </div>
      )}
    </>
  );
}
