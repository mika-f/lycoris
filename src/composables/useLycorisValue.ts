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

  return readonly(snapshot) as ComputedRef<T>;
};

const useAtomValue = useLycorisValue;

export { useLycorisValue, useAtomValue };
