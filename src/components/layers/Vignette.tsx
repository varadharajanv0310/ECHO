type Props = { opacity?: number };

/**
 * Light falls off toward the frame edge and stains into black rather than
 * stopping at one. Two stacked gradients: a wide radial darkening, and a
 * faint violet contamination in the corners so the black is never neutral.
 */
export function Vignette({ opacity = 0.8 }: Props) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 transition-opacity duration-1000"
      style={{ zIndex: "var(--z-vignette)", opacity }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 50%, transparent 28%, rgba(4,3,10,0.45) 68%, rgba(4,3,10,0.92) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          mixBlendMode: "screen",
          background:
            "radial-gradient(90% 70% at 50% 108%, rgba(139,47,248,0.10), transparent 62%)",
        }}
      />
    </div>
  );
}
