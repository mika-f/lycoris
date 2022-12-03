<template>
  <div>
    <div>
      <input type="radio" id="all" name="filter" value="all" v-model="value" />
      <label for="all">All</label>
    </div>
    <div>
      <input
        type="radio"
        id="completed"
        name="filter"
        value="completed"
        v-model="value"
      />
      <label for="completed">Completed</label>
    </div>
    <div>
      <input
        type="radio"
        id="incompleted"
        name="filter"
        value="incompleted"
        v-model="value"
      />
      <label for="incompleted">Incompleted</label>
    </div>
  </div>
</template>

<script lang="ts">
import { computed } from "@vue/reactivity";
import { defineComponent } from "vue";

import { useLycorisState } from "../lycoris";

import filterAtom from "../stores/filter";

export default defineComponent({
  setup: () => {
    const [filter, setFilter] = useLycorisState(filterAtom);

    const value = computed({
      get: () => filter.value,
      set: (newValue: string) => setFilter(newValue),
    });

    return {
      value,
    };
  },
});
</script>
