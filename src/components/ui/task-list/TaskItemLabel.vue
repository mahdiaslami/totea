<script setup lang="ts">
import { inject } from 'vue'
import type { TaskItemContext } from './TaskItemRoot.vue'
import { toPersianDigits } from '@/modules/timeline/PersianDate'

const ctx = inject('taskitem') as TaskItemContext | undefined
if (!ctx) throw new Error('TaskItem.Label must be used inside TaskItem.Root')
</script>

<template>
  <div class="flex-1 flex flex-col min-w-0">
    <span
      class="text-sm font-normal leading-6 break-words w-full"
      :class="{
        'text-slate-400 line-through': ctx.task.done,
        'text-slate-800': !ctx.task.done,
      }"
    >
      <slot>{{ ctx.task.title }}</slot>
    </span>

    <!-- Footnote Area (underneath the title on the left side) -->
    <div
      v-if="ctx.task.isTracked || ctx.task.completedWithDelay"
      class="flex items-center justify-end gap-1.5 w-full mt-1.5 select-none flex-wrap"
    >
      <!-- Delayed Completion Footnote Badge -->
      <span
        v-if="ctx.task.completedWithDelay"
        class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold shrink-0 transition-colors bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs"
        title="این کار با تعویق در تاریخی بعد از موعد اصلی انجام شده است"
      >
        <svg class="h-3 w-3 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>انجام با تعویق</span>
      </span>

      <!-- Tracked Task Rollover Badge -->
      <span
        v-if="ctx.task.isTracked"
        class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold shrink-0 transition-colors"
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
        <svg class="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
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
