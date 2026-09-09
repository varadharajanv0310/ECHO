import { useMemo, useState } from "react";
import { Mark, MARKS } from "@/components/Mark";
import type { MarkId } from "@/types";
import { Cover } from "./Cover";
import {
  GAMES,
  SONGS,
  byId,
  pickFor,
  handlesFor,
  placeLabel,
} from "@/services/library";
import { getSky } from "@/scene/sky-data";
import { thread as buildThread } from "@/services/echoes";
import { cue } from "@/services/audio";
import { useSequence, useUI } from "@/store";
import { Window } from "./Window";
import { GamesTab, SoundTab, LinksTab, ThemeTab, BANNERS } from "./profile/ProfileTabs";
import "./profile-window.css";

const OWN_TABS = ["Board", "Games", "Sound", "Links", "Theme"] as const;
const THEIR_TABS = ["Board", "Games", "Sound", "Messages"] as const;

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
  const openMessages = useUI((s) => s.openMessages);
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
      active={
        own
          ? tab
          : tab === "Links" || tab === "Theme" || tab === "Messages"
            ? "Board"
            : tab
      }
      onTab={(t) => {
        // Messages is a place rather than a panel of this window, so choosing
        // it leaves for the conversation instead of swapping the body.
        if (t === "Messages" && star !== null) return openMessages(star);
        setTab("profile", t);
      }}
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
              <>
                <label className="sr-only" htmlFor="pw-name">
                  Your name
                </label>
                <input
                  id="pw-name"
                  className="pw__name-in"
                  value={view.name}
                  onChange={(e) => patch({ name: e.target.value.slice(0, 24) })}
                />
              </>
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
                  type="button"
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
                <label className="sr-only" htmlFor="pw-status">
                  Status
                </label>
                <input
                  id="pw-status"
                  className="u-input"
                  value={view.status}
                  placeholder="Set a status"
                  onChange={(e) => patch({ status: e.target.value.slice(0, 60) })}
                />
                <label className="sr-only" htmlFor="pw-bio">
                  About you
                </label>
                <textarea
                  id="pw-bio"
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
                  <label className="sr-only" htmlFor="pw-dm">
                    Message {view.name}
                  </label>
                  <input
                    id="pw-dm"
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
                    type="button"
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
            <GamesTab view={view} own={own} onToggle={(id) => toggleIn("games", id)} />
          )}

          {tab === "Sound" && (
            <SoundTab view={view} own={own} onToggle={(id) => toggleIn("songs", id)} />
          )}

          {own && tab === "Links" && <LinksTab view={view} onPatch={patch} />}

          {own && tab === "Theme" && (
            <ThemeTab
              view={view}
              settings={settings}
              onPatch={patch}
              onSettings={setSettings}
            />
          )}
        </div>
      </div>
    </Window>
  );
}
