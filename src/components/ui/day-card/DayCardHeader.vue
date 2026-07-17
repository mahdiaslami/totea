<script setup lang="ts">
import { inject } from 'vue'
import type { DayCardContext } from './DayCardRoot.vue'

const ctx = inject('daycard') as DayCardContext | undefined
if (!ctx) throw new Error('DayCard.Header must be used inside DayCard.Root')
</script>

<template>
  <header class="mb-4 flex items-start justify-between gap-3">
    <div>
      <h2 class="text-lg font-bold" :class="ctx.isToday.value ? 'text-sky-600' : 'text-slate-800'">
        {{ ctx.date.weekdayName }}
      </h2>
      <p class="text-sm text-slate-400 mt-0.5">{{ ctx.date.formatJalali() }}</p>
    </div>
    <slot name="badge">
      <span
        v-if="ctx.isToday.value"
        class="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700 whitespace-nowrap"
        >امروز</span
      >
      <span
        v-else-if="ctx.past.value"
        class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 whitespace-nowrap"
        >گذشته</span
      >
    </slot>
  </header>
</template>
