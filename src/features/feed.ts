import { useMemo } from "react";
import { getSky } from "@/scene/sky-data";
import { useSequence } from "@/store";
import { copy } from "@/copy";
import type { Sky, Star, Planet } from "@/types";

/**
 * The feed, and the communities it is drawn from.
 *
 * ECHO has no timeline in the usual sense, and that is the point rather than
 * an omission: there is no ranking function, no chronological river and no
 * infinite scroll. What replaces it is a place you stand in, and the posts
 * visible from there.
 *
 * The functions here are the feed's read side, named conventionally.
 *
 * @packageDocumentation
 */

/** Every community, in the order they are drawn. */
export const COMMUNITIES: readonly string[] = copy.worlds;

/** The whole content graph: communities, users and their posts. */
export function useFeedData(): Sky {
  const emissions = useSequence((s) => s.emissions);
  const carried = useSequence((s) => s.carried);
  return useMemo(() => getSky(), [emissions, carried]);
}

/** Every user publishing into a given community. */
export function usersInCommunity(sky: Sky, community: string): Star[] {
  const c = sky.constellations.find((x) => x.world === community);
  return c ? c.stars.map((id) => sky.stars[id]) : [];
}

/** Every post visible in a given community. */
export function postsInCommunity(sky: Sky, community: string): Planet[] {
  const ids = new Set(usersInCommunity(sky, community).map((s) => s.id));
  return sky.planets.filter((p) => ids.has(p.star));
}

/** Every post by one user. */
export function postsByUser(sky: Sky, userId: number): Planet[] {
  return sky.planets.filter((p) => p.star === userId);
}

/**
 * Posts close to the end of their life.
 *
 * The nearest thing ECHO has to a trending list, and deliberately inverted:
 * it surfaces what is about to be lost rather than what is already winning.
 */
export function expiringPosts(sky: Sky, threshold = 0.72): Planet[] {
  return sky.planets.filter((p) => p.age > threshold);
}
