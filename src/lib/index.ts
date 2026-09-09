/**
 * The former home of everything that was not a component.
 *
 * `lib/` had become the drawer: React hooks next to pure maths next to a Web
 * Audio graph next to a data catalogue. Those are four different kinds of
 * module, with four different reasons to change and four different testing
 * stories, so they are now four directories:
 *
 *   `@/hooks`      React hooks - useExit, useLenis, useUnseen
 *   `@/utils`      pure functions - maths, resolution policy, feature probes
 *   `@/services`   the stateful, side-effecting layer - audio, echoes, library
 *   `@/constants`  tuning tables
 *
 * This module re-exports all of it so an existing import keeps working, and so
 * that a consumer wanting several of them can still take one import. Prefer
 * the specific barrel in new code: it says which layer you are reaching into.
 *
 * @packageDocumentation
 */

export * from "@/utils";
export * from "@/hooks";
export * from "@/services";
export * from "@/constants";
