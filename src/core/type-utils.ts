import { LycorisState } from "./state";

type UnwrapAtom<T> = T extends LycorisState<infer R> ? R : never;

export type { UnwrapAtom };
