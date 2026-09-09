import { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
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

type SignalHit = {
  id: number;
  star: number;
  text: string;
  age: number;
  author: string;
  world: string;
};

type PersonHit = {
  id: number;
  name: string;
  hue: number;
  traits: string[];
  world: string;
};

/**
 * One result, memoised.
 *
 * A search over this sky returns up to forty rows, and without this every one
 * of them re-renders on every keystroke even though almost all of them are
 * still the same row. `onSelect` is passed as a stable callback so the
 * comparison actually holds.
 */
const SignalRow = memo(function SignalRow({
  hit,
  onSelect,
}: {
  hit: SignalHit;
  onSelect: (star: number) => void;
}) {
  return (
    <button type="button" className="u-row sr__hit" onClick={() => onSelect(hit.star)}>
      <div className="u-row__main">
        <span className="u-row__title">{hit.text}</span>
        <span className="u-row__meta">
          {hit.author} · {hit.world}
          {hit.age > 0.72 ? " · fading" : ""}
        </span>
      </div>
    </button>
  );
});

const PersonRow = memo(function PersonRow({
  hit,
  onSelect,
}: {
  hit: PersonHit;
  onSelect: (star: number) => void;
}) {
  return (
    <button type="button" className="u-row sr__hit" onClick={() => onSelect(hit.id)}>
      <Mark mark={MARKS[hit.id % MARKS.length] as MarkId} hue={hit.hue} size={22} />
      <div className="u-row__main">
        <span className="u-row__title">{hit.name}</span>
        <span className="u-row__meta">
          {hit.traits.join(" · ")} — {hit.world}
        </span>
      </div>
    </button>
  );
});

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

  /**
   * Typing updates the field immediately; the results are allowed to lag.
   *
   * Every keystroke otherwise re-filters and re-sorts every signal in the sky
   * synchronously before the character appears, so the input goes heavy
   * exactly when somebody is typing fast. Deferring the term lets React paint
   * the keystroke first and compute the list at a lower priority, which is the
   * right way round: the field is what the person is looking at.
   */
  const deferredQ = useDeferredValue(q);
  const settling = q !== deferredQ;

  const sky = useMemo(() => getSky(), []);

  // Stable across renders, so the memoised rows below actually stay memoised.
  const select = useCallback((star: number) => enterStar(star), [enterStar]);

  const signals = useMemo(() => {
    const term = deferredQ.trim().toLowerCase();
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
  }, [sky, deferredQ, world, onlyFading]);

  const people = useMemo(
    () =>
      sky.stars
        .map((st) => ({ ...st, world: sky.constellations[st.constellation].world }))
        .filter((p) => (trait ? p.traits.includes(trait) : true))
        .filter((p) => (world ? p.world === world : true))
        .filter((p) =>
          deferredQ.trim() ? p.name.includes(deferredQ.trim().toLowerCase()) : true,
        )
        .slice(0, 30),
    [sky, deferredQ, trait, world],
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

            <section className="u-card" data-settling={settling}>
              <span className="u-label">
                {signals.length} {signals.length === 1 ? "signal" : "signals"}
              </span>
              {signals.length === 0 && (
                <p className="u-empty">Nothing matches. It may already be gone.</p>
              )}
              {signals.map((s) => (
                <SignalRow key={s.id} hit={s} onSelect={select} />
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

            <section className="u-card" data-settling={settling}>
              <span className="u-label">
                {people.length} {people.length === 1 ? "person" : "people"}
              </span>
              {people.length === 0 && (
                <p className="u-empty">Nobody listening like that here</p>
              )}
              {people.map((p) => (
                <PersonRow key={p.id} hit={p} onSelect={select} />
              ))}
            </section>
          </>
        )}
      </div>
    </Window>
  );
}
