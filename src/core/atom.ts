import { Loadable } from "./loadable";
import { LycorisState, PrimitiveAtom } from "./state";

type AtomOptionsWithoutDefault<T> = {
  key?: string;
};

type AtomOptionsWithDefault<T> = {
  default: Loadable<T> | T;
} & AtomOptionsWithoutDefault<T>;

type AtomOptions<T> = AtomOptionsWithoutDefault<T> | AtomOptionsWithDefault<T>;

type AtomFunction = {
  // with defaults
  <TState>(options: AtomOptionsWithDefault<TState>): LycorisState<TState>;

  // without defaults
  <TState>(options?: undefined): LycorisState<TState | undefined>;
  <TState>(options: AtomOptionsWithoutDefault<TState>): LycorisState<
    TState | undefined
  >;
};

const atom: AtomFunction = (options) => {
  if (options && "default" in options) {
    return new PrimitiveAtom({
      initializer: options.default,
    }) as any;
  }

  return new PrimitiveAtom({
    initializer: undefined,
  }) as any;
};

export { atom };
