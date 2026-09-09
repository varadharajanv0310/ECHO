import { useState } from "react";
import { copy } from "@/copy";
import { useSequence, useUI } from "@/store";
import { cue } from "@/services/audio";
import { myStar } from "@/scene/sky-data";
import { Window } from "../Window";
import { Chip } from "@/ui/primitives";

export const CREATE_TABS = ["Signal", "World"] as const;

const LIFETIMES = [
  { h: 12, label: "12 hours" },
  { h: 24, label: "A day" },
  { h: 72, label: "Three days" },
];

/**
 * Emitting.
 *
 * The interface is built to make the cost visible before you pay it. You must
 * choose a World before you can write, because the signal belongs to the place
 * and not to you; and the lifetime is stated on the button, because the thing
 * you are about to do is release something that will die.
 *
 * There is no audience selector, no scheduling and no draft. Those all assume
 * reach you control.
 */
export function CreatePanel() {
  const profile = useSequence((s) => s.profile);
  const emit = useSequence((s) => s.emit);
  const enterStar = useUI((s) => s.enterStar);
  const setPanel = useUI((s) => s.setPanel);
  const tab = useUI((s) => s.tab.create);
  const setTab = useUI((s) => s.setTab);

  const [world, setWorld] = useState(profile?.worlds[0] ?? copy.worlds[0]);
  const [text, setText] = useState("");
  const [life, setLife] = useState(24);
  const [sent, setSent] = useState(false);

  const [newWorld, setNewWorld] = useState("");
  const [newWhat, setNewWhat] = useState("");

  const ready = text.trim().length > 2 && !!world;

  return (
    <Window
      title="Create"
      subtitle="It belongs to the place, not to you"
      tabs={CREATE_TABS}
      active={tab}
      onTab={(t) => setTab("create", t)}
      onClose={() => setPanel(null)}
      size="narrow"
    >
      {tab === "Signal" && (
        <div className="u-grid">
          {sent ? (
            <section className="u-card cr__sent">
              <h3 className="u-h">It is out.</h3>
              <p className="u-hint" style={{ lineHeight: 1.7 }}>
                It is in {world} now. It will reach nobody unless somebody carries it,
                and if nobody does it will be gone in {life} hours. You will not be told
                either way.
              </p>
              <div className="cr__after">
                <button
                  type="button"
                  className="u-btn u-btn--ghost"
                  onClick={() => {
                    setSent(false);
                    setText("");
                  }}
                >
                  Emit another
                </button>
                <button
                  type="button"
                  className="u-btn u-btn--ghost"
                  onClick={() => {
                    if (myStar() >= 0) enterStar(myStar());
                  }}
                >
                  Go and look at it
                </button>
              </div>
            </section>
          ) : (
            <>
              <section className="u-card">
                <span className="u-label">Where it lands</span>
                <div className="u-chips">
                  {copy.worlds.map((w) => (
                    <Chip key={w} selected={world === w} onClick={() => setWorld(w)}>
                      {w}
                    </Chip>
                  ))}
                </div>
              </section>

              <section className="u-card">
                <label className="u-label" htmlFor="cr-signal">
                  The signal
                </label>
                <textarea
                  id="cr-signal"
                  className="u-textarea"
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 240))}
                  placeholder="Say it once"
                  autoFocus
                />
                <div className="cr__meter">
                  <span className="u-hint">{240 - text.length} left</span>
                </div>
              </section>

              <section className="u-card">
                <span className="u-label">How long it has</span>
                <div className="u-chips">
                  {LIFETIMES.map((l) => (
                    <Chip
                      key={l.h}
                      selected={life === l.h}
                      onClick={() => setLife(l.h)}
                    >
                      {l.label}
                    </Chip>
                  ))}
                </div>
                <p className="u-hint" style={{ marginTop: "0.8rem" }}>
                  Every carry resets the clock. Nothing else does.
                </p>
              </section>

              <button
                type="button"
                className="u-btn u-btn--go"
                disabled={!ready}
                onClick={() => {
                  // This is the one control in ECHO that changes the sky. The
                  // signal appears at your own star the moment you let it go -
                  // there is no server to wait for and nothing to confirm.
                  emit(world, text.trim(), life);
                  setSent(true);
                  cue("tick");
                }}
              >
                Emit into {world}
              </button>
            </>
          )}
        </div>
      )}

      {tab === "World" && (
        <div className="u-grid">
          <section className="u-card">
            <label className="u-label" htmlFor="cr-world-name">
              Name of the place
            </label>
            <input
              id="cr-world-name"
              className="u-input"
              value={newWorld}
              onChange={(e) => setNewWorld(e.target.value.slice(0, 32))}
              placeholder="A place, a topic, or a moment"
            />
          </section>

          <section className="u-card">
            <label className="u-label" htmlFor="cr-world-what">
              What belongs here
            </label>
            <textarea
              id="cr-world-what"
              className="u-textarea"
              value={newWhat}
              onChange={(e) => setNewWhat(e.target.value.slice(0, 160))}
              placeholder="One line. People decide by this alone."
            />
          </section>

          <button type="button" className="u-btn" disabled={!newWorld.trim()}>
            Open {newWorld.trim() || "it"}
          </button>

          <p className="u-hint" style={{ lineHeight: 1.7 }}>
            A World with nothing in it closes by itself. There is no way to reserve a
            name and no way to own one.
          </p>
        </div>
      )}
    </Window>
  );
}
