export type SkyLabel = {
  x: number;
  y: number;
  text: string;
  kind: 0 | 1 | 2;
  id: number;
  hovered: boolean;
  /** Set only on something you are holding for somebody else. */
  from?: string;
};

/**
 * Screen positions for the DOM label layer, rewritten every frame by the sky
 * and read by the HUD.
 *
 * This lives in its own module rather than inside the Sky component on purpose.
 * When a shared mutable buffer is exported from a component file, every other
 * file that wants it becomes a second importer of that component - and if the
 * two import paths differ at all (a relative path here, an alias there) the dev
 * server can hand back two separate module instances. That happened: the scene
 * rendered one copy of Sky while edits landed in the other, and the symptom was
 * a component that visibly drew the screen while behaving as if it never ran.
 *
 * Labels are DOM rather than sprites because they are type - names of places
 * and names of people - and type rendered into a texture at this scale is
 * always slightly wrong.
 */
export const skyLabels: { list: SkyLabel[] } = { list: [] };
