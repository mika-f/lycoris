<template>
  <slot />
</template>

<script lang="ts" setup>
import { useLycorisStore } from "../lycoris";

useLycorisStore();
</script>
