import type { Sky, Star, Planet } from "@/types";

/**
 * Content discovery.
 *
 * Four surfaces: search over posts, search over users, browsing by community,
 * and browsing the graph itself. None of them ranks anything - results are
 * scrambled by a hash of their own id, so nothing arrives in an order that
 * could be mistaken for a recommendation.
 *
 * @packageDocumentation
 */

/** Stable per-id scramble, unrelated to author, age or reach. */
function scramble(n: number) {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  return Math.imul(h, 0xc2b2ae35) >>> 0;
}

export type PostFilters = {
  /** Restrict to one community. */
  community?: string | null;
  /** Only posts close to expiry. */
  expiringOnly?: boolean;
  /** Maximum results. */
  limit?: number;
};

/**
 * Full-text search across every post.
 *
 * @param query - matched case-insensitively against the body
 */
export function searchPosts(
  sky: Sky,
  query: string,
  filters: PostFilters = {},
): Planet[] {
  const { community = null, expiringOnly = false, limit = 40 } = filters;
  const term = query.trim().toLowerCase();

  return sky.planets
    .filter((p) => {
      if (community) {
        const st = sky.stars[p.star];
        if (sky.constellations[st.constellation].world !== community) return false;
      }
      if (expiringOnly && p.age <= 0.72) return false;
      if (term && !p.text.toLowerCase().includes(term)) return false;
      return true;
    })
    .sort((a, b) => scramble(a.id) - scramble(b.id))
    .slice(0, limit);
}

export type UserFilters = {
  /** Restrict to users with a given interest tag. */
  trait?: string | null;
  /** Restrict to one community. */
  community?: string | null;
  limit?: number;
};

/** Search across every user, by name and by interest. */
export function searchUsers(
  sky: Sky,
  query: string,
  filters: UserFilters = {},
): Star[] {
  const { trait = null, community = null, limit = 30 } = filters;
  const term = query.trim().toLowerCase();

  return sky.stars
    .filter((s) => {
      if (trait && !s.traits.includes(trait)) return false;
      if (community && sky.constellations[s.constellation].world !== community)
        return false;
      if (term && !s.name.toLowerCase().includes(term)) return false;
      return true;
    })
    .slice(0, limit);
}
