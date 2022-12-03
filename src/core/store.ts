// store logic is cited from Jotai - Primitive and flexible state management for React
// Licensed under the MIT License - https://github.com/pmndrs/jotai/blob/main/LICENSE
import { IAtom, IWritableAtom } from "./state";

type Version = Symbol | string | number;

type HistoricalVersionObject = {
  p?: HistoricalVersionObject;
};

type Listeners = Set<(version?: HistoricalVersionObject) => void>;

type Dependents = Set<AnyAtom>;

type OnUnmount = () => void;

type Subscribers = {
  l: Listeners;
  t: Dependents;

  u?: OnUnmount;
};

type AnyAtomValue = unknown;

type AnyAtom = IAtom<AnyAtomValue>;

type AnyWritableAtom = IWritableAtom<AnyAtomValue, unknown, void>;

type WriteGetter = Parameters<AnyWritableAtom["write"]>[0];

type Setter = Parameters<AnyWritableAtom["write"]>[1];

type Revision = number;

type NotInvalidated = boolean;

type ReadDependencies = Map<AnyAtom, Revision>;

type AtomState<TValue = AnyAtomValue> =
  | {
      r: Revision;
      y: NotInvalidated;
      d: ReadDependencies;
      v: TValue;
    }
  | {
      r: Revision;
      y: NotInvalidated;
      d: ReadDependencies;
      e: Error;
    };

