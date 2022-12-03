import { provide, inject, InjectionKey } from "vue-demi";
import { createStore, Store, HistoricalVersionObject } from "./store";

type Scope = InjectionKey<ScopeContainer> | string;

type VersionedWrite = (
  write: (version?: HistoricalVersionObject) => void
) => void;

type ScopeContainer = {
  s: Store;
  w?: VersionedWrite;
  v?: HistoricalVersionObject;
};

const createScopedStore = (scope: Scope): ScopeContainer => {
  const store = createStore();
  const container = { s: store };

  provide(scope, container);

  return container;
};

const DEFAULT_SCOPED_STORE = Symbol("LYCORIS-DEFAULT-STORE");

const getDefaultScopedStore = (): Scope => {
  return DEFAULT_SCOPED_STORE;
};

const getScopedStore = (scope?: Scope): ScopeContainer => {
  if (!scope) {
    return getScopedStore(getDefaultScopedStore());
  }

  const container = inject(scope);
  if (container) {
    return container;
  }

  return createScopedStore(scope);
};

export { getScopedStore };

export type { Scope };
