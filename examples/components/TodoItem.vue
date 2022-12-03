<template>
  <div>
    <input
      type="checkbox"
      :checked="todo.completed"
      @change="onToggleCompleted"
    />
    <span :style="{ 'text-decoration': todo.completed ? 'line-through' : '' }">
      {{ todo.title }}</span
    >
    &nbsp;
    <button @click="onRemove">delete</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { useSetLycorisState } from "../lycoris";
import todos from "../stores/todos";
import { Todo } from "./TodoList.vue";

export default defineComponent({
  props: {
    todo: {
      type: Object as PropType<Todo>,
      required: true,
    },
  },
  emits: {
    remove: (_todo: Todo) => {},
  },
  setup: (props, { emit }) => {
    const setItem = useSetLycorisState(todos);

    const onRemove = () => {
      emit("remove", props.todo);
    };

    const onToggleCompleted = () => {
      setItem((prev) => [
        ...prev.map((w) => {
          if (w.id === props.todo.id) w.completed = true;
          return w;
        }),
      ]);
    };

    return {
      // props
      todo: props.todo,

      // methods
      onRemove,
      onToggleCompleted,
    };
  },
});
</script>
