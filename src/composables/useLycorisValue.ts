import {
  computed,
  reactive,
  readonly,
  onUnmounted,
  ComputedRef,
} from "vue-demi";
import { getScopedStore, Scope } from "../core/context";
import { LycorisValue } from "../core/state";
import { HistoricalVersionObject } from "../core/store";

const useLycorisValue = <T>(
  state: LycorisValue<T>,
  scope?: Scope
): ComputedRef<T> => {
  const container = getScopedStore(scope);
  const { s: store, v: versionFromProvider } = container;

  const getAtomValue = (version?: HistoricalVersionObject): T => {
    const atomState = store.readAtom(state, version);
    if ("v" in atomState) {
      return atomState.v;
    }

    throw new Error("no atom value");
  };

  const value = reactive({ value: getAtomValue() });
  const snapshot = computed(() => value.value);

  const unsubscribe = store.subscribeAtom(state, (version) => {
    // maybe Vue bug: https://github.com/vuejs/composition-api/issues/483
    const newValue = getAtomValue(version) as any;

    console.log(newValue);

    if (Array.isArray(newValue)) {
      value.value = newValue as any;
    } else {
      value.value = newValue;
    }
  });

  onUnmounted(() => {
    unsubscribe();
  });

  /*
  const [[version, valueFromReducer, atomFromReducer], rendererIfChanged] =
    useReducer<
      Reducer<
        [HistoricalVersionObject | undefined, T, IAtom<T>],
        HistoricalVersionObject | undefined
      >,
      HistoricalVersionObject | undefined
    >(
      (prev, nextVersion) => {
        const nextValue = getAtomValue(nextVersion);
        if (Object.is(prev[1], nextValue) && prev[2] === state) {
          return prev;
        }

        return [nextVersion, nextValue, state];
      },
      versionFromProvider,
      (initialVersion: HistoricalVersionObject | undefined) => {
        const initialValue = getAtomValue(initialVersion);
        return [initialVersion, initialValue, state] as any; // any じゃないんだよ
      }
    );

  let value: T = valueFromReducer;
  if (atomFromReducer != state) {
    rendererIfChanged(version);
    value = getAtomValue(version);
  }

  useEffect(() => {
    const { v: versionFromProvider } = container;
    if (versionFromProvider) {
      store.commitAtom(state, versionFromProvider);
    }

    const unsubscribe = store.subscribeAtom(
      state,
      rendererIfChanged,
      versionFromProvider
    );
    rendererIfChanged(versionFromProvider);

    return unsubscribe;
  }, [store, state, container]);

  useEffect(() => {
    store.commitAtom(state, version);
  }, [state, version]);
  */

  return readonly(snapshot) as ComputedRef<T>;
};

const useAtomValue = useLycorisValue;

export { useLycorisValue, useAtomValue };
