/**
 * Lycoris is a state management library inspired by Recoil and Jotai, but for Vue.
 * You can use store as a React Hooks and simpler than Vuex and Pinia.
 *
 *
 * Why Lycoris?
 * Please visit https://lycoris-recoil.com and see it anime.
 */
export { useLycorisStore } from "./composables/useLycorisStore";
export { useLycorisState, useAtom } from "./composables/useLycorisState";
export { useLycorisValue, useAtomValue } from "./composables/useLycorisValue";
export {
  useSetLycorisState,
  useSetAtom,
} from "./composables/useSetLycorisState";

export { atom } from "./core/atom";
export { selector } from "./core/selector";

export type { UnwrapAtom } from "./core/type-utils";
