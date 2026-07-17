<script setup lang="ts">
import { inject } from 'vue'
import type { ScrollContext } from './ScrollProvider.vue'

const ctx = inject('scroll') as ScrollContext | undefined
if (!ctx) throw new Error('GoToBeginingButton must be used inside Scroll.Provider')
</script>

<template>
  <button
    v-if="!ctx.todayVisible.value"
    type="button"
    class="pointer-events-auto fixed bottom-6 right-6 z-50 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700"
    @click="ctx.scrollToToday"
  >
    <slot>برگشت به امروز</slot>
  </button>
</template>
