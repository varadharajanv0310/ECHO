import { useSequence } from "@/store/sequence";
import { useUI } from "@/store/ui";
import { ProfilePanel } from "./panels/ProfilePanel";
import { MenuPanel } from "./panels/MenuPanel";
import { CreatePanel } from "./panels/CreatePanel";
import { SearchPanel } from "./panels/SearchPanel";
import { DashboardPanel } from "./panels/DashboardPanel";
import { SkyHud } from "./SkyHud";
import { SkyDock } from "./SkyDock";
import { Rail } from "./Rail";

/**
 * Everything that lives over the sky.
 *
 * Only mounted at the sky: the rail has nowhere to take you during the entry
 * sequence, and a window over the road would be a different product.
 */
export function Panels() {
  const phase = useSequence((s) => s.phase);
  const panel = useUI((s) => s.panel);

  if (phase !== "constellation") return null;

  return (
    <>
      <Rail />
      <SkyHud />
      <SkyDock />
      {panel === "profile" && <ProfilePanel />}
      {panel === "menu" && <MenuPanel />}
      {panel === "create" && <CreatePanel />}
      {panel === "search" && <SearchPanel />}
      {panel === "dashboard" && <DashboardPanel />}
    </>
  );
}
