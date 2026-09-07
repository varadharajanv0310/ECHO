import { useState } from "react";
import { Mark, MARKS, type MarkId } from "@/components/Mark";
import { copy } from "@/copy";
import { useSequence } from "@/store/sequence";
import "./profile.css";

/**
 * The five choosable hues, walking the ramp from violet into magenta.
 *
 * Amber is deliberately absent. It is the decay colour - the colour a signal
 * turns when it is dying - so it is not something anyone gets to pick. The
 * palette rule is enforced by the interface rather than written in a guideline.
 */
const HUES = [262, 276, 290, 306, 322];

/**
 * Beat 8. Name, mark, colour, worlds. No email, no password, no account.
 *
 * Written as four questions in the system voice rather than four labelled
 * fields, and everything floats in the void with no card, no panel and no
 * border. The only affordance that looks like a control is the underline under
 * the name, because that one has to invite typing.
 */
export function Profile() {
  const setProfile = useSequence((s) => s.setProfile);
  const setPhase = useSequence((s) => s.setPhase);

  const [name, setName] = useState("");
  const [mark, setMark] = useState<MarkId>("star");
  const [hue, setHue] = useState(276);
  const [worlds, setWorlds] = useState<string[]>([]);

  const ready = name.trim().length > 0 && worlds.length > 0;

  const toggle = (w: string) =>
    setWorlds((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w],
    );

  const submit = () => {
    if (!ready) return;
    setProfile({ name: name.trim(), hue, mark, worlds });
    setPhase("dive");
  };

  return (
    <div className="pf" style={{ zIndex: "var(--z-content)" }}>
      <form
        className="pf__inner"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <p className="pf__title">{copy.profile.title}</p>

        {/* Name -------------------------------------------------------- */}
        <label className="pf__field" style={{ "--d": "0ms" } as React.CSSProperties}>
          <span className="pf__label">{copy.profile.nameLabel}</span>
          <input
            className="pf__name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 24))}
            placeholder={copy.profile.namePlaceholder}
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
          <span className="pf__hint">{copy.profile.nameHint}</span>
        </label>

        {/* Mark and colour --------------------------------------------- */}
        <div className="pf__row">
          <div className="pf__field" style={{ "--d": "90ms" } as React.CSSProperties}>
            <span className="pf__label">{copy.profile.markLabel}</span>
            <div className="pf__marks">
              {MARKS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className="pf__mark"
                  data-on={m === mark}
                  onClick={() => setMark(m)}
                  aria-label={m}
                  aria-pressed={m === mark}
                >
                  <Mark mark={m} hue={hue} size={30} glow={m === mark} />
                </button>
              ))}
            </div>
            <span className="pf__hint">{copy.profile.markHint}</span>
          </div>

          <div className="pf__field" style={{ "--d": "150ms" } as React.CSSProperties}>
            <span className="pf__label">{copy.profile.colourLabel}</span>
            <div className="pf__hues">
              {HUES.map((h) => (
                <button
                  key={h}
                  type="button"
                  className="pf__hue"
                  data-on={h === hue}
                  onClick={() => setHue(h)}
                  aria-label={`hue ${h}`}
                  aria-pressed={h === hue}
                  style={{ "--h": h } as React.CSSProperties}
                />
              ))}
            </div>
            <span className="pf__hint">{copy.profile.colourHint}</span>
          </div>
        </div>

        {/* Worlds ------------------------------------------------------ */}
        <div className="pf__field" style={{ "--d": "220ms" } as React.CSSProperties}>
          <span className="pf__label">{copy.profile.worldsLabel}</span>
          <div className="pf__worlds">
            {copy.worlds.map((w) => (
              <button
                key={w}
                type="button"
                className="pf__world"
                data-on={worlds.includes(w)}
                onClick={() => toggle(w)}
                aria-pressed={worlds.includes(w)}
              >
                {w}
              </button>
            ))}
          </div>
          <span className="pf__hint">{copy.profile.worldsHint}</span>
        </div>

        {/* Emit -------------------------------------------------------- */}
        <div className="pf__submit-wrap" style={{ "--d": "300ms" } as React.CSSProperties}>
          <button className="pf__submit" type="submit" disabled={!ready}>
            <Mark mark={mark} hue={hue} size={20} glow={ready} />
            <span>{copy.profile.submit}</span>
          </button>
          <span className="pf__hint pf__hint--centre">{copy.profile.submitHint}</span>
        </div>
      </form>
    </div>
  );
}
