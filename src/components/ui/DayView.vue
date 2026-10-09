<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { DayItem } from '@/modules/timeline/date'
import type { Task } from '@/modules/timeline/date'
import type { PersianDate } from '@/modules/timeline/PersianDate'
import { toPersianDigits } from '@/modules/timeline/PersianDate'
import texturePatternImg from '@/assets/images/Texture-01-xs.png'
import { useListsStore } from '@/stores/lists'
import {
  TaskListRoot,
  TaskItemRoot,
  TaskItemTrigger,
  TaskItemCheckbox,
  TaskItemLabel,
} from '@/components/ui/task-list/index.ts'

const props = withDefaults(
  defineProps<{
    day: DayItem
    isSelectionMode?: boolean
    selectedTaskIds?: string[]
  }>(),
  {
    isSelectionMode: false,
    selectedTaskIds: () => [],
  }
)

const emit = defineEmits<{
  (e: 'toggle', taskId: string): void
  (e: 'select-task', task: Task): void
  (e: 'long-press-task', task: Task): void
  (e: 'open-calendar', date: PersianDate): void
}>()

const router = useRouter()
const listsStore = useListsStore()

const scheduledLists = computed(() => {
  return listsStore.getListsForDay(props.day.date)
})

function getCompletedCount(listId: string): number {
  return listsStore.getCompletedCountForDay(listId, props.day.date)
}

function navigateToList(listId: string) {
  if (props.isSelectionMode) return
  router.push({ path: '/lists', query: { id: listId } })
}

function isTaskSelected(taskId: string) {
  return props.selectedTaskIds.includes(taskId)
}
</script>

<template>
  <div class="flex h-full w-full flex-col overflow-hidden bg-white select-none">
    <!-- Day Header with soft elevation shadow over the task content below -->
    <header class="relative z-20 flex-shrink-0 border-b border-slate-100/80 bg-white/95 px-5 py-3.5 backdrop-blur-md shadow-sm shadow-slate-900/5">
      <div class="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <!-- Right side in RTL: Calendar Icon Button in the right corner, followed by Weekday & Date Info -->
        <div class="flex items-center gap-3">
          <!-- Calendar Icon Button: Larger size, located in the right corner of the header -->
          <button
            type="button"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-slate-100 shadow-2xs"
            :disabled="isSelectionMode"
            aria-label="مشاهده در تقویم"
            title="مشاهده در تقویم"
            @click="!isSelectionMode && emit('open-calendar', day.date)"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
      </div>
    </header>

    <!-- Scrollable Task List Area with deeper rich blue diagonal gradient and softer repeating texture -->
    <main
      class="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 py-5 pb-24 md:px-8 bg-gradient-to-br from-sky-100/90 via-sky-200/60 to-blue-200/70"
      style="-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y;"
    >
      <!-- Repeating Texture Overlay (subtle, faint, and soft) -->
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.055] mix-blend-multiply"
        :style="{
          backgroundImage: `url(${texturePatternImg})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto'
        }"
      />

      <div class="relative mx-auto flex h-full min-h-full max-w-2xl flex-col">
        <!-- Scheduled Project Lists for this day -->
        <div v-if="scheduledLists.length > 0" class="mb-3.5 flex flex-col gap-2">
          <div
            v-for="list in scheduledLists"
            :key="list.id"
            class="flex items-center justify-between gap-3 rounded-2xl bg-white/95 p-3 sm:p-3.5 shadow-sm border border-slate-200/70 backdrop-blur-xs transition hover:shadow-md hover:border-slate-300 active:scale-[0.99] cursor-pointer"
            @click="navigateToList(list.id)"
          >
            <!-- Right side: List icon (styled like calendar icon, slightly smaller) + List Title -->
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-2xs"
              >
                <!-- List icon matching header calendar icon aesthetic -->
                <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>

              <div class="min-w-0">
                <h3 class="text-sm font-normal text-slate-800 truncate">
                  {{ list.title }}
                </h3>
              </div>
            </div>

            <!-- Left side: Report of tasks completed on this day for this list -->
            <div class="flex items-center gap-2 shrink-0">
              <span
                class="px-2.5 py-1 rounded-xl text-xs font-normal transition flex items-center gap-1.5"
                :class="
                  getCompletedCount(list.id) > 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/80 shadow-2xs'
                    : 'bg-slate-100 text-slate-500'
                "
              >
                <svg
                  v-if="getCompletedCount(list.id) > 0"
                  class="h-3.5 w-3.5 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span>
                  {{
                    getCompletedCount(list.id) > 0
                      ? `${toPersianDigits(getCompletedCount(list.id))} کار انجام شد`
                      : 'هیچ کاری انجام نشد'
                  }}
                </span>
              </span>

              <svg class="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </div>
        </div>

        <TaskListRoot
          :day="day"
          :past="day.date.isPast()"
          :toggle="(taskId: string) => emit('toggle', taskId)"
          :has-other-content="scheduledLists.length > 0"
        >
          <TaskItemRoot
            v-for="task in day.tasks"
            :key="task.id"
            :task="task"
            :disabled="day.date.isPast()"
            :is-selected="isTaskSelected(task.id)"
            :is-selection-mode="isSelectionMode"
            @toggle="(taskId: string) => emit('toggle', taskId)"
            @select="(t: Task) => emit('select-task', t)"
            @long-press="(t: Task) => emit('long-press-task', t)"
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
