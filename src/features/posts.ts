import { useSequence } from "@/store";
import type { Emission, Carried } from "@/types";

/**
 * Content creation and sharing.
 *
 * A **post** in ECHO is a signal: text addressed to a place rather than to an
 * audience, with a lifetime it cannot outlive unless somebody carries it.
 *
 * @packageDocumentation
 */

/** How long a new post may live if nobody carries it, in hours. */
export const POST_LIFETIMES = [12, 24, 72] as const;

/** The longest a post may be. */
export const POST_MAX_LENGTH = 240;

/**
 * Create and publish a post.
 *
 * There is no draft and no schedule: publishing is the only thing you can do
 * with a composed post, because holding one back implies reach you control.
 *
 * @param community - the World it is published into
 * @param text - the body, capped at {@link POST_MAX_LENGTH}
 * @param lifetimeHours - one of {@link POST_LIFETIMES}
 */
export function createPost(community: string, text: string, lifetimeHours: number) {
  useSequence.getState().emit(community, text.slice(0, POST_MAX_LENGTH), lifetimeHours);
}

/**
 * Share somebody else's post - the repost, and the only way anything travels.
 *
 * Sharing here is not a counter. It adds the post to your own space, credits
 * the person who wrote it, and resets the clock it dies on; stop sharing and
 * it resumes dying. Reach is a consequence of people holding a thing, which is
 * what a reshare always claimed to measure.
 *
 * @param postId - the id of the post being shared
 * @param author - who wrote it, kept with the copy
 * @param hue - their colour, so a shared post keeps the mark of where it came from
 * @param text - the body
 */
export function sharePost(postId: number, author: string, hue: number, text: string) {
  useSequence.getState().carry(postId, author, hue, text);
}

/** Stop sharing a post. It resumes dying from where it left off. */
export function unsharePost(postId: number) {
  useSequence.getState().drop(postId);
}

/** Every post the current user has published. */
export function useMyPosts(): Emission[] {
  return useSequence((s) => s.emissions);
}

/** Every post the current user has shared. */
export function useSharedPosts(): Carried[] {
  return useSequence((s) => s.carried);
}

/** Whether a given post is already in the current user's shared set. */
export function useHasShared(postId: number): boolean {
  return useSequence((s) => s.carried.some((c) => c.source === postId));
}
