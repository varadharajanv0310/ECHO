import { useMemo, useState } from "react";
import { Mark, MARKS, type MarkId } from "@/components/Mark";
import { Cover } from "./Cover";
import { copy } from "@/copy";
import { GAMES, SONGS, PLACES, byId, pickFor, handlesFor, placeLabel } from "@/lib/library";
import { getSky } from "@/scene/sky-data";
import { thread as buildThread } from "@/lib/echoes";
import { cue } from "@/lib/audio";
import { useSequence } from "@/store/sequence";
import { useUI } from "@/store/ui";
import { Window } from "./Window";
import "./profile-window.css";

const OWN_TABS = ["Board", "Games", "Sound", "Links", "Theme"] as const;
const THEIR_TABS = ["Board", "Games", "Sound"] as const;

const HUES = [258, 268, 278, 292, 306, 322, 336];
const BANNERS = [0, 1, 2, 3];

const ACCENTS = [
  { id: "violet", label: "Violet", swatch: "#b026ff" },
  { id: "magenta", label: "Magenta", swatch: "#fa42b0" },
  { id: "indigo", label: "Indigo", swatch: "#6f5bff" },
  { id: "ice", label: "Ice", swatch: "#9db4ff" },
] as const;

/**
 * A profile, yours or somebody else's.
 *
 * One component for both, because a profile you can edit and a profile you can
 * only read should not be two different-looking things - the difference is
 * which controls are there, not what it is.
 *
 * Everyone's profile carries their own colour: the whole window is tinted by
 * the hue that person chose, so visiting somebody feels like walking into
 * their room rather than reading their row in a database.
 */
