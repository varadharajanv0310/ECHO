import { getLenis } from "@/lib/useLenis";
import { useSequence, DEFAULT_SETTINGS } from "@/store/sequence";
import { useUI } from "@/store/ui";
import { Window } from "../Window";

export const MENU_TABS = [
  "Settings",
  "Appearance",
  "Accessibility",
  "Privacy",
] as const;

const RECEIVE = [
  "Carries",
  "Replies",
  "Signals from my Worlds",
  "Signals about to fade",
  "New Worlds",
];

const SHOW = [
  "Signals still travelling",
  "Signals fading",
  "Signals nobody carried",
  "Worlds I have left",
];

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className="u-toggle" data-on={on} onClick={onClick} aria-pressed={on}>
      <span className="u-toggle__text">{children}</span>
      <span className="u-switch" aria-hidden />
    </button>
  );
}

/**
 * Everything a person can decide about their own experience.
 *
 * Split so the choices that change what reaches you sit apart from the ones
 * that change how it looks. Accessibility is a tab rather than a line buried
 * in settings, because on a piece this loud it is not a footnote.
 */
export function MenuPanel() {
  const settings = useSequence((s) => s.settings);
  const setSettings = useSequence((s) => s.setSettings);
  const setPhase = useSequence((s) => s.setPhase);
  const setPanel = useUI((s) => s.setPanel);
  const tab = useUI((s) => s.tab.menu);
  const setTab = useUI((s) => s.setTab);

  const toggleIn = (key: "receive" | "show", v: string) => {
    const list = settings[key];
    setSettings({
      [key]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v],
    });
  };

  /** Replay the entry sequence without discarding who you are. */
  const replay = () => {
    setPanel(null);
    getLenis()?.scrollTo(0, { immediate: true, force: true });
    useSequence.setState({
      phase: "void",
      bootProgress: 0,
      passageProgress: 0,
      diveProgress: 0,
    });
    setPhase("void");
  };

  return (
    <Window
      title="Menu"
      subtitle="Nothing here leaves this browser"
      tabs={MENU_TABS}
      active={tab}
      onTab={(t) => setTab("menu", t)}
      onClose={() => setPanel(null)}
    >
      <div className="u-grid" style={{ maxWidth: 720 }}>
        {tab === "Settings" && (
          <>
            <section className="u-card">
              <h3 className="u-h">What reaches you</h3>
              <div className="u-chips">
                {RECEIVE.map((r) => (
                  <button
                    key={r}
                    className="u-chip"
                    data-on={settings.receive.includes(r)}
                    onClick={() => toggleIn("receive", r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>

            <section className="u-card">
              <h3 className="u-h">What you see in the sky</h3>
              <div className="u-chips">
                {SHOW.map((r) => (
                  <button
                    key={r}
                    className="u-chip"
                    data-on={settings.show.includes(r)}
                    onClick={() => toggleIn("show", r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>

            <section className="u-card">
              <h3 className="u-h">Replay</h3>
              <p className="u-hint" style={{ marginBottom: "0.9rem" }}>
                The entry sequence, from the first frame. Your profile and your
                signals are untouched.
              </p>
              <button className="u-btn" onClick={replay}>
                Watch the opening again
              </button>
            </section>
          </>
        )}

        {tab === "Appearance" && (
          <>
            <section className="u-card">
              <h3 className="u-h">Theme</h3>
              <p className="u-hint">
                Ground and accent live in your profile, under Theme.
              </p>
            </section>

            <section className="u-card">
              <h3 className="u-h">Film grain</h3>
              <input
                className="mn__range"
                type="range"
                min={0}
                max={1.6}
                step={0.05}
                value={settings.grain}
                onChange={(e) => setSettings({ grain: Number(e.target.value) })}
                aria-label="Grain amount"
              />
              <p className="u-hint">
                {settings.grain === 0
                  ? "Off. Cleaner, and a little more clinical."
                  : `${Math.round(settings.grain * 100)}%`}
              </p>
            </section>
          </>
        )}

        {tab === "Accessibility" && (
          <section className="u-card">
            <h3 className="u-h">Motion and light</h3>

            <Toggle
              on={settings.reducedFlash}
              onClick={() => setSettings({ reducedFlash: !settings.reducedFlash })}
            >
              Reduce flashing
            </Toggle>
            <p className="u-hint" style={{ margin: "0.6rem 0 1.2rem" }}>
              The galaxy still opens, but the frame never blows out to white.
              Recommended if bright full-screen transitions are a problem for
              you.
            </p>

            <Toggle
              on={settings.grain < 0.2}
              onClick={() =>
                setSettings({ grain: settings.grain < 0.2 ? 1 : 0 })
              }
            >
              Remove film grain
            </Toggle>
            <p className="u-hint" style={{ marginTop: "0.6rem" }}>
              Grain sits over every surface including text. Turning it off
              raises contrast everywhere.
            </p>
          </section>
        )}

        {tab === "Privacy" && (
          <>
            <section className="u-card">
              <h3 className="u-h">Who can reach you</h3>
              <div className="u-chips">
                {(
                  [
                    ["anyone", "Anyone"],
                    ["carried", "Only people who carried me"],
                    ["nobody", "Nobody"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    className="u-chip"
                    data-on={settings.whoCanAdd === id}
                    onClick={() => setSettings({ whoCanAdd: id })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="u-card">
              <h3 className="u-h">What ECHO stores</h3>
              <p className="u-hint" style={{ lineHeight: 1.7 }}>
                Your name, your mark, your Worlds and these settings, in this
                browser only. There is no account, no server and no analytics.
                Clearing your site data ends your existence here completely, and
                there is nothing anywhere else to delete.
              </p>
              <button
                className="u-btn u-btn--ghost"
                style={{ marginTop: "1rem" }}
                onClick={() => setSettings(DEFAULT_SETTINGS)}
              >
                Reset settings
              </button>
            </section>
          </>
        )}
      </div>
    </Window>
  );
}
