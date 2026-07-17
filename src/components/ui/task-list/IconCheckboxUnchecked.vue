<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
  }>(),
  { size: 24 },
)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#0ea5e9"
    stroke-width="1.5"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="7.25" />
  </svg>
</template>