export function ProfileWindow({ star }: { star: number | null }) {
  const own = star === null;

  const profile = useSequence((s) => s.profile);
  const patch = useSequence((s) => s.patchProfile);
  const settings = useSequence((s) => s.settings);
  const setSettings = useSequence((s) => s.setSettings);
  const friends = useSequence((s) => s.friends);
  const toggleFriend = useSequence((s) => s.toggleFriend);
  const sendDM = useSequence((s) => s.sendDM);
  const dms = useSequence((s) => s.dms);

  const setPanel = useUI((s) => s.setPanel);
  const closeProfile = useUI((s) => s.closeProfile);
  const tab = useUI((s) => s.tab.profile);
  const setTab = useUI((s) => s.setTab);

  const [msg, setMsg] = useState("");

  const sky = useMemo(() => getSky(), []);
  const them = star !== null ? sky.stars[star] : null;

  /** Everything below reads from one shape, whoever it belongs to. */
  const view = useMemo(() => {
    if (own) {
      return {
        name: profile?.name ?? "",
        hue: profile?.hue ?? 276,
        mark: (profile?.mark as MarkId) ?? "star",
        bio: profile?.bio ?? "",
        status: profile?.status ?? "",
        traits: profile?.traits ?? [],
        worlds: profile?.worlds ?? [],
        games: profile?.games ?? [],
        songs: profile?.songs ?? [],
        favourite: profile?.favouriteGame,
        banner: profile?.banner ?? 0,
        links: profile?.links ?? [],
        since: "You arrived here",
      };
    }
    const t = them!;
    return {
      name: t.name,
      hue: t.hue,
      mark: MARKS[t.id % MARKS.length] as MarkId,
      bio: "",
      status: "",
      traits: t.traits,
      worlds: [sky.constellations[t.constellation].world],
      games: pickFor(t.id, GAMES, 6),
      songs: pickFor(t.id + 91, SONGS, 4),
      favourite: pickFor(t.id, GAMES, 6)[0],
      banner: t.id % BANNERS.length,
      links: handlesFor(t.id, t.name),
      since: `Listening in ${sky.constellations[t.constellation].world}`,
    };
  }, [own, profile, them, sky]);

  if (own && !profile) return null;
  if (!own && !them) return null;

  const isFriend = star !== null && friends.includes(star);
  // Both sides, oldest first. A column of only your own messages is not a
  // conversation, it is a transcript of you talking to a wall.
  const thread =
    star !== null ? buildThread(dms.filter((d) => d.withStar === star)) : [];

  const toggleIn = (key: "games" | "songs", id: string) => {
    const cur = (profile?.[key] ?? []) as string[];
    patch({ [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  };

  return (
    <Window
      title={view.name}
      subtitle={view.worlds.join("  ·  ")}
      tabs={own ? OWN_TABS : THEIR_TABS}
      active={own ? tab : tab === "Links" || tab === "Theme" ? "Board" : tab}
      onTab={(t) => setTab("profile", t)}
      onClose={() => (own ? setPanel(null) : closeProfile())}
      accent={view.hue}
    >
      <div className="pw">
        {/* ------------------------------------------------------ identity */}
        <aside className="pw__id">
          <div className="pw__banner" data-b={view.banner} />

          <div className="pw__avatar">
            <Mark mark={view.mark} hue={view.hue} size={62} />
          </div>

          <div className="pw__head">
            {own ? (
              <input
                className="pw__name-in"
                value={view.name}
                onChange={(e) => patch({ name: e.target.value.slice(0, 24) })}
                aria-label="Name"
              />
            ) : (
              <h2 className="pw__name">{view.name}</h2>
            )}

            <div className="pw__badges">
              {view.traits.slice(0, 3).map((t) => (
                <span className="pw__badge" key={t}>
                  {t}
                </span>
              ))}
            </div>

            {!own && (
              <div className="pw__actions">
                <button
                  className="u-btn u-btn--go pw__act"
                  data-on={isFriend}
                  onClick={() => {
                    toggleFriend(star!);
                    cue("tick");
                  }}
                >
                  {isFriend ? "Friends" : "Add Friend"}
                </button>
              </div>
            )}

            {own ? (
              <>
                <input
                  className="u-input"
                  value={view.status}
                  placeholder="Set a status"
                  onChange={(e) => patch({ status: e.target.value.slice(0, 60) })}
                />
                <textarea
                  className="u-textarea pw__bio-in"
                  value={view.bio}
                  placeholder="What you are here for"
                  onChange={(e) => patch({ bio: e.target.value.slice(0, 180) })}
                />
              </>
            ) : (
              <p className="pw__since">{view.since}</p>
            )}

            {/* Talking to somebody happens here, not somewhere else. */}
            {!own && (
              <div className="pw__dm">
                <span className="u-label">Message</span>
                {thread.length > 0 && (
                  <div className="pw__thread">
                    {thread.slice(-5).map((d) => (
                      <p
                        key={d.id}
                        className="pw__msg"
                        data-mine={d.mine}
                        title={d.onText ? `on “${d.onText}”` : undefined}
                      >
                        {d.onText && (
                          <span className="pw__msg-on">on “{d.onText}”</span>
                        )}
                        {d.text}
                      </p>
                    ))}
                  </div>
                )}
                <div className="pw__dm-row">
                  <input
                    className="u-input"
                    value={msg}
                    placeholder={`Say something to ${view.name}`}
                    onChange={(e) => setMsg(e.target.value.slice(0, 240))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && msg.trim()) {
                        sendDM(star!, view.name, msg.trim());
                        setMsg("");
                        cue("tick");
                      }
                    }}
                  />
                  <button
                    className="u-btn u-btn--ghost"
                    disabled={!msg.trim()}
                    onClick={() => {
                      sendDM(star!, view.name, msg.trim());
                      setMsg("");
                      cue("tick");
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ---------------------------------------------------------- body */}
        <div className="pw__body">
          {tab === "Board" && (
            <>
              {view.favourite && (
                <section className="u-card pw__fav">
                  <h3 className="u-h">Favourite game</h3>
                  <div className="pw__fav-row">
                    <Cover title={byId(view.favourite)?.title ?? ""} size={104} />
                    <div>
                      <b>{byId(view.favourite)?.title}</b>
                      <span>{byId(view.favourite)?.by}</span>
                    </div>
                  </div>
                </section>
              )}

              <section className="u-card">
                <h3 className="u-h">Games</h3>
                <div className="pw__shelf">
                  {view.games.length === 0 && (
                    <p className="u-empty">Nothing on the shelf</p>
                  )}
                  {view.games.slice(0, 8).map((id) => (
                    <figure className="pw__tile" key={id}>
                      <Cover title={byId(id)?.title ?? ""} size={92} />
                      <figcaption>{byId(id)?.title}</figcaption>
                    </figure>
                  ))}
                </div>
              </section>

              <section className="u-card">
                <h3 className="u-h">Sound</h3>
                {view.songs.length === 0 && <p className="u-empty">Nothing yet</p>}
                {view.songs.slice(0, 5).map((id) => (
                  <div className="pw__song" key={id}>
                    <Cover title={byId(id)?.title ?? ""} size={44} radius={8} />
                    <div className="u-row__main">
                      <span className="u-row__title">{byId(id)?.title}</span>
                      <span className="u-row__meta">{byId(id)?.by}</span>
                    </div>
                  </div>
                ))}
              </section>

              <section className="u-card">
                <h3 className="u-h">Worlds</h3>
                <div className="u-chips">
                  {view.worlds.map((w) => (
                    <span className="u-chip" data-on="true" key={w}>
                      {w}
                    </span>
                  ))}
                </div>
              </section>

              {view.links.length > 0 && (
                <section className="u-card">
                  <h3 className="u-h">Elsewhere</h3>
                  <div className="pw__links">
                    {view.links.map((l) => (
                      <span className="pw__link" key={l.label}>
                        <b>{placeLabel(l.label)}</b>
                        {l.value}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {tab === "Games" && (
            <section className="u-card">
              <h3 className="u-h">{own ? "Your shelf" : `${view.name} plays`}</h3>
              <div className="pw__shelf">
                {(own ? GAMES : GAMES.filter((g) => view.games.includes(g.id))).map(
                  (g) => (
                    <figure
                      className="pw__tile"
                      key={g.id}
                      data-on={view.games.includes(g.id)}
                      data-pick={own}
                      onClick={own ? () => toggleIn("games", g.id) : undefined}
                    >
                      <Cover title={g.title} size={92} />
                      <figcaption>{g.title}</figcaption>
                    </figure>
                  ),
                )}
              </div>
              {own && (
                <p className="u-hint" style={{ marginTop: "1rem" }}>
                  Click to add or remove. The first one you pick is your
                  favourite.
                </p>
              )}
            </section>
          )}

          {tab === "Sound" && (
            <section className="u-card">
              <h3 className="u-h">{own ? "Your songs" : `${view.name} listens to`}</h3>
              {(own ? SONGS : SONGS.filter((s) => view.songs.includes(s.id))).map(
                (s) => (
                  <button
                    className="pw__song pw__song--pick"
                    key={s.id}
                    data-on={view.songs.includes(s.id)}
                    onClick={own ? () => toggleIn("songs", s.id) : undefined}
                    disabled={!own}
                  >
                    <Cover title={s.title} size={44} radius={8} />
                    <div className="u-row__main">
                      <span className="u-row__title">{s.title}</span>
                      <span className="u-row__meta">{s.by}</span>
                    </div>
                  </button>
                ),
              )}
            </section>
          )}

          {own && tab === "Links" && (
            <section className="u-card">
              <h3 className="u-h">Elsewhere</h3>
              <p className="u-hint" style={{ lineHeight: 1.7 }}>
                Stored in this browser. Nothing is verified and nothing is sent
                anywhere, so these are handles rather than links - ECHO has no
                way to know that any of them is really you.
              </p>
              <div className="pw__places">
                {PLACES.map((pl) => (
                  <label className="pw__place" key={pl.id}>
                    <span>{pl.label}</span>
                    <input
                      className="u-input"
                      value={
                        view.links.find((l) => l.label === pl.id)?.value ?? ""
                      }
                      placeholder="handle"
                      onChange={(e) => {
                        const value = e.target.value.slice(0, 32);
                        const rest = view.links.filter(
                          (l) => l.label !== pl.id,
                        );
                        patch({
                          links: value
                            ? [...rest, { label: pl.id, value }]
                            : rest,
                        });
                      }}
                    />
                  </label>
                ))}
              </div>
            </section>
          )}

          {own && tab === "Theme" && (
            <>
              <section className="u-card">
                <h3 className="u-h">Your colour</h3>
                <p className="u-hint" style={{ marginBottom: "0.9rem" }}>
                  This tints your mark, your star in the sky, your cursor, and
                  every surface of your own interface.
                </p>
                <div className="pw__hues">
                  {HUES.map((h) => (
                    <button
                      key={h}
                      className="pw__hue"
                      data-on={h === view.hue}
                      onClick={() => patch({ hue: h })}
                      aria-label={`hue ${h}`}
                      style={{ "--h": h } as React.CSSProperties}
                    />
                  ))}
                </div>
              </section>

              <section className="u-card">
                <h3 className="u-h">Mark</h3>
                <div className="pw__marks">
                  {MARKS.map((m) => (
                    <button
                      key={m}
                      className="pw__mark"
                      data-on={m === view.mark}
                      onClick={() => patch({ mark: m })}
                      aria-label={m}
                    >
                      <Mark mark={m} hue={view.hue} size={26} glow={m === view.mark} />
                    </button>
                  ))}
                </div>
              </section>

              <section className="u-card">
                <h3 className="u-h">Banner</h3>
                <div className="pw__banners">
                  {/* Both classes: the gradients are defined on .pw__banner,
                      the swatch sizing on .pw__banner-pick. With only the
                      latter these render as four empty outlines. */}
                  {BANNERS.map((b) => (
                    <button
                      key={b}
                      className="pw__banner pw__banner-pick"
                      data-b={b}
                      data-on={b === view.banner}
                      onClick={() => patch({ banner: b })}
                      aria-label={`banner ${b}`}
                    />
                  ))}
                </div>
              </section>

              <section className="u-card">
                <h3 className="u-h">Ground</h3>
                <div className="u-chips">
                  {(["dark", "light"] as const).map((m) => (
                    <button
                      key={m}
                      className="u-chip"
                      data-on={settings.mode === m}
                      onClick={() => setSettings({ mode: m })}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="u-chips" style={{ marginTop: "0.7rem" }}>
                  {ACCENTS.map((a) => (
                    <button
                      key={a.id}
                      className="u-chip"
                      data-on={settings.accent === a.id}
                      onClick={() => setSettings({ accent: a.id })}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                <p className="u-hint" style={{ marginTop: "0.9rem", lineHeight: 1.7 }}>
                  Amber is not offered. It is the colour a signal turns when it
                  is dying.
                </p>
              </section>

              <section className="u-card">
                <h3 className="u-h">{copy.profile.traitsLabel}</h3>
                <div className="u-chips">
                  {copy.traits.map((t) => (
                    <button
                      key={t}
                      className="u-chip"
                      data-on={view.traits.includes(t)}
                      onClick={() =>
                        patch({
                          traits: view.traits.includes(t)
                            ? view.traits.filter((x) => x !== t)
                            : view.traits.length >= 5
                              ? view.traits
                              : [...view.traits, t],
                        })
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </Window>
  );
}
