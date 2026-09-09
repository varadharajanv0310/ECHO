import { useEffect, useState } from "react";
import { Mark } from "@/components/Mark";
import type { MarkId } from "@/types";
import { copy } from "@/copy";
import { useSequence, useUI } from "@/store";
import "./constellation-hud.css";
import { getSky } from "@/scene/sky-data";

/**
 * Who you are, and one line telling you how to move.
 *
 * Everything else that used to live here - names, the hovered signal readout -
 * now belongs to the sky itself, where it can sit on the thing it describes
 * instead of in a corner pointing at it.
 */
export function ConstellationHud() {
  const phase = useSequence((s) => s.phase);
  const profile = useSequence((s) => s.profile);
  const level = useUI((s) => s.level);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (phase !== "constellation") return;
    const t = setTimeout(() => setSettled(true), 3200);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase !== "constellation") return null;

  const hint =
    level === "cluster"
      ? copy.constellation.hintCluster
      : level === "constellation"
        ? copy.constellation.hintWorld
        : copy.constellation.hintStar;

  return (
    <div className="ch" style={{ zIndex: "var(--z-hud)" }}>
      <div className="ch__self">
        <Mark
          mark={(profile?.mark as MarkId) ?? "star"}
          hue={profile?.hue ?? 276}
          size={22}
        />
        <span className="ch__name">{profile?.name ?? "Unregistered"}</span>
        <span className="ch__worlds">{(profile?.worlds ?? []).join("  ·  ")}</span>
      </div>

      <p className="ch__arrival" data-gone={settled || level !== "cluster"}>
        {copy.constellation.arrival(getSky().constellations.length)}
      </p>

      <p className="ch__hint">{hint}</p>
    </div>
  );
}