const createStore = () => {
  const committedAtomStateMap = new WeakMap<AnyAtom, AtomState>();
  const versionedAtomStateMapMap = new WeakMap<
    HistoricalVersionObject,
    Map<AnyAtom, AtomState>
  >();
  const pendingMap = new Map<AnyAtom, AtomState | undefined>();
  const subscriberMap = new WeakMap<AnyAtom, Subscribers>();

  const getVersionedAtomStateMap = (version: HistoricalVersionObject) => {
    let versionedAtomStateMap = versionedAtomStateMapMap.get(version);
    if (!versionedAtomStateMap) {
      versionedAtomStateMap = new Map();
      versionedAtomStateMapMap.set(version, versionedAtomStateMap);
    }

    return versionedAtomStateMap;
  };

  const getAtomState = <Value>(
    version: HistoricalVersionObject | undefined,
    atom: IAtom<Value>
  ): AtomState<Value> | undefined => {
    if (version) {
      const versionedAtomStateMap = getVersionedAtomStateMap(version);
      let atomState = versionedAtomStateMap.get(atom) as
        | AtomState<Value>
        | undefined;

      if (!atomState) {
        atomState = getAtomState(version.p, atom);

        if (atomState) {
          versionedAtomStateMap.set(atom, atomState);
        }
      }

      return atomState;
    }

    return committedAtomStateMap.get(atom) as AtomState<Value> | undefined;
  };

  const setAtomState = <Value>(
    version: HistoricalVersionObject | undefined,
    atom: IAtom<Value>,
    atomState: AtomState<Value>
  ) => {
    if (version) {
      const versionedAtomStateMap = getVersionedAtomStateMap(version);
      versionedAtomStateMap.set(atom, atomState);
    } else {
      const prevAtomState = committedAtomStateMap.get(atom);
      committedAtomStateMap.set(atom, atomState);

      if (!pendingMap.has(atom)) {
        pendingMap.set(atom, prevAtomState);
      }
    }
  };

  const createReadDependencies = (
    version: HistoricalVersionObject | undefined,
    prevReadDependencies: ReadDependencies = new Map(),
    dependencies?: Set<AnyAtom>
  ): ReadDependencies => {
    if (!dependencies) {
      return prevReadDependencies;
    }

    const readDependencies: ReadDependencies = new Map();
    let changed = false;

    dependencies.forEach((atom) => {
      const revision = getAtomState(version, atom)?.r || 0;
      readDependencies.set(atom, revision);

      if (prevReadDependencies.get(atom) !== revision) {
        changed = true;
      }
    });

    if (prevReadDependencies.size === readDependencies.size && !changed) {
      return prevReadDependencies;
    }

    return readDependencies;
  };

  const canUnsubscribeAtom = (atom: AnyAtom, subscriber: Subscribers) => {
    return (
      !subscriber.l.size &&
      (!subscriber.t.size ||
        (subscriber.t.size === 1 && subscriber.t.has(atom)))
    );
  };

  const isActuallyWritableAtom = (atom: AnyAtom): atom is AnyWritableAtom => {
    return !!(atom as AnyWritableAtom).write;
  };

  const subscribeAtomInternal = <Value>(
    version: HistoricalVersionObject | undefined,
    atom: IAtom<Value>,
    initialDependent?: AnyAtom
  ): Subscribers => {
    const subscriber: Subscribers = {
      t: new Set(initialDependent && [initialDependent]),
      l: new Set(),
    };

    subscriberMap.set(atom, subscriber);

    const atomState = readAtomState(undefined, atom);
    atomState.d.forEach((_, a) => {
      const aSubscribed = subscriberMap.get(a);
      if (aSubscribed) {
        aSubscribed.t.add(atom);
      } else {
        if (a !== atom) {
          subscribeAtomInternal(version, a, atom);
        }
      }
    });

    if (isActuallyWritableAtom(atom) && atom.onMount) {
      const setAtom = (update: unknown) => writeAtom(atom, update, version);
      const onUnmount = atom.onMount(setAtom);
      version = undefined;

      if (onUnmount) {
        subscriber.u = onUnmount;
      }
    }

    return subscriber;
  };

  const unsubscribeAtom = <Value>(
    version: HistoricalVersionObject | undefined,
    atom: IAtom<Value>
  ) => {
    const onUnmount = subscriberMap.get(atom)?.u;
    if (onUnmount) {
      onUnmount();
    }

    subscriberMap.delete(atom);

    const atomState = getAtomState(version, atom);
    if (atomState) {
      atomState.d.forEach((_, a) => {
        if (a !== atom) {
          const subscriber = subscriberMap.get(a);
          if (subscriber) {
            subscriber.t.delete(atom);
            if (canUnsubscribeAtom(a, subscriber)) {
              unsubscribeAtom(version, a);
            }
          }
        }
      });
    }
  };

  const subscribeDependencies = <Value>(
    version: HistoricalVersionObject | undefined,
    atom: IAtom<Value>,
    atomState: AtomState<Value>,
    prevReadDependencies?: ReadDependencies
  ) => {
    const dependencies = new Set(atomState.d.keys());
    prevReadDependencies?.forEach((_, a) => {
      if (dependencies.has(a)) {
        dependencies.delete(a);
        return;
      }

      const subscriber = subscriberMap.get(a);
      if (subscriber) {
        subscriber.t.delete(atom);
        if (canUnsubscribeAtom(a, subscriber)) {
          unsubscribeAtom(version, a);
        }
      }
    });

    dependencies.forEach((a) => {
      const subscriber = subscriberMap.get(a);
      if (subscriber) {
        subscriber.t.add(atom);
      } else if (subscriberMap.has(atom)) {
        subscribeAtomInternal(version, a, atom);
      }
    });
  };

  const flushPending = (version: HistoricalVersionObject | undefined) => {
    if (version) {
      const versionedAtomStateMap = getVersionedAtomStateMap(version);
      versionedAtomStateMap.forEach((atomState, atom) => {
        const committedAtomState = committedAtomStateMap.get(atom);
        if (atomState != committedAtomState) {
          const subscribers = subscriberMap.get(atom);
          subscribers?.l.forEach((listener) => listener(version));
        }
      });

      return;
    }

    while (pendingMap.size) {
      const pending = Array.from(pendingMap);
      pendingMap.clear();

      pending.forEach(([atom, prevAtomState]) => {
        const atomState = getAtomState(undefined, atom);
        if (atomState && atomState.d !== prevAtomState?.d) {
          subscribeDependencies(undefined, atom, atomState, prevAtomState?.d);
        }

        if (prevAtomState && !prevAtomState.y && atomState?.y) {
          return;
        }

        const subscriber = subscriberMap.get(atom);

        subscriber?.l.forEach((listener) => listener());
      });
    }
  };

  const setAtomValue = <Value>(
    version: HistoricalVersionObject | undefined,
    atom: IAtom<Value>,
    value: Value,
    dependencies?: Set<AnyAtom>
  ): AtomState<Value> => {
    const atomState = getAtomState(version, atom);
    const nextAtomState: AtomState<Value> = {
      v: value,
      r: atomState?.r || 0,
      y: true,
      d: createReadDependencies(version, atomState?.d, dependencies),
    };

    let changed = false;
    if (!atomState || !("v" in atomState) || !Object.is(atomState.v, value)) {
      changed = true;
      ++nextAtomState.r; // increment revision

      if (nextAtomState.d.has(atom)) {
        nextAtomState.d = new Map(nextAtomState.d).set(atom, nextAtomState.r);
      }
    } else if (
      nextAtomState.d !== atomState.d &&
      (nextAtomState.d.size !== atomState.d.size ||
        !Array.from(nextAtomState.d.keys()).every((a) => atomState.d.has(a)))
    ) {
      changed = true;

      Promise.resolve().then(() => flushPending(version));
    }

    if (atomState && !changed) {
      return atomState;
    }

    setAtomState(version, atom, nextAtomState);
    return nextAtomState;
  };

  const readAtomState = <Value>(
    version: HistoricalVersionObject | undefined,
    atom: IAtom<Value>,
    force?: boolean
  ): AtomState<Value> => {
    if (!force) {
      const atomState = getAtomState(version, atom);
      if (atomState) {
        atomState.d.forEach((_, a) => {
          if (a !== atom) {
            if (!subscriberMap.has(a)) {
              readAtomState(version, a);
            } else {
              const aState = getAtomState(version, a);
              if (aState && !aState.y) {
                readAtomState(version, a);
              }
            }
          }
        });

        if (
          Array.from(atomState.d).every(([a, r]) => {
            const aState = getAtomState(version, a);
            return aState && aState.r === r;
          })
        ) {
          if (!atomState.y) {
            return { ...atomState, y: true };
          }

          return atomState;
        }
      }
    }

    const dependencies = new Set<AnyAtom>();
    try {
      const value = atom.read(<V>(a: IAtom<V>) => {
        dependencies.add(a);

        const aState =
          (a as AnyAtom) === atom
            ? getAtomState(version, a)
            : readAtomState(version, a);
        if (aState && "v" in aState) {
          return aState.v as V;
        }

        if ("value" in a) {
          return (a as any)["value"];
        }
      });
      return setAtomValue(version, atom, value, dependencies);
    } catch (err) {
      const atomState = getAtomState(version, atom);
      const nextAtomState: AtomState<Value> = {
        e: err as Error,
        r: (atomState?.r || 0) + 1,
        y: true,
        d: createReadDependencies(version, atomState?.d, dependencies),
      };

      setAtomState(version, atom, nextAtomState);
      return nextAtomState;
    }
  };

  const readAtom = <Value>(
    readingAtom: IAtom<Value>,
    version?: HistoricalVersionObject
  ) => {
    return readAtomState(version, readingAtom);
  };

  const writeAtomState = <Value, Update, Result extends void>(
    version: HistoricalVersionObject | undefined,
    atom: IWritableAtom<Value, Update, Result>,
    update: Update
  ): Result => {
    let isSync = true;

    const writeGetter: WriteGetter = <V>(a: IAtom<V>) => {
      const aState = readAtomState(version, a);
      if ("v" in aState) {
        return aState.v as V;
      }

      throw new Error("no value found");
    };

    const setter: Setter = <V, U, R extends void>(
      a: IWritableAtom<V, U, R>,
      v?: V
    ) => {
      if ((a as AnyWritableAtom) === atom) {
        if (!("value" in atom)) {
          throw new Error("atom not writable");
        }

        const prevAtomState = getAtomState(version, a);
        const nextAtomState = setAtomValue(version, a, v);
        if (prevAtomState !== nextAtomState) {
          invalidateDependencies(version, a);
        }
      } else {
        writeAtomState(version, a as AnyWritableAtom, v);
      }

      if (!isSync) {
        flushPending(version);
      }
    };

    const ret = atom.write(writeGetter, setter, update);
    isSync = false;

    return ret;
  };

  const writeAtom = <Value, Update, Result extends void = void>(
    writingAtom: IWritableAtom<Value, Update, Result>,
    update: Update,
    version?: HistoricalVersionObject
  ): Result => {
    const result = writeAtomState(version, writingAtom, update);
    flushPending(version);

    return result;
  };

  const commitVersionedAtomStateMap = (version: HistoricalVersionObject) => {
    const versionedAtomStateMap = getVersionedAtomStateMap(version);
    versionedAtomStateMap.forEach((atomState, atom) => {
      const prevAtomState = committedAtomStateMap.get(atom);

      if (
        !prevAtomState ||
        atomState.r > prevAtomState.r ||
        atomState.y !== prevAtomState.y ||
        (atomState.r === prevAtomState.r && atomState.d !== prevAtomState.d)
      ) {
        committedAtomStateMap.set(atom, atomState);
        if (atomState.d !== prevAtomState?.d) {
          subscribeDependencies(version, atom, atomState, prevAtomState?.d);
        }
      }
    });
  };

  const commitAtom = (
    _atom: IAtom<unknown> | null,
    version?: HistoricalVersionObject
  ) => {
    if (version) {
      commitVersionedAtomStateMap(version);
    }

    flushPending(undefined);
  };

  const addAtom = (
    version: HistoricalVersionObject | undefined,
    addingAtom: AnyAtom
  ): Subscribers => {
    let subscribers = subscriberMap.get(addingAtom);
    if (!subscribers) {
      subscribers = subscribeAtomInternal(version, addingAtom);
    }

    return subscribers;
  };

  const deleteAtom = (
    version: HistoricalVersionObject | undefined,
    deletingAtom: AnyAtom
  ) => {
    const subscribers = subscriberMap.get(deletingAtom);
    if (subscribers && canUnsubscribeAtom(deletingAtom, subscribers)) {
      unsubscribeAtom(version, deletingAtom);
    }
  };

  const subscribeAtom = (
    atom: IAtom<unknown>,
    callback: (version?: HistoricalVersionObject) => void,
    version?: HistoricalVersionObject
  ) => {
    const subscriber = addAtom(version, atom);
    const listeners = subscriber.l;
    listeners.add(callback);

    return () => {
      listeners.delete(callback);
      deleteAtom(version, atom);
    };
  };

  const setAtomInvalidated = <Value>(
    version: HistoricalVersionObject | undefined,
    atom: IAtom<Value>
  ) => {
    const atomState = getAtomState(version, atom);
    if (atomState) {
      const nextAtomState: AtomState<Value> = {
        ...atomState,
        y: false,
      };

      setAtomState(version, atom, nextAtomState);
    }
  };

  const invalidateDependencies = <Value>(
    version: HistoricalVersionObject | undefined,
    atom: IAtom<Value>
  ) => {
    const subscriber = subscriberMap.get(atom);
    subscriber?.t.forEach((dependent) => {
      if (dependent !== atom) {
        setAtomInvalidated(version, dependent);
        invalidateDependencies(version, dependent);
      }
    });
  };

  return {
    readAtom,
    writeAtom,
    commitAtom,
    subscribeAtom,
  };
};

type Store = ReturnType<typeof createStore>;

export { createStore };

export type { Store, HistoricalVersionObject };
