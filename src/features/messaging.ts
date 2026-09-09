import { useSequence } from "@/store";
import { thread as buildThread } from "@/services/echoes";
import type { DirectMessage } from "@/types";

/**
 * Direct messages, and comments on a post.
 *
 * Both are the same mechanism: a message with an optional reference to the
 * post it was said about. A comment in ECHO is addressed to a person rather
 * than parked under a post in public, because a public comment thread is an
 * audience, and this system does not have those.
 *
 * @packageDocumentation
 */

/** The longest a message may be. */
export const MESSAGE_MAX_LENGTH = 300;

/** Send a direct message to another user. */
export function sendMessage(userId: number, userName: string, text: string) {
  useSequence.getState().sendDM(userId, userName, text.slice(0, MESSAGE_MAX_LENGTH));
}

/**
 * Comment on a post.
 *
 * The same call, carrying the post's text so the recipient can see what is
 * being answered - which is the one piece of context that makes a reply worth
 * sending at all.
 */
export function commentOnPost(
  authorId: number,
  authorName: string,
  postText: string,
  text: string,
) {
  useSequence
    .getState()
    .sendDM(authorId, authorName, text.slice(0, MESSAGE_MAX_LENGTH), postText);
}

/** One full conversation, both sides, oldest first. */
export function useConversation(userId: number): DirectMessage[] {
  const dms = useSequence((s) => s.dms);
  return buildThread(dms.filter((d) => d.withStar === userId));
}

/** Every conversation the current user has open, most recent first. */
export function useConversations(): {
  userId: number;
  name: string;
  last: DirectMessage;
}[] {
  const dms = useSequence((s) => s.dms);
  const byUser = new Map<number, DirectMessage>();
  for (const d of dms) {
    const cur = byUser.get(d.withStar);
    if (!cur || d.at > cur.at) byUser.set(d.withStar, d);
  }
  return [...byUser.entries()]
    .map(([userId, last]) => ({ userId, name: last.name, last }))
    .sort((a, b) => b.last.at - a.last.at);
}
