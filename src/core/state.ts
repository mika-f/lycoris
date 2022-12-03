import { Loadable } from "./loadable";

type Getter = {
  <Value>(atom: IAtom<Value>): Value;
};

type Setter = {
  <Value, Result extends void>(
    atom: IWritableAtom<Value, undefined, Result>
  ): Result;
  <Value, Update, Result extends void>(
    atom: IWritableAtom<Value, Update, Result>,
    update: Update
  ): Result;
};

type Read<TValue> = (get: Getter) => TValue;

type Write<TUpdate, TResult> = (
  get: Getter,
  set: Setter,
  update: TUpdate
) => TResult;

type SetAtom<TUpdate, TResult extends void> = TUpdate extends undefined
  ? () => TResult
  : (update: TUpdate) => TResult;

type OnUnmount = () => void;
type OnMount<TUpdate, TResult extends void> = <
  S extends SetAtom<TUpdate, TResult>
>(
  setAtom: S
) => OnUnmount | void;

interface IAtom<TValue> {
  read: Read<TValue>;
}

interface IWritableAtom<TValue, TUpdate, TResult extends void = void>
  extends IAtom<TValue> {
  write: Write<TUpdate, TResult>;

  onMount?: OnMount<TUpdate, TResult>;
}

type SetStateAction<TValue> = TValue | ((previous: TValue) => TValue);

interface IPrimitiveAtom<TValue>
  extends IWritableAtom<TValue, SetStateAction<TValue>> {}

type AtomOptions<TValue> = {
  initializer?: TValue | Loadable<TValue>;
};

class ReadonlyAtom<TValue> implements IAtom<TValue> {
  protected initializer: Loadable<TValue> | undefined;
  protected value: TValue | undefined;

  constructor(options: AtomOptions<TValue>) {
    const initializer = options.initializer;
    if (typeof initializer === "function") {
      this.initializer = initializer as Loadable<TValue>;
    } else {
      this.value = initializer;
    }
  }

  public read(get: Getter): TValue {
    return this.initializer ? this.initializer() : get(this);
  }
}

class Atom<TValue, TUpdate, TResult extends void = void>
  extends ReadonlyAtom<TValue>
  implements IWritableAtom<TValue, TUpdate, TResult>
{
  public write(get: Getter, set: Setter, update: TUpdate): TResult {
    return set(this, typeof update === "function" ? update(get(this)) : update);
  }
}

class PrimitiveAtom<TValue>
  extends ReadonlyAtom<TValue>
  implements IPrimitiveAtom<TValue>
{
  public write(get: Getter, set: Setter, update: SetStateAction<TValue>): void {
    if (typeof update === "function") {
      const func: (previous: TValue) => TValue = update as never;

      set(this, func(get(this)));
    } else {
      set(this, update);
    }
  }
}

type GetLycorisValue = <TValue>(value: LycorisValue<TValue>) => TValue;

type SetLycorisState = <TValue>(
  state: IWritableAtom<TValue, any, any>,
  newValue: TValue | ((prev: TValue) => TValue)
) => void;

type SelectorOptions<TValue> = {
  reader: (opts: { get: GetLycorisValue }) => TValue;
};

type SelectorOptionsWithWriter<TValue> = {
  writer: (
    opts: { get: GetLycorisValue; set: SetLycorisState },
    newValue: TValue
  ) => void;
} & SelectorOptions<TValue>;

class SelectorReadonlyAtom<TValue> implements IAtom<TValue> {
  private reader: SelectorOptionsWithWriter<TValue>["reader"];

  constructor(options: SelectorOptions<TValue>) {
    this.reader = options.reader;
  }

  public read(get: Getter): TValue {
    return this.reader({ get });
  }
}

class SelectorAtom<TValue, TUpdate, TResult extends void = void>
  extends SelectorReadonlyAtom<TValue>
  implements IWritableAtom<TValue, TUpdate, TResult>
{
  private writer: SelectorOptionsWithWriter<TValue>["writer"];

  constructor(options: SelectorOptionsWithWriter<TValue>) {
    super(options);
    this.writer = options.writer;
  }

  public write(get: Getter, set: Setter, update: TUpdate): TResult {
    const ret = this.writer(
      { get, set },
      typeof update === "function" ? update(get(this)) : update
    );
    return ret as TResult;
  }
}

class SelectorPrimitiveAtom<TValue>
  extends SelectorReadonlyAtom<TValue>
  implements IPrimitiveAtom<TValue>
{
  private writer: SelectorOptionsWithWriter<TValue>["writer"];

  constructor(options: SelectorOptionsWithWriter<TValue>) {
    super(options);
    this.writer = options.writer;
  }

  public write(get: Getter, set: Setter, update: SetStateAction<TValue>): void {
    if (typeof update === "function") {
      const func: (previous: TValue) => TValue = update as never;

      this.writer({ get, set }, func(get(this)));
    } else {
      this.writer({ get, set }, update);
    }
  }
}

type LycorisState<
  TValue,
  TUpdate = unknown,
  TResult extends void = void
> = TUpdate extends unknown
  ? PrimitiveAtom<TValue> | SelectorPrimitiveAtom<TValue>
  : Atom<TValue, TUpdate, TResult> | SelectorAtom<TValue, TUpdate, TResult>;

type LycorisValueReadonly<TValue> =
  | ReadonlyAtom<TValue>
  | SelectorReadonlyAtom<TValue>;

type LycorisValue<TValue> = LycorisState<TValue> | LycorisValueReadonly<TValue>;

export {
  ReadonlyAtom,
  PrimitiveAtom,
  Atom,
  SelectorReadonlyAtom,
  SelectorPrimitiveAtom,
  SelectorAtom,
};

export type {
  IAtom,
  IWritableAtom,
  SelectorOptionsWithWriter,
  LycorisState,
  LycorisValueReadonly,
  LycorisValue,
  SetStateAction,
};
