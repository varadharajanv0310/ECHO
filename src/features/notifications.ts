import { useUnseen, markSeen } from "@/hooks";

/**
 * Notifications.
 *
 * ECHO does not push anything at you: there is no badge that grows while you
 * are reading, no interruption, and nothing that arrives as a banner. What
 * exists is a count of things that happened while you were away, which clears
 * the moment you look.
 *
 * @packageDocumentation
 */

/** How many responses have arrived since the activity view was last opened. */
export function useNotificationCount(): number {
  return useUnseen();
}

/** Mark everything as read. Called when the activity view opens. */
export function markNotificationsRead() {
  markSeen();
}
