import { useEffect } from "react";
import { Leva, useControls, folder } from "leva";
import { FluidParticlesBackground } from "@/components/ui/fluid-particles-background";
import { GrainLayer } from "@/components/layers/GrainLayer";
import { Vignette } from "@/components/layers/Vignette";
import { Defs } from "@/components/Defs";
import { Hud } from "@/components/Hud";
import { Scene } from "@/scene/Scene";
import { Cursor } from "@/components/Cursor";
import { Sound } from "@/components/Sound";
import { Entry } from "@/beats/Entry";
import { Passage } from "@/beats/Passage";
import { GalaxyBeat } from "@/beats/GalaxyBeat";
import { Ignition } from "@/beats/Ignition";
import { Profile } from "@/beats/Profile";
import { ConstellationHud } from "@/beats/ConstellationHud";
import { Panels } from "@/ui/Panels";
import { useLenis } from "@/lib/useLenis";
import { useSequence, LAYER_MIX } from "@/store/sequence";
import { tuning } from "@/lib/tuning";

/** Panel is on in dev, and reachable on the deployed build with ?debug. */
const PANEL =
  import.meta.env.DEV ||
  (typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("debug"));

export default function App() {
  const phase = useSequence((s) => s.phase);
  const passageProgress = useSequence((s) => s.passageProgress);
  const setPhase = useSequence((s) => s.setPhase);
  const mix = LAYER_MIX[phase];
  const grainSetting = useSequence((s) => s.settings.grain);
  const mode = useSequence((s) => s.settings.mode);
  const accent = useSequence((s) => s.settings.accent);

  // Theme lives on the document element so it reaches the fixed layers and the
  // canvases, which sit outside any React-owned wrapper.
  const myHue = useSequence((s) => s.profile?.hue ?? 276);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mode = mode;
    root.dataset.accent = accent;
    root.style.colorScheme = mode;
    // Every glass surface, border and glow in the interface is derived from
    // this, so the colour a person picked for themselves is the colour of
    // their whole ECHO rather than just their mark.
    root.style.setProperty("--accent-h", String(myHue));
  }, [mode, accent, myHue]);

  useLenis();

  // Arriving at the sky without a profile is only possible by jumping straight
  // to a phase. Give them an anonymous one rather than a dead Profile button.
  useEffect(() => {
    if (phase !== "constellation") return;
    if (useSequence.getState().profile) return;
    useSequence.getState().setProfile({
      name: "Unregistered",
      hue: 276,
      mark: "star",
      worlds: ["3AM"],
      bio: "",
      traits: [],
    });
  }, [phase]);

  // The road runs out and the galaxy is what is left.
  useEffect(() => {
    if (phase === "passage" && passageProgress > 0.995) {
      useSequence.setState({ passageProgress: 1 });
      setPhase("galaxy");
    }
  }, [phase, passageProgress, setPhase]);

  // Multipliers over the per-phase mix, so tuning by eye never destroys the
  // relative balance between phases - it scales the whole curve.
  const c = useControls({
    Grain: folder(
      {
        grain: { value: 1, min: 0, max: 2, step: 0.01, label: "amount" },
        grainSize: { value: 1, min: 0.4, max: 4, step: 0.1, label: "speck px" },
        grainContrast: { value: 1, min: 0.2, max: 2.5, step: 0.05, label: "bite" },
        grainCadence: { value: 24, min: 6, max: 60, step: 1, label: "fps" },
      },
      { collapsed: false },
    ),
    Field: folder(
      {
        particles: { value: 1, min: 0, max: 2, step: 0.01, label: "amount" },
        particleCount: { value: 2000, min: 200, max: 8000, step: 100, label: "count" },
      },
      { collapsed: true },
    ),
    Nebula: folder(
      { nebulaBoost: { value: 1, min: 0, max: 3, step: 0.01, label: "boost" } },
      { collapsed: true },
    ),
    Scene: folder(
      {
        road: { value: 1, min: 0, max: 3, step: 0.01, label: "road" },
        galaxy: { value: 1, min: 0, max: 3, step: 0.01, label: "galaxy" },
      },
      { collapsed: true },
    ),
    Frame: folder(
      { vignette: { value: 1, min: 0, max: 2, step: 0.01, label: "vignette" } },
      { collapsed: true },
    ),
  });

  // Exposure knobs are read inside animation frames, never rendered from.
  tuning.road = c.road;
  tuning.galaxy = c.galaxy;

  return (
    <>
      <Leva hidden={!PANEL} collapsed titleBar={{ title: "ECHO" }} />

      <FluidParticlesBackground
        particleCount={c.particleCount}
        opacity={mix.particles * c.particles}
      />

      <Defs />
      <Scene />
      <Entry boost={c.nebulaBoost} />
      <Passage />
      <GalaxyBeat />
      {phase === "ignition" && <Ignition />}
      {phase === "profile" && <Profile />}
      <ConstellationHud />
      <Panels />

      <GrainLayer
        opacity={mix.grain * c.grain * grainSetting}
        size={c.grainSize}
        contrast={c.grainContrast}
        cadence={c.grainCadence}
      />
      <Vignette opacity={mix.vignette * c.vignette} />
      <Hud />
      <Sound />
      <Cursor />
    </>
  );
}
