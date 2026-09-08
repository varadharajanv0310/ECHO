import { useMemo } from "react";
import { Mark, MARKS, type MarkId } from "@/components/Mark";
import { getSky, myStar } from "@/scene/sky-data";
import { useSequence } from "@/store/sequence";
import { useUI } from "@/store/ui";
import { Window } from "../Window";

export const DASH_TABS = ["Sent", "Responses", "Messages"] as const;

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

/**
 * The dashboard, split by direction.
 *
 * What you sent, what came back, and who you are actually talking to. That
 * split is the whole point: on most platforms these three collapse into one
 * feed of notifications, which flattens the difference between somebody
 * replying to you and a number going up.
 *
 * Nothing here is seeded. If it is empty, it is empty because you have not
 * done anything yet.
 */
export function DashboardPanel() {
  const profile = useSequence((s) => s.profile);
  const emissions = useSequence((s) => s.emissions);
  const dms = useSequence((s) => s.dms);
  const responses = useSequence((s) => s.responses);
  const friends = useSequence((s) => s.friends);

  const setPanel = useUI((s) => s.setPanel);
  const enterStar = useUI((s) => s.enterStar);
  const openProfile = useUI((s) => s.openProfile);
  const tab = useUI((s) => s.tab.dashboard);
  const setTab = useUI((s) => s.setTab);

  const sky = useMemo(() => getSky(), []);

  /** One row per person you have said something to, newest first. */
  const threads = useMemo(() => {
    const byStar = new Map<number, typeof dms>();
    dms.forEach((d) => {
      const list = byStar.get(d.withStar) ?? [];
      list.push(d);
      byStar.set(d.withStar, list);
    });
    return [...byStar.entries()]
      .map(([star, list]) => ({ star, list, last: list[0] }))
      .sort((a, b) => b.last.at - a.last.at);
  }, [dms]);

  return (
    <Window
      title="Dashboard"
      subtitle={profile?.name ?? ""}
      tabs={DASH_TABS}
      active={DASH_TABS.includes(tab as never) ? tab : "Sent"}
      onTab={(t) => setTab("dashboard", t)}
      size="mid"
      onClose={() => setPanel(null)}
    >
      <div className="u-grid">
        <section className="db__stats">
          <div className="u-card db__stat">
            <b>{emissions.length}</b>
            <span>you have sent</span>
          </div>
          <div className="u-card db__stat">
            <b>{friends.length}</b>
            <span>people you added</span>
          </div>
          <div className="u-card db__stat">
            <b>{threads.length}</b>
            <span>conversations</span>
          </div>
        </section>

        {tab === "Responses" ? (
          <section className="u-card">
            <h3 className="u-h">What came back</h3>
            {responses.length === 0 && (
              <p className="u-empty">
                Nothing yet. A reply only exists if somebody chose to leave one.
              </p>
            )}
            {responses.map((r) => (
              <div className="u-row" key={r.id}>
                <div className="u-row__main">
                  <span className="u-row__title">{r.text}</span>
                  <span className="u-row__meta">
                    {r.from} · on “{r.onText.slice(0, 40)}” · {ago(r.at)}
                  </span>
                </div>
              </div>
            ))}
          </section>
        ) : tab === "Messages" ? (
          <section className="u-card">
            <h3 className="u-h">People you are talking to</h3>
            {threads.length === 0 && (
              <p className="u-empty">
                Nobody yet. Stand at someone and say something.
              </p>
            )}
            {threads.map((t) => {
              const person = sky.stars[t.star];
              return (
                <button
                  className="u-row sr__hit"
                  key={t.star}
                  onClick={() => openProfile(t.star)}
                >
                  <Mark
                    mark={MARKS[t.star % MARKS.length] as MarkId}
                    hue={person?.hue ?? 276}
                    size={22}
                  />
                  <div className="u-row__main">
                    <span className="u-row__title">{t.last.text}</span>
                    <span className="u-row__meta">
                      {t.last.name} · {t.list.length}{" "}
                      {t.list.length === 1 ? "message" : "messages"} ·{" "}
                      {ago(t.last.at)}
                    </span>
                  </div>
                </button>
              );
            })}
          </section>
        ) : (
          <section className="u-card">
            <h3 className="u-h">What you sent</h3>
            {emissions.length === 0 && (
              <p className="u-empty">
                Nothing yet. Create something and it appears at your own star.
              </p>
            )}
            {emissions.map((e) => {
              const hoursLeft = Math.max(
                0,
                e.life - (Date.now() - e.at) / 3600000,
              );
              const dying = hoursLeft < e.life * 0.28;
              return (
                <button
                  className="u-row sr__hit"
                  key={e.id}
                  onClick={() => myStar() >= 0 && enterStar(myStar())}
                >
                  {dying && <span className="db__dying" aria-hidden />}
                  <div className="u-row__main">
                    <span className="u-row__title">{e.text}</span>
                    <span className="u-row__meta">
                      {e.world} · {ago(e.at)} ·{" "}
                      {hoursLeft < 1
                        ? "gone"
                        : `${Math.round(hoursLeft)}h left`}
                    </span>
                  </div>
                </button>
              );
            })}
            <p className="u-hint" style={{ marginTop: "1rem", lineHeight: 1.7 }}>
              These clocks only ever run down. The one thing that resets them is
              somebody choosing to carry what you said.
            </p>
          </section>
        )}
      </div>
    </Window>
  );
}
