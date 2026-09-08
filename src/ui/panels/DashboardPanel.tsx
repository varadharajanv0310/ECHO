import { useMemo } from "react";
import { getSky } from "@/scene/sky-data";
import { useSequence } from "@/store/sequence";
import { useUI } from "@/store/ui";
import { Window } from "../Window";

export const DASH_TABS = ["Overview", "Worlds", "Fading"] as const;

/**
 * The dashboard.
 *
 * Deliberately not a growth panel. Everything measured here is either
 * something a person did or something that is running out - what got carried,
 * where things are landing, what is about to be gone. There is no line going
 * up, because there is no quantity in ECHO that only increases.
 */
export function DashboardPanel() {
  const profile = useSequence((s) => s.profile);
  const setPanel = useUI((s) => s.setPanel);
  const enterConstellation = useUI((s) => s.enterConstellation);
  const enterStar = useUI((s) => s.enterStar);
  const tab = useUI((s) => s.tab.dashboard);
  const setTab = useUI((s) => s.setTab);

  const sky = useMemo(() => getSky(), []);

  const stats = useMemo(() => {
    const live = sky.planets.filter((p) => p.age <= 0.72);
    const fading = sky.planets
      .filter((p) => p.age > 0.72)
      .sort((a, b) => b.age - a.age);
    const carried = sky.planets
      .filter((p) => p.carried > 0)
      .sort((a, b) => b.carried - a.carried);

    const perWorld = sky.constellations.map((c) => ({
      c,
      people: c.stars.length,
      things: c.stars.reduce((n, s) => n + sky.stars[s].planets.length, 0),
    }));
    const peak = Math.max(...perWorld.map((w) => w.things), 1);

    return { live, fading, carried, perWorld, peak };
  }, [sky]);

  const nameOf = (planetIdx: number) => sky.stars[sky.planets[planetIdx].star].name;

  return (
    <Window
      title="Dashboard"
      subtitle={profile?.name ?? ""}
      tabs={DASH_TABS}
      active={tab}
      onTab={(t) => setTab("dashboard", t)}
      onClose={() => setPanel(null)}
    >
      {tab === "Overview" && (
        <div className="u-grid">
          <section className="db__stats">
            <div className="u-card db__stat">
              <b>{sky.constellations.length}</b>
              <span>worlds you can reach</span>
            </div>
            <div className="u-card db__stat">
              <b>{stats.live.length}</b>
              <span>still travelling</span>
            </div>
            <div className="u-card db__stat db__stat--warn">
              <b>{stats.fading.length}</b>
              <span>gone by morning</span>
            </div>
          </section>

          <section className="u-card">
            <h3 className="u-h">Most carried</h3>
            {stats.carried.slice(0, 6).map((p) => (
              <button
                key={p.id}
                className="u-row sr__hit"
                onClick={() => enterStar(p.star)}
              >
                <div className="u-row__main">
                  <span className="u-row__title">{p.text}</span>
                  <span className="u-row__meta">
                    {nameOf(p.id)} · carried {p.carried}×
                  </span>
                </div>
              </button>
            ))}
          </section>
        </div>
      )}

      {tab === "Worlds" && (
        <section className="u-card">
          <h3 className="u-h">Where things are landing</h3>
          {stats.perWorld.map((w) => (
            <div className="db__bar" key={w.c.id}>
              <button
                className="db__bar-label db__bar-go"
                onClick={() => enterConstellation(w.c.id)}
              >
                {w.c.world}
              </button>
              <span className="db__bar-track">
                <span
                  className="db__bar-fill"
                  style={{ transform: `scaleX(${w.things / stats.peak})` }}
                />
              </span>
              <span className="db__bar-num">{w.things}</span>
            </div>
          ))}
          <p className="u-hint" style={{ marginTop: "1rem", lineHeight: 1.7 }}>
            A quiet World is not a failing one. Some places are meant to be
            almost empty.
          </p>
        </section>
      )}

      {tab === "Fading" && (
        <section className="u-card">
          <h3 className="u-h">Running out</h3>
          <p className="u-hint" style={{ marginBottom: "1rem" }}>
            Carrying one of these is the only thing that resets its clock.
          </p>
          {stats.fading.length === 0 && <p className="u-empty">Nothing is dying</p>}
          {stats.fading.slice(0, 24).map((p) => (
            <button
              key={p.id}
              className="u-row sr__hit"
              onClick={() => enterStar(p.star)}
            >
              <span className="db__dying" aria-hidden />
              <div className="u-row__main">
                <span className="u-row__title">{p.text}</span>
                <span className="u-row__meta">
                  {nameOf(p.id)} ·{" "}
                  {Math.max(1, Math.round((1 - p.age) * 24))}h left
                </span>
              </div>
            </button>
          ))}
        </section>
      )}
    </Window>
  );
}
