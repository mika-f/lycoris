import { getScopedStore, Scope } from "../core/context";
import { LycorisState, SetStateAction } from "../core/state";
import { HistoricalVersionObject } from "../core/store";

const useSetLycorisState = <T>(
  state: LycorisState<T>,
  scope?: Scope
): ((update: SetStateAction<T>) => void) => {
  const container = getScopedStore(scope);
  const { s: store, w: versionedWrite } = container;

  const setAtom = (update: SetStateAction<T>) => {
    const write = (version?: HistoricalVersionObject) => {
      store.writeAtom(state, update, version);
      store.commitAtom(state, version);
    };
    return versionedWrite ? versionedWrite(write) : write();
  };

  return setAtom;
};

const useSetAtom = useSetLycorisState;

export { useSetLycorisState, useSetAtom };
