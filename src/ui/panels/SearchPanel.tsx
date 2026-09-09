import { useMemo, useState } from "react";
import { Mark, MARKS } from "@/components/Mark";
import type { MarkId } from "@/types";
import { copy } from "@/copy";
import { getSky } from "@/scene/sky-data";
import { useUI } from "@/store";
import { Window } from "../Window";

export const SEARCH_TABS = ["Signals", "People"] as const;

/** Cheap integer scramble - stable for an id, unrelated to anything else. */
function scramble(n: number) {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  return Math.imul(h, 0xc2b2ae35) >>> 0;
}

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
  const enterStar = useUI((s) => s.enterStar);
  const tab = useUI((s) => s.tab.search);
  const setTab = useUI((s) => s.setTab);

  const [q, setQ] = useState("");
  const [world, setWorld] = useState<string | null>(null);
  const [trait, setTrait] = useState<string | null>(null);
  const [onlyFading, setOnlyFading] = useState(false);

  const sky = useMemo(() => getSky(), []);

  const signals = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (
      sky.planets
        .map((p) => {
          const st = sky.stars[p.star];
          return {
            ...p,
            author: st.name,
            world: sky.constellations[st.constellation].world,
          };
        })
        .filter((p) => (world ? p.world === world : true))
        .filter((p) => (onlyFading ? p.age > 0.72 : true))
        .filter((p) => (term ? p.text.toLowerCase().includes(term) : true))
        // Scrambled, not sorted. In stored order every signal by one person
        // arrives in a block, and a run of six things by the same author at the
        // top of the results looks exactly like a ranking - which is the one
        // thing this panel says it does not do. The scramble is a hash of the
        // id, so it is stable between renders and has no relationship to who
        // wrote a thing, when, or how far it travelled.
        .sort((a, b) => scramble(a.id) - scramble(b.id))
        .slice(0, 40)
    );
  }, [sky, q, world, onlyFading]);

  const people = useMemo(
    () =>
      sky.stars
        .map((st) => ({ ...st, world: sky.constellations[st.constellation].world }))
        .filter((p) => (trait ? p.traits.includes(trait) : true))
        .filter((p) => (world ? p.world === world : true))
        .filter((p) => (q.trim() ? p.name.includes(q.trim().toLowerCase()) : true))
        .slice(0, 30),
    [sky, q, trait, world],
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
        <label className="sr-only" htmlFor="se-query">
          {tab === "Signals" ? "Search signals" : "Search people"}
        </label>
        <input
          id="se-query"
          className="u-input"
          type="search"
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
                type="button"
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
              type="button"
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
                  type="button"
                  key={s.id}
                  className="u-row sr__hit"
                  onClick={() => enterStar(s.star)}
                >
                  <div className="u-row__main">
                    <span className="u-row__title">{s.text}</span>
                    <span className="u-row__meta">
                      {s.author} · {s.world}
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
                    type="button"
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
              {people.map((p) => (
                <button
                  type="button"
                  className="u-row sr__hit"
                  key={p.id}
                  onClick={() => enterStar(p.id)}
                >
                  <Mark
                    mark={MARKS[p.id % MARKS.length] as MarkId}
                    hue={p.hue}
                    size={22}
                  />
                  <div className="u-row__main">
                    <span className="u-row__title">{p.name}</span>
                    <span className="u-row__meta">
                      {p.traits.join(" · ")} — {p.world}
                    </span>
                  </div>
                </button>
              ))}
            </section>
          </>
        )}
      </div>
    </Window>
  );
}
