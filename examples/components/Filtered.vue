<template>
  <div v-for="todo in todos" :key="todo.title">
    <TodoItem :todo="todo" @remove="onRemove" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useLycorisValue } from "../lycoris";
import TodoItem from "./TodoItem.vue";
import { Todo } from "./TodoList.vue";

import filtered from "../selectors/filterd";

export default defineComponent({
  emits: {
    remove: (_todo: Todo) => {},
  },
  setup: (_, { emit }) => {
    const todos = useLycorisValue(filtered);

    const onRemove = (todo: Todo) => {
      emit("remove", todo);
    };

    return { todos, onRemove };
  },
  components: { TodoItem },
});
</script>
