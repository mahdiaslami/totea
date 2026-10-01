<script setup lang="ts">
import type { DayItem } from '@/modules/timeline/date'
import type { Task } from '@/modules/timeline/date'
import {
  TaskListRoot,
  TaskItemRoot,
  TaskItemTrigger,
  TaskItemCheckbox,
  TaskItemLabel,
} from '@/components/ui/task-list/index.ts'

defineProps<{
  day: DayItem
}>()

const emit = defineEmits<{
  (e: 'toggle', taskId: string): void
  (e: 'request-delete', task: Task): void
  (e: 'add-task'): void
  (e: 'next-day'): void
  (e: 'prev-day'): void
}>()
</script>

<template>
  <div class="flex h-full w-full flex-col overflow-hidden bg-white select-none">
    <!-- Day Header -->
    <header class="flex-shrink-0 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-md">
      <div class="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <!-- Date Info & Badge -->
        <div class="flex items-center gap-2.5">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95 cursor-pointer"
            aria-label="روز قبل"
            @click="emit('prev-day')"
          >
            <!-- In Persian RTL: arrow pointing right goes to past / previous day -->
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div>
            <div class="flex items-center gap-2">
              <h2
                class="text-lg font-bold"
                :class="day.date.isToday() ? 'text-sky-600' : 'text-slate-800'"
              >
                {{ day.date.weekdayName }}
              </h2>
              <span
                v-if="day.date.isToday()"
                class="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-700"
              >
                امروز
              </span>
              <span
                v-else-if="day.date.isTomorrow()"
                class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
              >
                فردا
              </span>
              <span
                v-else-if="day.date.isPast()"
                class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"
              >
                گذشته
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">{{ day.date.formatJalali() }}</p>
          </div>
        </div>

        <!-- Add Task Action Button & Next Day Arrow -->
        <div class="flex items-center gap-2">
          <button
            v-if="!day.date.isPast()"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-sky-600/20 transition-all hover:bg-sky-700 active:scale-95 cursor-pointer"
            @click="emit('add-task')"
          >
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>افزودن کار</span>
          </button>

          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95 cursor-pointer"
            aria-label="روز بعد"
            @click="emit('next-day')"
          >
            <!-- In Persian RTL: arrow pointing left goes to future / next day -->
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Scrollable Task List (Vertical Scroll per Day, with horizontal swipe allowed) -->
    <main
      class="flex-1 overflow-y-auto px-4 py-5 md:px-8"
      style="-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y;"
    >
      <div class="mx-auto max-w-2xl">
        <TaskListRoot
          :day="day"
          :past="day.date.isPast()"
          :toggle="(taskId: string) => emit('toggle', taskId)"
        >
          <TaskItemRoot
            v-for="task in day.tasks"
            :key="task.id"
            :task="task"
            :disabled="day.date.isPast()"
            @toggle="(taskId: string) => emit('toggle', taskId)"
            @request-delete="(t: Task) => emit('request-delete', t)"
          >
            <TaskItemTrigger>
              <TaskItemCheckbox />
              <TaskItemLabel />
            </TaskItemTrigger>
          </TaskItemRoot>
        </TaskListRoot>
      </div>
    </main>
  </div>
</template>
