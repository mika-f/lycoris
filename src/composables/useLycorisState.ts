import { ComputedRef } from "vue-demi";
import { LycorisState } from "../core/state";
import { useLycorisValue } from "./useLycorisValue";
import { useSetLycorisState } from "./useSetLycorisState";

const useLycorisState = <T>(
  state: LycorisState<T>
): [ComputedRef<T>, ReturnType<typeof useSetLycorisState<T>>] => {
  return [useLycorisValue(state), useSetLycorisState(state)];
};

const useAtom = useLycorisState;

export { useLycorisState, useAtom };
