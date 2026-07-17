<script setup lang="ts">
import { inject } from 'vue'
import type { DayCardContext } from './DayCardRoot.vue'

const ctx = inject('daycard') as DayCardContext | undefined
if (!ctx) throw new Error('DayCard.Content must be used inside DayCard.Root')
</script>

<template>
  <div class="mt-4">
    <slot />
  </div>
</template>
