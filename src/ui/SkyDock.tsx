import { useEffect, useRef, useState } from "react";
import { Mark, MARKS, type MarkId } from "@/components/Mark";
import { getSky } from "@/scene/sky-data";
import { cue } from "@/lib/audio";
import { useUI } from "@/store/ui";
import { useExit } from "@/lib/useExit";
import "./sky-dock.css";

type Said = { id: number; to: string; text: string };

/**
 * The dock.
 *
 * Talking here is not a window you open and close. When you are standing at a
 * person or holding one of their things, a bar rises at the bottom of the sky
 * with what you are looking at on the left and a place to type on the right,
 * and the sky stays where it is behind it.
 *
 * That is the whole social model in one control: you can only say something to
 * somebody while you are at them. There is no inbox to go to, because there is
 * nowhere in ECHO that is not somewhere.
 */
export function SkyDock() {
  const level = useUI((s) => s.level);
  const star = useUI((s) => s.star);
  const planet = useUI((s) => s.planet);
  const openPlanet = useUI((s) => s.openPlanet);

  const [sky] = useState(getSky);
  const [text, setText] = useState("");
  const [said, setSaid] = useState<Said[]>([]);
  const input = useRef<HTMLTextAreaElement>(null);

  const person = star !== null ? sky.stars[star] : null;
  const thing = planet !== null ? sky.planets[planet] : null;
  const open = level === "star" && !!person;
  const dock = useExit(open ? person : null, 180);
  const thingShown = useExit(thing, 180);

  // Opening something to read should put the caret where you would type back.
  useEffect(() => {
    if (planet !== null) input.current?.focus();
  }, [planet]);

  if (!dock.shown) return null;

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setSaid((s) => [{ id: Date.now(), to: who.name, text: t }, ...s]);
    setText("");
    cue("tick");
  };

  const who = dock.shown;
  const held = thingShown.shown;
  const replies = said.filter((s) => s.to === who.name);

  return (
    <div
      className="dock"
      data-closing={dock.closing}
      style={{ zIndex: "var(--z-dock)" }}
    >
      {/* What you are holding, if anything. */}
      {held && (
        <div className="dock__open" data-closing={thingShown.closing}>
          <button
            className="dock__close"
            onClick={() => openPlanet(null)}
            aria-label="Put it back"
          >
            ×
          </button>
          <span className="dock__kind">{held.kind}</span>
          <p className="dock__text">{held.text}</p>
          <span className="dock__meta">
            {held.carried} carried it ·{" "}
            {held.age > 0.72
              ? "fading"
              : `${Math.max(1, Math.round((1 - held.age) * 24))}h left`}
          </span>
        </div>
      )}

      <div className="dock__said">
        {replies.slice(0, 3).map((r) => (
          <p key={r.id} className="dock__said-line">
            {r.text}
          </p>
        ))}
      </div>

      <div className="dock__bar">
        <span className="dock__who">
          <Mark mark={MARKS[who.id % MARKS.length] as MarkId} hue={who.hue} size={20} />
          <b>{who.name}</b>
          <i>{who.traits.join(" · ")}</i>
        </span>

        <textarea
          ref={input}
          className="dock__input"
          rows={1}
          value={text}
          placeholder={
            held ? `Say something back to ${who.name}` : `Say something to ${who.name}`
          }
          onChange={(e) => setText(e.target.value.slice(0, 240))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />

        <button className="dock__send" onClick={send} disabled={!text.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
