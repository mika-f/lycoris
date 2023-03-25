# @natsuneko/lycoris

Lycoris is a state management library inspired by Recoil and Jotai but for Vue.

### Create a store context

```vue
<template>
  <slot />
</template>

<script lang="ts" setup>
import { useLycorisStore } from "@natsuneko/lycoris";

useLycorisStore();
</script>
```

### Create a primitive atom

```typescript
import { atom } from "@natsuneko/lycoris";

const countAtom = atom({
  key: "count",
  default: 0,
});

const countryAtom = atom({
  key: "country",
  default: "Japan",
});

const citiesAtom = atom({
  key: "cities",
  default: ["Tokyo", "Kyoto", "Osaka"],
});

const mangaAtom = atom({
  key: "manga",
  default: {
    "Lycoris Recoil": 2022,
    "Angel Beats!": 2010,
    "Expelled from Paradise": 2014,
  },
});
```

### Use the atom in your components

```vue
<template>
  <div>
    <h1>{{ count }}</h1>
    <button @click="onClick">one up</button>
  </div>
</template>

<script setup>
import { useLycorisState } from "@natsuneko/lycoris";

const [count, setCount] = useLycorisState(countAtom);

const onClick = () => {
  setCount((c) => c + 1);
};
</script>
```

### Create a selector from derived atom or other selector

```typescript
import { selector } from "@natsuneko/lycoris";

// read-only selector
const readonlyCounter = selector({
  get: ({ get }) => get(countAtom),
});

// writable selector
const writableCounter = selector({
  get: ({ get }) => get(countAtom),
  set: ({ set }, newValue) => set(countAtom, newValue * 2),
});
```

## Known Issues

I forgot it......

## License

Licensed under the MIT License.
