import { useSequence } from "@/store";
import type { Profile } from "@/types";

/**
 * Accounts, personalisation and connections.
 *
 * There is no sign-up, no password and no server: an account here is a profile
 * held in this browser, and "following" somebody is adding them.
 *
 * @packageDocumentation
 */

/** The signed-in user's profile, or null before one has been created. */
export function useCurrentUser(): Profile | null {
  return useSequence((s) => s.profile);
}

/** Create the account. Name, colour, mark and the communities you join. */
export function createAccount(profile: Profile) {
  useSequence.getState().setProfile(profile);
}

/** Update any part of the profile. Merges rather than replaces. */
export function updateProfile(changes: Partial<Profile>) {
  useSequence.getState().patchProfile(changes);
}

/** Follow or unfollow another user. */
export function toggleFollow(userId: number) {
  useSequence.getState().toggleFriend(userId);
}

/** Everyone the current user follows. */
export function useFollowing(): number[] {
  return useSequence((s) => s.friends);
}

/** Whether the current user follows a given user. */
export function useIsFollowing(userId: number): boolean {
  return useSequence((s) => s.friends.includes(userId));
}

/** Theme, accent, motion and grain - the personalisation surface. */
export function useUserSettings() {
  return useSequence((s) => s.settings);
}

/** Change one or more preferences. Merges rather than replaces. */
export function updateSettings(
  changes: Partial<ReturnType<typeof useSequence.getState>["settings"]>,
) {
  useSequence.getState().setSettings(changes);
}
