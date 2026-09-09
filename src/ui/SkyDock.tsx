import { useEffect, useRef, useState } from "react";
import { Mark, MARKS, type MarkId } from "@/components/Mark";
import { getSky, myStar } from "@/scene/sky-data";
import { cue } from "@/lib/audio";
import { useUI } from "@/store/ui";
import { useSequence } from "@/store/sequence";
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

  const carried = useSequence((s) => s.carried);
  const carry = useSequence((s) => s.carry);
  const drop = useSequence((s) => s.drop);

  const [sky] = useState(getSky);
  const [text, setText] = useState("");
  const [said, setSaid] = useState<Said[]>([]);
  const input = useRef<HTMLTextAreaElement>(null);

  const person = star !== null ? sky.stars[star] : null;
  // By id, not by index. syncMine rebuilds your own planets with ids carried
  // on from the highest already in use, so position and id stop agreeing the
  // moment you have said anything.
  const thing =
    planet !== null ? (sky.planets.find((p) => p.id === planet) ?? null) : null;
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
    // At your own star this is not a message to somebody, it is an emission.
    if (who.id === myStar()) {
      const p = useSequence.getState().profile;
      useSequence.getState().emit(p?.worlds[0] ?? "Open Sky", t, 24);
    } else {
      // If something of theirs is open, the reply is about that. Sending it
      // without the subject is how a reply becomes a message from nowhere.
      useSequence.getState().sendDM(who.id, who.name, t, held?.text);
      setSaid((s) => [{ id: Date.now(), to: who.name, text: t }, ...s]);
    }
    setText("");
    cue("tick");
  };

  const who = dock.shown;
  const mine = who.id === myStar();
  const held = thingShown.shown;
  const holding = held ? carried.some((c) => c.source === held.id) : false;
  // At your own star the same button has to be able to let go, or something
  // you picked up can only be put down by flying back to where you found it.
  const borrowed = held?.borrowed;
  const replies = said.filter((s) => s.to === who.name);

  return (
    <div
      className="dock"
      data-closing={dock.closing}
      style={{ zIndex: "var(--z-dock)" }}
    >
      {/* What you are holding, if anything. */}
      {held && (
        <div
          className="dock__open"
          data-closing={thingShown.closing}
          data-lenis-prevent
        >
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
            {held.carried === 0
              ? "nobody has carried it"
              : `${held.carried} ${held.carried === 1 ? "person has" : "people have"} carried it`}{" "}
            ·{" "}
            {held.age > 0.72
              ? "fading"
              : `${Math.max(1, Math.round((1 - held.age) * 24))}h left`}
          </span>

          {/* The only verb that matters. Everything else in ECHO is a way of
              arriving at this button: a signal lives exactly as long as
              somebody keeps choosing to hold it. */}
          {mine && borrowed ? (
            <button
              className="dock__carry"
              data-on
              onClick={() => {
                drop(borrowed.source);
                openPlanet(null);
                cue("click");
              }}
            >
              Carrying for {borrowed.from} · put it down
            </button>
          ) : !mine ? (
            <button
              className="dock__carry"
              data-on={holding}
              onClick={() => {
                if (holding) drop(held.id);
                else carry(held.id, who.name, who.hue, held.text);
                cue(holding ? "click" : "spark");
              }}
            >
              {holding ? "Carrying" : "Carry this"}
            </button>
          ) : null}
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
        {/* A name and a face on a bar is a thing people expect to be able to
            click, and this one did nothing. */}
        <button
          className="dock__who"
          onClick={() => {
            cue("click");
            const ui = useUI.getState();
            if (mine) {
              ui.openProfile("me");
              ui.setPanel("profile");
            } else {
              ui.openProfile(who.id);
            }
          }}
          title={mine ? "Open your profile" : `Open ${who.name}'s profile`}
        >
          <Mark mark={MARKS[who.id % MARKS.length] as MarkId} hue={who.hue} size={20} />
          <b>{mine ? "You" : who.name}</b>
          <i>{mine ? "your own sky" : who.traits.join(" · ")}</i>
        </button>

        <textarea
          ref={input}
          className="dock__input"
          rows={1}
          value={text}
          placeholder={
            mine
              ? "Say something into your Worlds"
              : held
                ? `Say something back to ${who.name}`
                : `Say something to ${who.name}`
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
