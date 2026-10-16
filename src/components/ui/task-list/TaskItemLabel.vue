<script setup lang="ts">
import { inject } from 'vue'
import type { TaskItemContext } from './TaskItemRoot.vue'
import { toPersianDigits } from '@/modules/timeline/PersianDate'

const ctx = inject('taskitem') as TaskItemContext | undefined
if (!ctx) throw new Error('TaskItem.Label must be used inside TaskItem.Root')
</script>

<template>
  <div class="flex-1 flex flex-col min-w-0">
    <div class="flex items-start justify-between gap-2 min-w-0">
      <span
        class="text-sm font-normal leading-6 break-words flex-1 min-w-0"
        :class="{
          'text-slate-400 line-through': ctx.task.done,
          'text-slate-800': !ctx.task.done,
        }"
      >
        <slot>{{ ctx.task.title }}</slot>
      </span>

      <!-- Tracked Task Rollover Badge (Only Icon and Number, no text) -->
      <span
        v-if="ctx.task.isTracked"
        class="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-bold shrink-0 transition-colors mt-0.5 select-none"
        :class="
          ctx.task.done
            ? 'bg-slate-100 text-slate-400'
            : (ctx.task.rolloverCount && ctx.task.rolloverCount > 0
                ? 'bg-amber-100/90 text-amber-800 border border-amber-200/90'
                : 'bg-sky-50 text-sky-700 border border-sky-200/80')
        "
        :title="
          ctx.task.rolloverCount && ctx.task.rolloverCount > 0
            ? `تسک پیگیری‌شونده (${toPersianDigits(ctx.task.rolloverCount)} بار منتقل شده)`
            : 'تسک پیگیری‌شونده'
        "
      >
        <!-- Rollover circular arrows icon -->
        <svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>

        <!-- Only the rollover count number, no Persian text -->
        <span
          v-if="ctx.task.rolloverCount && ctx.task.rolloverCount > 0"
          class="tabular-nums font-bold leading-none"
        >
          {{ toPersianDigits(ctx.task.rolloverCount) }}
        </span>
      </span>
    </div>
  </div>
</template>
