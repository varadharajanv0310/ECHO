import { Leva, useControls, folder } from "leva";
import { FluidParticlesBackground } from "@/components/ui/fluid-particles-background";
import { GrainLayer } from "@/components/layers/GrainLayer";
import { Vignette } from "@/components/layers/Vignette";
import { Hud } from "@/components/Hud";
import { Entry } from "@/beats/Entry";
import { useSequence, LAYER_MIX } from "@/store/sequence";

/** Panel is on in dev, and reachable on the deployed build with ?debug. */
const PANEL =
  import.meta.env.DEV ||
  (typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("debug"));

export default function App() {
  const phase = useSequence((s) => s.phase);
  const mix = LAYER_MIX[phase];

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
    Frame: folder(
      { vignette: { value: 1, min: 0, max: 2, step: 0.01, label: "vignette" } },
      { collapsed: true },
    ),
  });

  return (
    <>
      <Leva hidden={!PANEL} collapsed titleBar={{ title: "ECHO" }} />

      <FluidParticlesBackground
        particleCount={c.particleCount}
        opacity={mix.particles * c.particles}
      />

      <Entry boost={c.nebulaBoost} />

      <GrainLayer
        opacity={mix.grain * c.grain}
        size={c.grainSize}
        contrast={c.grainContrast}
        cadence={c.grainCadence}
      />
      <Vignette opacity={mix.vignette * c.vignette} />
      <Hud />
    </>
  );
}
