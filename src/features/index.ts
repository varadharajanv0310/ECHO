/**
 * The feature layer: ECHO's mechanics under the names everybody else uses.
 *
 * This project names things after what they mean rather than after what they
 * resemble. A post is a **signal**, because it is addressed to a place instead
 * of an audience. Sharing is **carrying**, because a signal only travels while
 * somebody is willing to hold it. A community is a **World**. The vocabulary
 * is the argument, and the interface keeps it.
 *
 * That is a good decision for the product and a bad one for anybody reading
 * the source for the first time, who is looking for `createPost` and finds
 * `emit`. This module is the bridge: one place that states the mapping, and
 * gives every capability a conventional name that delegates to the real one.
 *
 * Nothing here reimplements anything. Each function is a rename with the
 * translation written down beside it.
 *
 * | Conventional | ECHO | Where it lives |
 * | --- | --- | --- |
 * | post / create | signal / emit | `features/posts` |
 * | share / repost | carry | `features/posts` |
 * | comment / reply | reply to a signal | `features/messaging` |
 * | feed / timeline | your own sky | `features/feed` |
 * | community / group | World | `features/feed` |
 * | search / explore | search, browse | `features/discovery` |
 * | follow / friend | add | `features/profile` |
 * | profile / account | profile | `features/profile` |
 * | direct message | message | `features/messaging` |
 * | notifications | what arrived while you were away | `features/notifications` |
 *
 * @packageDocumentation
 */

export * from "./posts";
export * from "./feed";
export * from "./discovery";
export * from "./profile";
export * from "./messaging";
export * from "./notifications";
