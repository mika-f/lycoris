import { reactive } from "vue-demi";

type Reducer<TState, TAction> = (prevState: TState, action: TAction) => TState;

type ReducerState<TReducer extends Reducer<any, any>> =
  TReducer extends Reducer<infer TState, any> ? TState : never;

type ReducerAction<TReducer extends Reducer<any, any>> =
  TReducer extends Reducer<any, infer TAction> ? TAction : never;

type ReducerInitializer<TReducer extends Reducer<any, any>, TInitializerArg> = (
  args: TInitializerArg
) => ReducerState<TReducer>;

type Dispatch<TAction> = (value: TAction) => void;

const useReducer = <TReducer extends Reducer<any, any>, TInitializerArgOrState>(
  reducer: TReducer,
  initializerArgOrState: TInitializerArgOrState,
  initializer: TInitializerArgOrState extends ReducerState<TReducer>
    ? undefined
    : ReducerInitializer<TReducer, TInitializerArgOrState>
) => {
  const state = reactive<{ value: ReducerState<TReducer> }>({
    value: initializer
      ? initializer(initializerArgOrState)
      : (initializerArgOrState as ReducerState<TReducer>),
  });

  const dispatch: Dispatch<ReducerAction<TReducer>> = (
    action: ReducerAction<TReducer>
  ) => {
    state.value = reducer(state.value, action);
  };

  return [state.value as ReducerState<TReducer>, dispatch] as const;
};

export { useReducer };

export type { Reducer, ReducerAction, ReducerState, Dispatch };
