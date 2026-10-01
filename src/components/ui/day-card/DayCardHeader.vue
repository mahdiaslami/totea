<script setup lang="ts">
import { inject } from 'vue'
import type { DayCardContext } from './DayCardRoot.vue'

const ctx = inject('daycard') as DayCardContext | undefined
if (!ctx) throw new Error('DayCard.Header must be used inside DayCard.Root')

const emit = defineEmits<{
  (e: 'add-task'): void
}>()
</script>

<template>
  <header class="mb-4 flex flex-shrink-0 items-start justify-between gap-3">
    <div>
      <h2 class="text-lg font-bold" :class="ctx.isToday.value ? 'text-sky-600' : 'text-slate-800'">
        {{ ctx.date.weekdayName }}
      </h2>
      <p class="text-sm text-slate-400 mt-0.5">{{ ctx.date.formatJalali() }}</p>
    </div>
    <div class="flex items-center gap-2">
      <!-- Add Task Button for Today and Future days -->
      <button
        v-if="!ctx.past.value"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 bg-sky-50/80 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 hover:border-sky-300 active:scale-95 transition-all shadow-sm"
        @click="emit('add-task')"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span>افزودن کار</span>
      </button>

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
    </div>
  </header>
</template>
