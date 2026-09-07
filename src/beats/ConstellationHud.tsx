import { useEffect, useRef, useState } from "react";
import { Mark, type MarkId } from "@/components/Mark";
import { copy } from "@/copy";
import { useSequence } from "@/store/sequence";
import "./constellation-hud.css";

/**
 * The DOM half of beat 10.
 *
 * The signal readout follows the cursor rather than docking to a panel,
 * because a signal has no home in this system - reading one is something that
 * happens where you are standing, not somewhere you navigate to.
 */
export function ConstellationHud() {
  const phase = useSequence((s) => s.phase);
  const hovered = useSequence((s) => s.hoveredSignal);
  const profile = useSequence((s) => s.profile);
  const card = useRef<HTMLDivElement>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (phase !== "constellation") return;
    const t = setTimeout(() => setSettled(true), 2600);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el = card.current;
      if (!el) return;
      const pad = 22;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const x = Math.min(e.clientX + pad, window.innerWidth - w - 12);
      const y = Math.min(e.clientY + pad, window.innerHeight - h - 12);
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  if (phase !== "constellation") return null;

  return (
    <div className="ch" style={{ zIndex: "var(--z-hud)" }}>
      {/* Who and where you are. */}
      <div className="ch__self">
        <Mark
          mark={(profile?.mark as MarkId) ?? "star"}
          hue={profile?.hue ?? 276}
          size={22}
        />
        <span className="ch__name">{profile?.name ?? "Unregistered"}</span>
        <span className="ch__worlds">
          {(profile?.worlds ?? []).join("  ·  ")}
        </span>
      </div>

      <p className="ch__arrival" data-gone={settled}>
        {copy.constellation.arrival}
      </p>

      <p className="ch__hint" data-gone={settled && !!hovered}>
        {copy.constellation.hint}
      </p>

      <div ref={card} className="ch__card" data-on={!!hovered} aria-live="polite">
        {hovered && (
          <>
            <span className="ch__card-text">{hovered.text}</span>
            <span className="ch__card-meta">
              <i style={{ background: hovered.hue }} aria-hidden />
              {hovered.world}
              <em>
                {hovered.hops} {copy.constellation.hops}
              </em>
              {hovered.age > 0.72 && (
                <b className="ch__fading">{copy.constellation.fading}</b>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
