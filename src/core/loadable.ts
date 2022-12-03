type ValueLoadable<T> = () => T;

type Loadable<T> = ValueLoadable<T>;

export { Loadable };
