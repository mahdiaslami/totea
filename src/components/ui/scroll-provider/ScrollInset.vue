<script setup lang="ts">
import { inject } from 'vue'
import type { ScrollContext } from './ScrollProvider.vue'

const ctx = inject('scroll') as ScrollContext | undefined
if (!ctx) throw new Error('Scroll.Inset must be used inside Scroll.Provider')
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-50">
    <slot :today-visible="ctx.todayVisible.value" :scroll-to-today="ctx.scrollToToday" />
  </div>
</template>
