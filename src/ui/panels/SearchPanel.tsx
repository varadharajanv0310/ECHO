import { useMemo, useState } from "react";
import { Mark, MARKS, type MarkId } from "@/components/Mark";
import { copy } from "@/copy";
import { buildConstellation } from "@/scene/constellation-data";
import { useUI } from "@/store/ui";
import { Window } from "../Window";

export const SEARCH_TABS = ["Signals", "People"] as const;

/** Stand-in people, built from the same seed so the sky and the list agree. */
const PEOPLE = [
  { name: "havel", traits: ["Night owl", "Archivist"], world: "3AM", hue: 276 },
  { name: "orpheline", traits: ["Carrier", "Sentimental"], world: "Dead Air", hue: 306 },
  { name: "nine", traits: ["Lurker", "Quiet"], world: "The Long Now", hue: 262 },
  { name: "brackish", traits: ["Blunt", "First responder"], world: "The Commons", hue: 322 },
  { name: "sunday", traits: ["Slow burn", "Homebody"], world: "First Light", hue: 290 },
  { name: "vale", traits: ["Wanderer", "Curious"], world: "Open Sky", hue: 276 },
  { name: "tern", traits: ["Carrier", "Curious"], world: "Open Sky", hue: 306 },
  { name: "moth", traits: ["Night owl", "Lurker"], world: "3AM", hue: 262 },
];

/**
 * Search.
 *
 * Two different questions, so two different tabs. Signals are found by what
 * they say and where they landed; people are found by temperament and by the
 * Worlds they listen in - never by name, because there is no unique handle to
 * look one up with and nothing here is indexed.
 */
export function SearchPanel() {
  const setPanel = useUI((s) => s.setPanel);
  const setOpenSignal = useUI((s) => s.setOpenSignal);
  const tab = useUI((s) => s.tab.search);
  const setTab = useUI((s) => s.setTab);

  const [q, setQ] = useState("");
  const [world, setWorld] = useState<string | null>(null);
  const [trait, setTrait] = useState<string | null>(null);
  const [onlyFading, setOnlyFading] = useState(false);

  const nodes = useMemo(() => buildConstellation(), []);

  const signals = useMemo(() => {
    const term = q.trim().toLowerCase();
    return nodes
      .map((n, i) => ({ ...n, i }))
      .filter((n) => n.i > 0)
      .filter((n) => (world ? n.world === world : true))
      .filter((n) => (onlyFading ? n.age > 0.72 : true))
      .filter((n) => (term ? n.text.toLowerCase().includes(term) : true))
      .slice(0, 40);
  }, [nodes, q, world, onlyFading]);

  const people = useMemo(
    () =>
      PEOPLE.filter((p) => (trait ? p.traits.includes(trait) : true))
        .filter((p) => (world ? p.world === world : true))
        .filter((p) =>
          q.trim() ? p.name.includes(q.trim().toLowerCase()) : true,
        ),
    [q, trait, world],
  );

  return (
    <Window
      title="Search"
      subtitle="Nothing here is ranked"
      tabs={SEARCH_TABS}
      active={tab}
      onTab={(t) => setTab("search", t)}
      onClose={() => setPanel(null)}
    >
      <div className="u-grid">
        <input
          className="u-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            tab === "Signals" ? "A word, or part of one" : "A name, if you know it"
          }
          autoFocus
        />

        <section className="u-card">
          <span className="u-label">World</span>
          <div className="u-chips">
            {copy.worlds.map((w) => (
              <button
                key={w}
                className="u-chip"
                data-on={world === w}
                onClick={() => setWorld(world === w ? null : w)}
              >
                {w}
              </button>
            ))}
          </div>
        </section>

        {tab === "Signals" ? (
          <>
            <button
              className="u-chip"
              data-on={onlyFading}
              onClick={() => setOnlyFading(!onlyFading)}
              style={{ justifySelf: "start" }}
            >
              Only what is fading
            </button>

            <section className="u-card">
              <span className="u-label">
                {signals.length} {signals.length === 1 ? "signal" : "signals"}
              </span>
              {signals.length === 0 && (
                <p className="u-empty">Nothing matches. It may already be gone.</p>
              )}
              {signals.map((s) => (
                <button
                  key={s.i}
                  className="u-row sr__hit"
                  onClick={() => setOpenSignal(s.i)}
                >
                  <div className="u-row__main">
                    <span className="u-row__title">{s.text}</span>
                    <span className="u-row__meta">
                      {s.world} · {s.hops} hops
                      {s.age > 0.72 ? " · fading" : ""}
                    </span>
                  </div>
                </button>
              ))}
            </section>
          </>
        ) : (
          <>
            <section className="u-card">
              <span className="u-label">Temperament</span>
              <div className="u-chips">
                {copy.traits.map((t) => (
                  <button
                    key={t}
                    className="u-chip"
                    data-on={trait === t}
                    onClick={() => setTrait(trait === t ? null : t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </section>

            <section className="u-card">
              <span className="u-label">
                {people.length} {people.length === 1 ? "person" : "people"}
              </span>
              {people.length === 0 && (
                <p className="u-empty">Nobody listening like that here</p>
              )}
              {people.map((p, i) => (
                <div className="u-row" key={p.name}>
                  <Mark
                    mark={MARKS[i % MARKS.length] as MarkId}
                    hue={p.hue}
                    size={22}
                  />
                  <div className="u-row__main">
                    <span className="u-row__title">{p.name}</span>
                    <span className="u-row__meta">
                      {p.traits.join(" · ")} — {p.world}
                    </span>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </Window>
  );
}
