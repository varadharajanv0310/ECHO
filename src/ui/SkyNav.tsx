import { useEffect, useMemo, useRef, useState } from "react";
import { getSky } from "@/scene/sky-data";
import { useSequence } from "@/store/sequence";
import { useUI } from "@/store/ui";
import "./sky-nav.css";

/**
 * The sky, as something you can operate with a keyboard.
 *
 * Everything in the 3D view is drawn into a single canvas, which means it is
 * one opaque element to assistive technology and to the tab key: there is
 * nothing to focus, nothing to announce, and no way to reach any of it without
 * a pointer. That is the whole application closed to anyone not using a mouse.
 *
 * Rather than trying to make a canvas focusable - which gives you one stop and
 * no structure - this renders the same hierarchy as a real list of buttons. It
 * is the accessible equivalent of the view, not a summary of it: the buttons
 * run the same navigation actions the pointer does, so both paths end in the
 * same place.
 *
 * It is off-screen until something inside it takes focus, at which point it
 * becomes visible. A keyboard user should be able to see where they are, and a
 * sighted mouse user should never have a list of names over their sky.
 */
export function SkyNav() {
  const phase = useSequence((s) => s.phase);
  const emissions = useSequence((s) => s.emissions);
  const carried = useSequence((s) => s.carried);

  const level = useUI((s) => s.level);
  const constellation = useUI((s) => s.constellation);
  const star = useUI((s) => s.star);
  const enterConstellation = useUI((s) => s.enterConstellation);
  const enterStar = useUI((s) => s.enterStar);
  const openPlanet = useUI((s) => s.openPlanet);
  const openProfile = useUI((s) => s.openProfile);
  const back = useUI((s) => s.back);

  const [open, setOpen] = useState(false);
  const box = useRef<HTMLElement>(null);

  // The sky is rebuilt as things are said and carried, so this has to be read
  // fresh rather than captured once.
  const sky = useMemo(() => getSky(), [emissions, carried]);

  // Backspace goes up a level while focus is inside, matching the Back
  // control and the browser gesture people already expect.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Backspace" && level !== "cluster") {
        e.preventDefault();
        back();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [level, back]);

  if (phase !== "constellation") return null;

  const world = constellation !== null ? sky.constellations[constellation] : null;
  const person = star !== null ? sky.stars[star] : null;

  const items =
    level === "cluster"
      ? sky.constellations.map((c) => ({
          key: `w${c.id}`,
          label: `${c.world}. ${c.blurb}`,
          text: c.world,
          go: () => enterConstellation(c.id),
        }))
      : level === "constellation" && world
        ? world.stars.map((id) => ({
            key: `s${id}`,
            label: `${sky.stars[id].name}, in ${world.world}`,
            text: sky.stars[id].name,
            go: () => enterStar(id),
          }))
        : person
          ? person.planets.map((id) => {
              const pl = sky.planets.find((x) => x.id === id);
              return {
                key: `p${id}`,
                label: pl?.text ?? "A signal",
                text: pl?.text ?? "A signal",
                go: () => openPlanet(id),
              };
            })
          : [];

  const where =
    level === "cluster"
      ? "All places"
      : level === "constellation" && world
        ? world.world
        : (person?.name ?? "");

  const heading =
    level === "cluster"
      ? "Places"
      : level === "constellation"
        ? "People here"
        : "What they are carrying";

  return (
    <nav
      ref={box}
      className="skynav"
      data-open={open}
      aria-label="Sky navigation"
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <h2 className="skynav__where">
        {heading}
        <span> · {where}</span>
      </h2>

      <ul className="skynav__list">
        {level !== "cluster" && (
          <li>
            <button className="skynav__item" onClick={back}>
              Back to {level === "star" && world ? world.world : "all places"}
            </button>
          </li>
        )}

        {items.map((it) => (
          <li key={it.key}>
            <button className="skynav__item" onClick={it.go} aria-label={it.label}>
              {it.text}
            </button>
          </li>
        ))}

        {level === "star" && person && (
          <li>
            <button
              className="skynav__item"
              onClick={() => openProfile(person.id)}
            >
              Open {person.name}&rsquo;s profile
            </button>
          </li>
        )}
      </ul>

      <p className="skynav__hint">
        Backspace goes up a level. Escape closes anything open.
      </p>
    </nav>
  );
}
