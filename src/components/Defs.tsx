/**
 * Shared SVG filter definitions, mounted once at the app root.
 *
 * These live outside any beat because more than one beat uses them - the
 * wordmark bleed and the passage streak are the same filters - and a filter
 * referenced by url() silently does nothing if the element defining it has
 * unmounted.
 *
 * The two-value stdDeviation is the point: blurring several times harder
 * vertically than horizontally is what turns a letter stem into a falling
 * strand of light rather than a soft halo.
 */
export function Defs() {
  return (
    <svg
      aria-hidden
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        <filter id="echo-bleed-soft" x="-30%" y="-20%" width="160%" height="150%">
          <feGaussianBlur stdDeviation="8 52" />
        </filter>
        <filter id="echo-bleed-tight" x="-30%" y="-20%" width="160%" height="150%">
          <feGaussianBlur stdDeviation="2.4 22" />
        </filter>
        <filter id="echo-chroma" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="4 6" />
        </filter>
      </defs>
    </svg>
  );
}
