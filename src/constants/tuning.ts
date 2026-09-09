/**
 * Live tuning values, written by the leva panel and read inside animation
 * frames.
 *
 * Deliberately a plain mutable object rather than store state: these are
 * dragged continuously while looking at the result, and routing them through
 * React would re-render the tree on every pixel of slider movement. Nothing
 * here affects behaviour, only exposure.
 */
export const tuning = {
  road: 1,
  galaxy: 1,
};
