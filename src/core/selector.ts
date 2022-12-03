import {
  LycorisState,
  LycorisValue,
  SelectorOptionsWithWriter,
  SelectorPrimitiveAtom,
  SelectorReadonlyAtom,
} from "./state";

type ReadonlySelectorOptions<T> = {
  key?: string;

  get: SelectorOptionsWithWriter<T>["reader"];
};

type ReadWriteSelectorOptions<T> = {
  set: SelectorOptionsWithWriter<T>["writer"];
} & ReadonlySelectorOptions<T>;

type SelectorOptions<T> =
  | ReadonlySelectorOptions<T>
  | ReadWriteSelectorOptions<T>;

type LycorisStateWith<
  TOptions extends SelectorOptions<TState>,
  TState
> = TOptions extends ReadWriteSelectorOptions<TState>
  ? LycorisState<TState>
  : LycorisValue<TState>;

type UnwrapOptions<T extends SelectorOptions<any>> = T extends SelectorOptions<
  infer R
>
  ? R
  : never;

const selector = <
  TStateProvided,
  TOptions extends SelectorOptions<any> = ReadonlySelectorOptions<any>,
  TStateActual = TOptions extends ReadonlySelectorOptions<any>
    ? UnwrapOptions<TOptions>
    : TStateProvided
>(
  options: TOptions
): LycorisStateWith<TOptions, TStateActual> => {
  if ("set" in options) {
    return new SelectorPrimitiveAtom<TStateActual>({
      writer: options.set,
      reader: options.get,
    });
  }

  return new SelectorReadonlyAtom<TStateActual>({
    reader: options.get,
  }) as any;
};

export { selector };
