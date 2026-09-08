import { useMemo } from "react";
import { buildConstellation } from "@/scene/constellation-data";
import { useSequence } from "@/store/sequence";
import { useUI } from "@/store/ui";
import { Window } from "../Window";

export const DASH_TABS = ["Overview", "Carried", "Fading"] as const;

/**
 * The dashboard.
 *
 * Deliberately not a growth panel. Everything measured here is either
 * something a person did or something that is running out - what you carried,
 * what carried you, what is about to be gone. There is no line going up,
 * because there is no quantity in ECHO that only increases.
 */
export function DashboardPanel() {
  const profile = useSequence((s) => s.profile);
  const setPanel = useUI((s) => s.setPanel);
  const setOpenSignal = useUI((s) => s.setOpenSignal);
  const tab = useUI((s) => s.tab.dashboard);
  const setTab = useUI((s) => s.setTab);

  const nodes = useMemo(() => buildConstellation(), []);

  const stats = useMemo(() => {
    const live = nodes.filter((n, i) => i > 0 && n.age <= 0.72);
    const fading = nodes.filter((n, i) => i > 0 && n.age > 0.72);
    const carried = nodes
      .map((n, i) => ({ ...n, i }))
      .filter((n) => n.i > 0 && n.carried > 0)
      .sort((a, b) => b.carried - a.carried);
    const worlds = new Map<string, number>();
    nodes.forEach((n, i) => {
      if (i > 0) worlds.set(n.world, (worlds.get(n.world) ?? 0) + 1);
    });
    return { live, fading, carried, worlds: [...worlds.entries()].sort((a, b) => b[1] - a[1]) };
  }, [nodes]);

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
              <b>{stats.live.length}</b>
              <span>still travelling</span>
            </div>
            <div className="u-card db__stat">
              <b>{stats.carried.length}</b>
              <span>carried at least once</span>
            </div>
            <div className="u-card db__stat db__stat--warn">
              <b>{stats.fading.length}</b>
              <span>gone by morning</span>
            </div>
          </section>

          <section className="u-card">
            <h3 className="u-h">Where things are landing</h3>
            {stats.worlds.map(([w, c]) => (
              <div className="db__bar" key={w}>
                <span className="db__bar-label">{w}</span>
                <span className="db__bar-track">
                  <span
                    className="db__bar-fill"
                    style={{
                      transform: `scaleX(${c / (stats.worlds[0]?.[1] || 1)})`,
                    }}
                  />
                </span>
                <span className="db__bar-num">{c}</span>
              </div>
            ))}
          </section>

          <section className="u-card">
            <h3 className="u-h">Recently visited</h3>
            {nodes.slice(1, 6).map((n, i) => (
              <button
                key={i}
                className="u-row sr__hit"
                onClick={() => setOpenSignal(i + 1)}
              >
                <div className="u-row__main">
                  <span className="u-row__title">{n.text}</span>
                  <span className="u-row__meta">
                    {n.world} · {n.hops} hops
                  </span>
                </div>
              </button>
            ))}
          </section>
        </div>
      )}

      {tab === "Carried" && (
        <section className="u-card">
          <h3 className="u-h">Signals that travelled</h3>
          {stats.carried.slice(0, 24).map((n) => (
            <button
              key={n.i}
              className="u-row sr__hit"
              onClick={() => setOpenSignal(n.i)}
            >
              <div className="u-row__main">
                <span className="u-row__title">{n.text}</span>
                <span className="u-row__meta">
                  {n.world} · carried {n.carried}×
                </span>
              </div>
            </button>
          ))}
        </section>
      )}

      {tab === "Fading" && (
        <section className="u-card">
          <h3 className="u-h">Running out</h3>
          <p className="u-hint" style={{ marginBottom: "1rem" }}>
            Carrying one of these is the only thing that resets its clock.
          </p>
          {stats.fading.length === 0 && <p className="u-empty">Nothing is dying</p>}
          {nodes
            .map((n, i) => ({ ...n, i }))
            .filter((n) => n.i > 0 && n.age > 0.72)
            .sort((a, b) => b.age - a.age)
            .slice(0, 24)
            .map((n) => (
              <button
                key={n.i}
                className="u-row sr__hit"
                onClick={() => setOpenSignal(n.i)}
              >
                <span className="db__dying" aria-hidden />
                <div className="u-row__main">
                  <span className="u-row__title">{n.text}</span>
                  <span className="u-row__meta">
                    {n.world} · {Math.max(1, Math.round((1 - n.age) * 24))}h left
                  </span>
                </div>
              </button>
            ))}
        </section>
      )}
    </Window>
  );
}
