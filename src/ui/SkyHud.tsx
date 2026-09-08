import { useEffect, useRef, useState } from "react";
import { skyLabels, type SkyLabel } from "@/scene/sky-labels";
import { getSky } from "@/scene/sky-data";
import { useUI } from "@/store/ui";
import "./sky-hud.css";

/**
 * Names in the sky, and where you are in it.
 *
 * The labels are written straight to the DOM from a frame loop rather than
 * through React state - they move every frame with the camera, and putting a
 * hundred position updates a second through a render is how you turn a smooth
 * sky into a slideshow.
 *
 * The crumbs are keyed by what they name, so going somewhere new replaces the
 * node and its arrival animation plays again. That is the whole effect, and it
 * costs one attribute.
 */
export function SkyHud() {
  const level = useUI((s) => s.level);
  const constellation = useUI((s) => s.constellation);
  const star = useUI((s) => s.star);
  const back = useUI((s) => s.back);
  const layer = useRef<HTMLDivElement>(null);
  const pool = useRef<HTMLButtonElement[]>([]);
  const [sky] = useState(getSky);

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const host = layer.current;
      if (!host) return;

      const list: SkyLabel[] = skyLabels.list;

      // Grow a pool of nodes once and reuse them; creating and destroying DOM
      // every frame is the other way to make this stutter.
      while (pool.current.length < list.length) {
        const b = document.createElement("button");
        b.className = "skl";
        host.appendChild(b);
        pool.current.push(b);
      }

      pool.current.forEach((el, i) => {
        const l = list[i];
        if (!l) {
          el.style.display = "none";
          return;
        }
        el.style.display = "";
        el.style.transform = `translate3d(${l.x}px, ${l.y}px, 0)`;
        el.dataset.kind = String(l.kind);
        el.dataset.hovered = String(l.hovered);
        if (el.textContent !== l.text) el.textContent = l.text;
      });
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const world = constellation !== null ? sky.constellations[constellation] : null;
  const person = star !== null ? sky.stars[star] : null;

  return (
    <>
      <div ref={layer} className="skl-layer" style={{ zIndex: "var(--z-hud)" }} />

      <nav
        className="skb"
        style={{ zIndex: "var(--z-hud)" }}
        aria-label="Where you are"
      >
        <button
          className="skb__crumb"
          data-on={level === "cluster"}
          onClick={() => {
            if (level !== "cluster") {
              back();
              if (level === "star") back();
            }
          }}
        >
          Cluster
        </button>

        {world && (
          <span className="skb__group" key={`w${world.id}`}>
            <span className="skb__sep" aria-hidden>
              /
            </span>
            <button
              className="skb__crumb"
              data-on={level === "constellation"}
              onClick={() => level === "star" && back()}
            >
              {world.world}
            </button>
          </span>
        )}

        {person && (
          <span className="skb__group" key={`p${person.id}`}>
            <span className="skb__sep" aria-hidden>
              /
            </span>
            <span className="skb__crumb" data-on="true">
              {person.name}
            </span>
          </span>
        )}
      </nav>

      {level !== "cluster" && (
        <button
          className="skb__back"
          style={{ zIndex: "var(--z-hud)" }}
          onClick={back}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
            <path
              d="M15 5 L8 12 L15 19"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      )}

      {world && level === "constellation" && (
        <p
          className="skb__blurb"
          key={`b${world.id}`}
          style={{ zIndex: "var(--z-hud)" }}
        >
          {world.blurb}
        </p>
      )}
    </>
  );
}
