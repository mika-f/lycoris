import { watch } from "vue-demi";

declare const UNDEFINED_VOID_ONLY: unique symbol;

type Destructor = () => void | { [UNDEFINED_VOID_ONLY]: never };

type EffectCallback = () => void | Destructor;

type DependencyList = readonly unknown[];

const useEffect = (effect: EffectCallback, deps?: DependencyList) => {
  let destructor: Destructor | undefined = undefined;

  watch(
    deps ?? [],
    () => {
      if (destructor) destructor();

      const newDestructor = effect();
      if (typeof newDestructor === "function") destructor = newDestructor;
    },
    { immediate: true }
  );
};

export { useEffect };
