<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTimelineStore } from '../stores/timeline'
import type { DayItem } from '../modules/timeline/date'
import {
  DayCardRoot,
  DayCardHeader,
  DayCardContent,
} from '../components/ui/day-card/index.ts'
import {
  TaskListRoot,
  TaskItemRoot,
  TaskItemTrigger,
  TaskItemCheckbox,
  TaskItemLabel,
} from '../components/ui/task-list/index.ts'

const store = useTimelineStore()
const { days } = storeToRefs(store)

const scrollContainer = ref<HTMLElement | null>(null)
const todayVisible = ref(true)
let loading = false
let observer: IntersectionObserver | null = null

function onScroll() {
  const el = scrollContainer.value
  if (!el || loading) return

  const { scrollTop, scrollHeight, clientHeight } = el

  if (scrollTop < 300) {
    loading = true
    const prevTop = scrollHeight - scrollTop
    store.prependPast()
    requestAnimationFrame(() => {
      if (scrollContainer.value) {
        const newTop = scrollContainer.value.scrollHeight - prevTop
        scrollContainer.value.scrollTop = newTop
      }
      loading = false
    })
  }

  if (scrollHeight - scrollTop - clientHeight < 300) {
    loading = true
    store.appendFuture()
    requestAnimationFrame(() => {
      loading = false
    })
  }
}

function scrollToToday() {
  const el = scrollContainer.value
  if (!el) return
  const card = el.querySelector<HTMLElement>('[data-today="true"]')
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function handleToggle(day: DayItem, taskId: string) {
  store.toggleTask(day, taskId)
}

function setupObserver() {
  if (!scrollContainer.value) return

  const todayCard = scrollContainer.value.querySelector('[data-today="true"]')
  if (!todayCard) return

  observer = new IntersectionObserver(
    (entries) => {
      todayVisible.value = entries[0].isIntersecting
    },
    {
      root: scrollContainer.value,
      threshold: 0.1,
    }
  )

  observer.observe(todayCard)
}

onMounted(() => {
  requestAnimationFrame(() => {
    scrollToToday()
    setupObserver()
  })
})
</script>

<template>
  <div class="flex h-screen flex-col bg-white">
    <main
      ref="scrollContainer"
      class="flex-1 overflow-y-auto overflow-x-hidden"
      @scroll="onScroll"
    >
      <div class="mx-auto flex flex-col max-w-2xl">
        <DayCardRoot
          v-for="day in days"
          :key="day.date.getTime()"
          :date="day.date"
        >
          <DayCardHeader />
          <DayCardContent>
            <TaskListRoot
              :day="day"
              :past="day.date.isPast()"
              :toggle="(taskId: string) => handleToggle(day, taskId)"
            >
              <TaskItemRoot
                v-for="task in day.tasks"
                :key="task.id"
                :task="task"
                :disabled="day.date.isPast()"
                @toggle="(taskId: string) => handleToggle(day, taskId)"
              >
                <TaskItemTrigger>
                  <TaskItemCheckbox />
                  <TaskItemLabel />
                </TaskItemTrigger>
              </TaskItemRoot>
            </TaskListRoot>
          </DayCardContent>
        </DayCardRoot>
        <p class="py-4 text-center text-xs text-slate-400">در حال بارگذاری روزهای بیشتر…</p>
      </div>
    </main>

    <button
      v-if="!todayVisible"
      class="fixed bottom-6 right-6 z-50 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700"
      @click="scrollToToday"
    >
      برگشت به امروز
    </button>
  </div>
</template>
