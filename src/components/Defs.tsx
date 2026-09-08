/**
 * Shared SVG filter definitions, mounted once at the app root.
 *
 * These live outside any beat because more than one beat uses them - the
 * wordmark bleed and the passage streak are the same filters - and a filter
 * referenced by url() silently does nothing if the element defining it has
 * unmounted.
 *
 * Two things are happening in each bleed filter:
 *
 *   feTurbulence + feDisplacementMap warps the letterforms before they are
 *   blurred, which is what makes the light look like it is running rather than
 *   like the word has a shadow. The turbulence is deliberately anisotropic
 *   (very low frequency across, higher down) so the distortion pulls
 *   vertically, along the direction the light is falling.
 *
 *   feGaussianBlur then blurs with a two-value stdDeviation, several times
 *   harder vertically than horizontally, turning every letter stem into its
 *   own falling strand instead of a soft halo.
 */
export function Defs() {
  return (
    <svg
      aria-hidden
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        <filter
          id="echo-bleed-soft"
          x="-35%"
          y="-25%"
          width="170%"
          height="165%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.004 0.021"
            numOctaves="3"
            seed="7"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="26"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="8 52" />
        </filter>

        <filter
          id="echo-bleed-tight"
          x="-35%"
          y="-25%"
          width="170%"
          height="165%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006 0.03"
            numOctaves="2"
            seed="19"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="14"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="2.4 22" />
        </filter>

        {/* Just enough displacement on the crisp layers to stop the word
            sitting perfectly flat, without costing legibility. */}
        <filter
          id="echo-warp"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.005 0.014"
            numOctaves="2"
            seed="3"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="7"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter
          id="echo-chroma"
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.005 0.016"
            numOctaves="2"
            seed="11"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="12"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="4 7" />
        </filter>
      </defs>
    </svg>
  );
}
