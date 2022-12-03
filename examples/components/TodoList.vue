<template>
  <div>
    <Filter />
    <form @submit.prevent="addTodo">
      <input v-model="title" name="title" type="text" placeholder="Type..." />
    </form>
    <Filtered @remove="removeTodo" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

import { UnwrapAtom, useSetLycorisState } from "../lycoris";
import todos from "../stores/todos";

import FilteredVue from "./Filtered.vue";
import FilterVue from "./Filter.vue";

type ToDos = UnwrapAtom<typeof todos>;

type UnwrapArray<T> = T extends Array<infer R> ? R : T;

export type Todo = UnwrapArray<ToDos>;

export type RemoveTodoFn = (todo: Todo) => void;

export default defineComponent({
  setup: () => {
    const setTodos = useSetLycorisState(todos);
    const title = ref("");

    const removeTodo = (todo: Todo) => {
      setTodos((prev) => prev.filter((item) => item.id !== todo.id));
    };

    const addTodo = () => {
      setTodos((prev) => [
        ...prev,
        { id: prev.length + 1, title: title.value, completed: false },
      ]);

      title.value = "";
    };

    return {
      // data
      title,
      // methods
      addTodo,
      removeTodo,
    };
  },
  components: { Filtered: FilteredVue, Filter: FilterVue },
});
</script>
