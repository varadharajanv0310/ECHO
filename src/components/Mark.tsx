/**
 * The five marks a person can carry.
 *
 * Drawn as filled paths rather than glyphs from a font, because a mark has to
 * survive at fourteen pixels in a constellation and at two hundred in profile
 * creation. They share a 100x100 box and a single visual weight so no choice
 * is louder than another.
 *
 * The star is taken from the reference set; the rest are built around it as a
 * family - one closed, one open, one radiant, one broken.
 */
export const MARKS = ["star", "burst", "ring", "shard", "cross"] as const;
export type MarkId = (typeof MARKS)[number];

const PATHS: Record<MarkId, string> = {
  // Off-axis five-point star, leaning like the reference.
  star: "M50 4 L61 36 L95 37 L67 57 L78 90 L50 70 L22 90 L33 57 L5 37 L39 36 Z",
  // A four-point flare with concave sides - light, not geometry.
  burst:
    "M50 2 C54 30 70 46 98 50 C70 54 54 70 50 98 C46 70 30 54 2 50 C30 46 46 30 50 2 Z",
  // Open circle. A signal that has been carried and came back.
  ring: "M50 6 A44 44 0 1 1 49.9 6 Z M50 22 A28 28 0 1 0 50.1 22 Z",
  // Broken diamond - the shape of something that did not survive intact.
  shard: "M50 3 L88 50 L50 97 L12 50 Z M50 24 L31 50 L50 76 L69 50 Z",
  // Thin cross, the quietest of the five.
  cross: "M45 3 H55 V45 H97 V55 H55 V97 H45 V55 H3 V45 H45 Z",
};

type Props = {
  mark: MarkId;
  /** Any hue from the palette ramp. */
  hue?: number;
  size?: number;
  glow?: boolean;
  className?: string;
};

export function Mark({ mark, hue = 285, size = 40, glow = true, className }: Props) {
  const colour = `hsl(${hue} 100% 66%)`;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden
      style={
        glow
          ? {
              filter: `drop-shadow(0 0 ${size * 0.22}px ${colour}) drop-shadow(0 0 ${size * 0.6}px ${colour})`,
            }
          : undefined
      }
    >
      <path d={PATHS[mark]} fill="#fff" fillRule="evenodd" />
      <path
        d={PATHS[mark]}
        fill="none"
        stroke={colour}
        strokeWidth="5"
        fillRule="evenodd"
        opacity="0.85"
      />
    </svg>
  );
}
